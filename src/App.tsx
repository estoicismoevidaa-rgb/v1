/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getOrCreateUserId, supabase } from './lib/supabase.ts';
import { getProfile, clearLocalProfile, updateUserStats, getRanking, updateProfile } from './lib/profile-service.ts';
import { 
  createRoom, 
  getRoom, 
  updateRoom, 
  joinRoom, 
  leaveRoom, 
  subscribeToRoom,
  sendCardFlip,
  sendCardReset,
  submitSoloTime,
  submitOnlineScore,
  getGlobalRanking
} from './lib/supabase-service.ts';
import { 
  Difficulty, 
  Card as CardType, 
  Player, 
  GameStatus, 
  GameRoom, 
  LocalRanking, 
  GameSettings 
} from './types.ts';
import { 
  generateCards, 
  DIFFICULTY_CONFIG, 
  calculateOnlineRankingPoints, 
  calculateSoloRankingPoints,
  OnlineScoreBreakdown 
} from './lib/game-logic.ts';
import { audioController } from './lib/audio.ts';

// Components
import { Home } from './components/Home.tsx';
import { ModeSelection } from './components/ModeSelection.tsx';
import { SoloConfig } from './components/SoloConfig.tsx';
import { LocalMPConfig } from './components/LocalMPConfig.tsx';
import { OnlineMPConfig } from './components/OnlineMPConfig.tsx';
import { WaitingRoom } from './components/WaitingRoom.tsx';
import { GameBoard } from './components/GameBoard.tsx';
import { ResultScreen } from './components/ResultScreen.tsx';
import { Settings } from './components/Settings.tsx';
import { Ranking } from './components/Ranking.tsx';
import { PauseMenu } from './components/PauseMenu.tsx';
import { AuthScreen } from './components/AuthScreen.tsx';
import { Lobby } from './components/Lobby.tsx';

import { BackgroundAnimation } from './components/BackgroundAnimation.tsx';

// Icons for the HUD
import { Timer, Hash, User, Menu } from 'lucide-react';

export default function App() {
  // Navigation & Flow
  const [screen, setScreen] = useState('home');
  const [mode, setMode] = useState<'solo' | 'local' | 'online'>('solo');
  const [isPaused, setIsPaused] = useState(false);
  
  // Game State
  const [cards, setCards] = useState<CardType[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>('Fácil');
  const [gameStatus, setGameStatus] = useState<GameStatus>('waiting');
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const isProcessingRef = useRef(false);

  // Sync ref with state
  useEffect(() => {
    isProcessingRef.current = isProcessing;
  }, [isProcessing]);
  const [attempts, setAttempts] = useState(0);
  const [time, setTime] = useState(0);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  
  // Online State
  const [onlineRoom, setOnlineRoom] = useState<GameRoom | null>(null);
  const [isOnlineSolo, setIsOnlineSolo] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [authError, setAuthError] = useState(false);
  
  // Persistence
  const [settings, setSettings] = useState<GameSettings>(() => {
    const saved = localStorage.getItem('fruit-memory-settings');
    return saved ? JSON.parse(saved) : {
      music: true,
      sfx: true,
      vibration: true,
      animations: true,
      theme: 'dark'
    };
  });

  const [ranking, setRanking] = useState<LocalRanking>(() => {
    const saved = localStorage.getItem('fruit-memory-ranking');
    return saved ? JSON.parse(saved) : { solo: [], multiplayer: [] };
  });
  const [globalRanking, setGlobalRanking] = useState<any[]>([]);
  const [rankingMode, setRankingMode] = useState<'solo' | 'versus' | 'total'>('total');
  const [loadingGlobal, setLoadingGlobal] = useState(false);

  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const navigateAfterAuth = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      console.log('Detected room in URL:', roomParam);
      setMode('online');
      setScreen('online-config');
    } else {
      setScreen('home');
    }
  }, []);

  // Initialize
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const uid = session.user.id;
          setCurrentUserId(uid);
          const profile = await getProfile(uid);
          if (profile) {
            setUserProfile(profile);
            navigateAfterAuth();
          } else {
            // Profile entry missing but auth exists - try to create it from metadata
            const username = session.user.user_metadata?.username || 'Jogador';
            const { error: upsertError } = await supabase.from('profiles').upsert([{
              uid,
              username,
              email: session.user.email,
              updated_at: new Date().toISOString()
            }]);
            
            if (!upsertError) {
              const newProfile = await getProfile(uid);
              setUserProfile(newProfile);
              navigateAfterAuth();
            } else {
              setScreen('home');
            }
          }
        } else {
          // Guest mode logic
          const uid = getOrCreateUserId();
          setCurrentUserId(uid);
          const profile = await getProfile(uid);
          if (profile) {
            setUserProfile(profile);
          } else {
            setUserProfile({
              uid,
              username: 'Jogador',
              isGuest: true
            });
          }
          setScreen('home');
        }
      } catch (err) {
        console.error('Auth check error:', err);
        setScreen('home');
      } finally {
        setIsAuthenticating(false);
      }
    };

    initAuth();
  }, [navigateAfterAuth]);

  const handleLogout = async () => {
    console.log('Starting logout process...');
    try {
      await supabase.auth.signOut();
      
      // Clear persistence completely for auth
      localStorage.removeItem('fruit-memory-user-id');
      
      // Reset authentication and profile state
      setCurrentUserId(null);
      setUserProfile(null);
      
      // Redirect back to Auth Screen
      setScreen('auth');
      
      console.log('Logout successful, redirected to AuthScreen');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleUpdateProfile = async (username: string, avatarUrl?: string) => {
    if (!currentUserId) return;
    const isGuest = userProfile?.isGuest || false;
    const updated = await updateProfile(currentUserId, username, avatarUrl, isGuest);
    setUserProfile(updated);
  };

  useEffect(() => {
    localStorage.setItem('fruit-memory-settings', JSON.stringify(settings));
    audioController.setSFXEnabled(settings.sfx);
    audioController.setMusicEnabled(settings.music);
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('fruit-memory-ranking', JSON.stringify(ranking));
  }, [ranking]);

  // Timer logic
  useEffect(() => {
    if (gameStatus === 'playing' && mode === 'solo' && !isPaused) {
      timerRef.current = setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gameStatus, isPaused, mode]);

  // Online listener
  useEffect(() => {
    if (mode === 'online' && onlineRoom?.status === 'playing' && screen === 'waiting-room') {
      setScreen('game');
    }
  }, [mode, onlineRoom?.status, screen]);

  // Online safety poller for waiting rooms
  useEffect(() => {
    if (mode === 'online' && onlineRoom?.id && (screen === 'waiting-room' || screen === 'game')) {
      const poller = setInterval(async () => {
        try {
            const freshRoom = await getRoom(onlineRoom.id!);
            if (freshRoom) {
              // Update the room state 
              setOnlineRoom(freshRoom);
              setPlayers(freshRoom.players);
              // Important: only sync cards if we are not currently processing a move
              // to avoid flickering and "stuck" cards during animations
              if (!isProcessingRef.current) {
                setCards(freshRoom.cards);
              }
              setGameStatus(freshRoom.status);
              
              // Heartbeat: Host refreshes updated_at to stay visible in public lobby
              if (freshRoom.ownerId === currentUserId && freshRoom.status === 'waiting') {
                updateRoom(freshRoom.id, {}).catch(() => {});
              }
            }
        } catch (e) {
          console.error("Polling error:", e);
        }
      }, 5000); // 5s fallback
      return () => clearInterval(poller);
    }
  }, [mode, onlineRoom?.id, onlineRoom?.status, onlineRoom?.players.length, onlineRoom?.currentPlayerIndex, screen]);

  // Online listener for room updates
  useEffect(() => {
    if (mode === 'online' && onlineRoom?.id) {
      let isUnsubscribed = false;
      let unsubscribeFn: (() => void) | null = null;

      const setupSubscription = async () => {
        try {
          const unsub = await subscribeToRoom(onlineRoom.id!, (data) => {
            if (isUnsubscribed) return;
            if (data) {
              // Ensure we merge states carefully
              setOnlineRoom(data);
              // Only sync cards if we are not actively processing a move transition
              if (!isProcessingRef.current) {
                setCards(data.cards || []);
              }
              setPlayers(data.players || []);
              setCurrentPlayerIndex(data.currentPlayerIndex ?? 0);
              setGameStatus(data.status || 'waiting');
              setDifficulty(data.difficulty || 'Fácil');
            } else {
              // Room deleted or host ended it
              if (screen === 'game' || screen === 'waiting-room') {
                setScreen('home');
                setOnlineRoom(null);
                alert('A sala foi fechada pelo host.');
              }
            }
          });
          
          if (isUnsubscribed) {
            unsub();
          } else {
            unsubscribeFn = unsub;
          }
        } catch (err) {
          console.error('Subscription setup failed:', err);
        }
      };

      setupSubscription();

      return () => {
        isUnsubscribed = true;
        if (unsubscribeFn) {
          unsubscribeFn();
        }
      };
    }
  }, [mode, onlineRoom?.id, screen]);

  // Game Actions
  const startGame = useCallback((selectedMode: 'solo' | 'local' | 'online', config: any) => {
    setMode(selectedMode);
    setDifficulty(config.difficulty);
    setTime(0);
    setAttempts(0);
    setIsPaused(false);
    setFlippedIndices([]);
    setIsProcessing(false);
    setScoreSubmitted(false);

    const initialCards = generateCards(config.difficulty);
    setCards(initialCards);

    if (selectedMode === 'solo') {
      setPlayers([{ uid: currentUserId || 'local', name: config.nickname, score: 0 }]);
      setCurrentPlayerIndex(0);
      setIsOnlineSolo(config.isOnline || false);
      setGameStatus('playing');
      setScreen('game');
    } else if (selectedMode === 'local') {
      const playerList = config.players.map((name: string, i: number) => ({
        uid: `local-${i}`,
        name,
        score: 0
      }));
      setPlayers(playerList);
      setCurrentPlayerIndex(0);
      setGameStatus('playing');
      setScreen('game');
    }
    // Online mode start is handled via WaitingRoom + Host action
  }, [currentUserId]);

  const handleOnlineCreate = async (nickname: string, diff: Difficulty, password?: string) => {
    if (!currentUserId) return;
    if (userProfile?.isGuest) {
      alert('É necessário criar uma conta ou fazer login para criar salas online.');
      setScreen('auth');
      return;
    }
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newRoom: GameRoom = {
      ownerId: currentUserId,
      status: 'waiting',
      difficulty: diff,
      players: [{ uid: currentUserId, name: nickname, score: 0, isHost: true }],
      cards: generateCards(diff),
      currentPlayerIndex: 0,
      password: password || undefined,
      maxPlayers: 6, // Default for private custom rooms
      isPublic: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      console.log('Attempting to create room:', roomId);
      await createRoom(roomId, newRoom);
      console.log('Room created successfully in service');
      setOnlineRoom({ ...newRoom, id: roomId });
      setCards(newRoom.cards);
      setPlayers(newRoom.players);
      setDifficulty(newRoom.difficulty);
      setGameStatus('waiting');
      setMode('online');
      setScreen('waiting-room');
    } catch (e: any) {
      console.error('Error creating room:', e);
      alert('Erro ao criar sala: ' + (e.message || String(e)));
    }
  };

  const handleOnlineJoin = async (nickname: string, roomId: string, password?: string) => {
    if (!currentUserId) return;
    if (userProfile?.isGuest) {
      alert('É necessário criar uma conta ou fazer login para jogar online.');
      setScreen('auth');
      return;
    }
    try {
      console.log('Attempting to join room:', roomId);
      const room = await getRoom(roomId);
      if (!room) {
        alert('Sala não encontrada! Verifique o código.');
        return;
      }

      // Password check
      if (room.password && room.password !== password) {
        alert('Senha incorreta!');
        return;
      }

      console.log('Room found and password verified, joining...');
      if (room.ownerId) {
        if (room.status !== 'waiting') {
          alert('A partida já começou ou terminou!');
          return;
        }
        if (room.players.length >= 6) {
          alert('Sala lotada!');
          return;
        }
      }

      const newPlayer = { uid: currentUserId, name: nickname, score: 0 };
      await joinRoom(roomId, newPlayer);

      setOnlineRoom({ ...room, id: roomId });
      if (room.cards && room.cards.length > 0) setCards(room.cards);
      if (room.players && room.players.length > 0) setPlayers(room.players);
      setDifficulty(room.difficulty);
      setMode('online');
      setScreen('waiting-room');
    } catch (e: any) {
      console.error('Error joining room:', e);
      alert('Erro ao entrar na sala: ' + (e.message || String(e)));
    }
  };

  const handleOnlineStart = async () => {
    if (!onlineRoom?.id) return;
    try {
      await updateRoom(onlineRoom.id, {
        status: 'playing',
        gameStartedAt: new Date().toISOString()
      });
      setScreen('game');
    } catch (e) {
      console.error('Error starting room:', e);
    }
  };

  const handleOnlineLeave = async () => {
    if (!onlineRoom?.id || !currentUserId) return;
    try {
      await leaveRoom(onlineRoom.id, currentUserId);
      setScreen('home');
      setOnlineRoom(null);
    } catch (e) {
      console.error(e);
      setScreen('home');
      setOnlineRoom(null);
    }
  };

  // Submit score when game finishes
  useEffect(() => {
    if (gameStatus === 'finished' && !scoreSubmitted && mode === 'online' && currentUserId) {
      setScoreSubmitted(true);
      const myPlayer = players.find(p => p.uid === currentUserId);
      if (myPlayer) {
        const sorted = [...players].sort((a, b) => b.score - a.score);
        const rank = sorted.findIndex(p => p.uid === currentUserId) + 1;
        const breakdown = calculateOnlineRankingPoints(rank, players.length, myPlayer.score, myPlayer.maxCombo);
        const isSolo = players.length === 1;
        submitOnlineScore(currentUserId, breakdown.totalPoints, myPlayer.name, isSolo).catch(console.error);
      }
    }
  }, [gameStatus, scoreSubmitted, mode, currentUserId, players]);

  // Turn management
  const nextTurn = useCallback(() => {
    const nextIndex = (currentPlayerIndex + 1) % players.length;
    setCurrentPlayerIndex(nextIndex);
    if (mode === 'online' && onlineRoom?.id) {
      updateRoom(onlineRoom.id, {
        currentPlayerIndex: nextIndex
      }).catch(e => console.error(e));
    }
  }, [currentPlayerIndex, players.length, mode, onlineRoom?.id]);

  const handleCardClick = async (index: number) => {
    if (isProcessing || cards[index].isFlipped || cards[index].isMatched) return;
    
    // Online check: only current player can click
    if (mode === 'online' && onlineRoom) {
      if (players[currentPlayerIndex].uid !== currentUserId) return;
    }

    audioController.play('flip');
    
    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);
    
    // Fast signal for visual feedback to other online players
    if (mode === 'online' && onlineRoom?.id) {
      sendCardFlip(onlineRoom.id, index);
      // AUTHORITATIVE SYNC: Also update DB immediately so observers see it
      updateRoom(onlineRoom.id, { cards: newCards });
    }
    
    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setIsProcessing(true);
      setAttempts(prev => prev + 1);
      
      const [firstIdx, secondIdx] = newFlipped;
      const isMatch = cards[firstIdx].fruit === cards[secondIdx].fruit;

      setTimeout(async () => {
        const updatedCards = [...newCards];
        if (isMatch) {
          updatedCards[firstIdx].isMatched = true;
          updatedCards[secondIdx].isMatched = true;
          
          const newPlayers = [...players];
          const currentP = newPlayers[currentPlayerIndex];
          currentP.score += 1;
          currentP.currentCombo = (currentP.currentCombo || 0) + 1;
          
          if (currentP.currentCombo > 1) {
            audioController.play('combo');
          } else {
            audioController.play('match');
          }

          if (currentP.currentCombo > (currentP.maxCombo || 0)) {
            currentP.maxCombo = currentP.currentCombo;
          }
          setPlayers(newPlayers);

          setFlippedIndices([]);
          setIsProcessing(false);

          // Check Win Condition
          const allMatched = updatedCards.every(c => c.isMatched);
          if (allMatched) {
            setGameStatus('finished');
            
            if (mode === 'solo') {
              const errors = attempts + 1 - DIFFICULTY_CONFIG[difficulty].pairs;
              const soloResult = calculateSoloRankingPoints(difficulty, time, errors);
              const points = soloResult.totalPoints;

              updateSoloRanking(time, attempts + 1);
              if (currentUserId) {
                if (isOnlineSolo) {
                  // Only call submitSoloTime which now handles best times and points for solo online
                  submitSoloTime(currentUserId, userProfile?.username || 'Anônimo', difficulty, time, errors);
                } else {
                  // For normal solo (not online ranking), just update generic stats
                  updateUserStats(currentUserId, difficulty, time, points, 'solo');
                }
              }
            } else if (mode === 'local') {
              const winner = [...newPlayers].sort((a,b) => b.score - a.score)[0];
              updateMultiplayerRanking(winner.name);
            }
          }

          // Online Update: Match found
          if (mode === 'online' && onlineRoom?.id) {
            await updateRoom(onlineRoom.id, {
              cards: updatedCards,
              players: newPlayers,
              status: allMatched ? 'finished' : 'playing'
            });
          }
        } else {
          audioController.play('error');
          updatedCards[firstIdx].isFlipped = false;
          updatedCards[secondIdx].isFlipped = false;
          
          setCards(updatedCards);
          setFlippedIndices([]);
          setIsProcessing(false);
          
          let nextIndex = currentPlayerIndex;
          let updatedPlayers = [...players];

          if (mode !== 'solo') {
            updatedPlayers[currentPlayerIndex].currentCombo = 0;
            setPlayers(updatedPlayers);
            nextIndex = (currentPlayerIndex + 1) % players.length;
            setCurrentPlayerIndex(nextIndex);
          }

          if (mode === 'online' && onlineRoom?.id) {
            // Signal others immediately
            sendCardReset(onlineRoom.id, [firstIdx, secondIdx]);
            
            // Single consolidated update to avoid race conditions
            await updateRoom(onlineRoom.id, {
              cards: updatedCards,
              currentPlayerIndex: nextIndex,
              players: updatedPlayers
            });
          }
        }
      }, 1000);
    }
  };

  const updateSoloRanking = (finalTime: number, finalAttempts: number) => {
    const entry = {
      difficulty,
      bestTime: finalTime,
      attempts: finalAttempts,
      nickname: players[0].name
    };
    setRanking(prev => ({
      ...prev,
      solo: [...prev.solo, entry].sort((a, b) => a.bestTime - b.bestTime).slice(0, 50)
    }));
  };

  const updateMultiplayerRanking = (winnerName: string) => {
    setRanking(prev => {
      const newRanking = { ...prev };
      const idx = newRanking.multiplayer.findIndex(p => p.nickname === winnerName);
      if (idx >= 0) {
        newRanking.multiplayer[idx].wins += 1;
      } else {
        newRanking.multiplayer.push({ nickname: winnerName, wins: 1 });
      }
      return newRanking;
    });
  };

  const clearRanking = () => {
    if (confirm('Deseja limpar todos os rankings locais?')) {
      setRanking({ solo: [], multiplayer: [] });
    }
  };

  const restartGame = () => {
    setScoreSubmitted(false);
    if (mode === 'online' && onlineRoom?.id) {
      // Re-generate cards and reset status
      const newCards = generateCards(difficulty);
      const resetPlayers = players.map(p => ({ ...p, score: 0 }));
      updateRoom(onlineRoom.id, {
        status: 'playing',
        cards: newCards,
        players: resetPlayers,
        currentPlayerIndex: 0
      });
    } else {
      setCards(generateCards(difficulty));
      setPlayers(players.map(p => ({ ...p, score: 0 })));
      setCurrentPlayerIndex(0);
      setTime(0);
      setAttempts(0);
      setGameStatus('playing');
      setIsPaused(false);
      setScreen('game');
    }
  };

  useEffect(() => {
    if (screen === 'ranking' || screen === 'lobby') {
      setLoadingGlobal(true);
      getGlobalRanking(rankingMode).then(res => {
        setGlobalRanking(res);
        setLoadingGlobal(false);
      }).catch(() => setLoadingGlobal(false));
    }
  }, [screen, rankingMode]);

  // Rendering
  const renderHUD = () => {
    const currentPlayer = players[currentPlayerIndex];
    return (
      <div className="flex flex-wrap justify-between items-center gap-4 bg-blue-900/40 p-4 rounded-2xl border border-blue-700 mb-6 backdrop-blur-md sticky top-4 z-40">
        <div className="flex items-center gap-6">
          {mode === 'solo' ? (
            <>
              <div className="flex items-center gap-2">
                <Timer className="w-5 h-5 text-green-400" />
                <span className="font-mono text-xl">{time}s</span>
              </div>
              <div className="flex items-center gap-2">
                <Hash className="w-5 h-5 text-blue-400" />
                <span className="font-bold text-xl">{attempts}</span>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-600 rounded-lg animate-pulse">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-blue-300 uppercase font-bold">Vez de</p>
                <p className="text-lg font-bold">{currentPlayer?.name}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {mode !== 'solo' && (
            <div className="hidden sm:flex gap-3">
              {players.map((p, i) => (
                <div key={p.uid} className={`px-3 py-1 rounded-lg border ${i === currentPlayerIndex ? 'bg-green-600 border-green-400' : 'bg-blue-950 border-blue-800'}`}>
                  <span className="text-xs font-bold">{p.name}: {p.score}</span>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => setIsPaused(true)} className="p-3 bg-blue-700 hover:bg-blue-600 rounded-xl transition-all active:scale-95 shadow-lg">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${settings.theme === 'dark' ? 'bg-[#0a0f1e]' : 'bg-gray-100'} transition-colors font-sans selection:bg-green-500 selection:text-white pb-10 overflow-x-hidden relative`}>
      {screen === 'home' && <BackgroundAnimation />}
      <header className="py-6 px-4">
        {/* Placeholder for header if needed */}
      </header>

      <main className="container mx-auto px-4 max-w-5xl relative z-10">
        {screen === 'auth' && (
          <AuthScreen 
            currentUid={currentUserId || getOrCreateUserId()} 
            onBack={() => setScreen('home')}
            onAuthenticated={(profile) => {
              setCurrentUserId(profile.uid);
              setUserProfile(profile);
              navigateAfterAuth();
            }} 
          />
        )}

        {screen === 'home' && (
          <Home 
            onNavigate={setScreen} 
            onLogout={handleLogout}
            username={userProfile?.username}
            avatarUrl={userProfile?.avatarUrl}
          />
        )}

        {screen === 'mode-selection' && (
          <ModeSelection onNavigate={setScreen} onChoice={(m) => {
            const isLoggedInUser = userProfile && !userProfile.isGuest;
            if ((m === 'lobby' || m === 'online') && !isLoggedInUser) {
              setScreen('auth');
            } else if (m === 'lobby') {
              setScreen('lobby');
            } else {
              setMode(m as any);
              setScreen(`${m}-config`);
            }
          }} />
        )}

        {screen === 'solo-config' && (
          <SoloConfig 
            onBack={() => setScreen('mode-selection')} 
            onStart={(nick, diff) => startGame('solo', { nickname: nick, difficulty: diff })}
            initialNickname={userProfile?.username}
          />
        )}

        {screen === 'local-config' && (
          <LocalMPConfig 
            onBack={() => setScreen('mode-selection')} 
            onStart={(p, diff) => startGame('local', { players: p, difficulty: diff })}
          />
        )}

        {screen === 'online-config' && (
          <OnlineMPConfig 
            onBack={() => setScreen('mode-selection')}
            onCreate={handleOnlineCreate}
            onJoin={handleOnlineJoin}
            initialNickname={userProfile?.username}
          />
        )}

        {screen === 'lobby' && (
          <Lobby 
            onBack={() => setScreen('mode-selection')}
            onJoinRoom={(roomId) => handleOnlineJoin(userProfile?.username || 'Jogador', roomId)}
            onStartSolo={(diff, isOnline) => startGame('solo', { nickname: userProfile?.username || 'Jogador', difficulty: diff, isOnline })}
            isLoggedIn={!!userProfile}
            onAuth={() => setScreen('auth')}
          />
        )}

        {screen === 'waiting-room' && onlineRoom && currentUserId && (
          <WaitingRoom 
            room={onlineRoom} 
            userId={currentUserId} 
            onStart={handleOnlineStart}
            onLeave={handleOnlineLeave}
          />
        )}

        {screen === 'game' && (
          gameStatus === 'finished' ? (
            <ResultScreen 
              mode={mode}
              players={players}
              difficulty={difficulty}
              time={time}
              attempts={attempts}
              onRestart={restartGame}
              onMenu={() => { 
                if (mode === 'online') {
                  handleOnlineLeave();
                } else {
                  setScreen('home'); 
                  setGameStatus('waiting'); 
                }
              }}
              onChangeDifficulty={() => setScreen(`${mode}-config`)}
            />
          ) : (
            <>
              {renderHUD()}
              <GameBoard 
                cards={cards} 
                difficulty={difficulty} 
                onCardClick={handleCardClick}
                disabled={isProcessing || (mode === 'online' && players[currentPlayerIndex]?.uid !== currentUserId)}
              />
              
              <div className="mt-8 flex justify-center gap-4 sm:hidden overflow-x-auto pb-4 px-2 w-full">
                {players.map((p, i) => (
                  <div key={p.uid} className={`flex-shrink-0 px-4 py-2 rounded-xl border ${i === currentPlayerIndex ? 'bg-green-600 border-green-400 text-white' : 'bg-blue-900/40 border-blue-800 text-blue-300'}`}>
                    <p className="text-[10px] uppercase opacity-60">Score</p>
                    <p className="font-bold">{p.name}: {p.score}</p>
                  </div>
                ))}
              </div>
            </>
          )
        )}

        {screen === 'ranking' && (
          <Ranking 
            ranking={ranking} 
            globalRanking={globalRanking}
            loadingGlobal={loadingGlobal}
            mode={rankingMode}
            onModeChange={setRankingMode}
            onClear={clearRanking} 
            onBack={() => setScreen('home')} 
          />
        )}

        {screen === 'settings' && (
          <Settings 
            settings={settings} 
            onUpdate={setSettings} 
            onBack={() => setScreen('home')} 
            onLogout={handleLogout}
            userProfile={userProfile}
            onUpdateProfile={handleUpdateProfile}
          />
        )}

        {screen === 'how-to-play' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-white">
            <div className="w-full max-w-lg bg-blue-900/40 p-8 rounded-3xl border border-blue-700 shadow-2xl">
               <h2 className="text-3xl font-bold mb-6">Como Jogar</h2>
               <div className="space-y-4 text-blue-100">
                  <p>1. Escolha um modo de jogo: Solo ou Multiplayer.</p>
                  <p>2. No seu turno, vira duas cartas.</p>
                  <p>3. Se as frutas forem iguais, você ganha um ponto e continua jogando.</p>
                  <p>4. Se forem diferentes, as cartas voltam a fechar e a vez passa para o próximo jogador.</p>
                  <p>5. O jogo termina quando todos os pares forem encontrados!</p>
               </div>
               <button onClick={() => setScreen('home')} className="w-full mt-8 py-4 bg-blue-600 rounded-2xl font-bold">Voltar</button>
            </div>
          </div>
        )}

        {screen === 'credits' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-white">
            <div className="w-full max-w-lg bg-blue-900/40 p-8 rounded-3xl border border-blue-700 shadow-2xl text-center">
               <h2 className="text-3xl font-bold mb-6">Créditos</h2>
               <p className="text-blue-200 mb-2">Desenvolvido com ❤️ usando:</p>
               <div className="flex flex-wrap justify-center gap-3 my-6">
                 {['React', 'Firebase', 'Vite', 'Tailwind CSS', 'Framer Motion', 'Lucide Icons'].map(tag => (
                   <span key={tag} className="px-3 py-1 bg-blue-800 rounded-full text-xs font-bold">{tag}</span>
                 ))}
               </div>
               <p className="text-sm text-blue-400">© 2026 Jogo da Memória Frutas</p>
               <button onClick={() => setScreen('home')} className="w-full mt-8 py-4 bg-blue-600 rounded-2xl font-bold">Voltar</button>
            </div>
          </div>
        )}
      </main>

      <PauseMenu 
        isOpen={isPaused}
        onClose={() => setIsPaused(false)}
        onRestart={() => { restartGame(); setIsPaused(false); }}
        onSettings={() => { setScreen('settings'); setIsPaused(false); }}
        onMenu={() => { 
          if (mode === 'online') {
            handleOnlineLeave();
          } else {
            setScreen('home'); 
            setGameStatus('waiting'); 
          }
          setIsPaused(false); 
        }}
      />
    </div>
  );
}
