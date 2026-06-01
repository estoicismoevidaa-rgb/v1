/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, User, Users, ChevronLeft, Lock, Loader2, Trophy, MessageSquare, Send, Circle, List } from 'lucide-react';
import { GameRoom } from '../types.ts';
import { getPublicRooms, findOrCreatePublicRoom, subscribeToLobby, sendLobbyMessage } from '../lib/supabase-service.ts';
import { generateCards } from '../lib/game-logic.ts';
import { getOrCreateUserId } from '../lib/supabase.ts';

interface LobbyProps {
  onBack: () => void;
  onJoinRoom: (roomId: string, maxPlayers?: number) => void;
  onStartSolo: (difficulty: string, isOnline: boolean) => void;
  isLoggedIn: boolean;
  onAuth: () => void;
}

export function Lobby({ onBack, onJoinRoom, onStartSolo, isLoggedIn, onAuth }: LobbyProps) {
  const [rooms, setRooms] = useState<GameRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<number | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const currentUserId = getOrCreateUserId();

  const fetchRooms = async () => {
    try {
      const publicRooms = await getPublicRooms();
      setRooms(publicRooms);
    } catch (err) {
      console.error('Error fetching rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 5000); // Poll every 5s for more reactive lobby
    
    // Subscribe to global lobby for users and chat
    let unsubscribe: (() => void) | null = null;
    subscribeToLobby((users, msgs) => {
      setOnlineUsers(users);
      setMessages(msgs);
    }).then(unsub => unsubscribe = unsub);

    return () => {
      clearInterval(interval);
      if (unsubscribe) unsubscribe();
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    sendLobbyMessage(newMessage.trim());
    setNewMessage('');
  };

  const handleJoinPublic = async (maxPlayers: number) => {
    if (!isLoggedIn) {
      onAuth();
      return;
    }
    setJoining(maxPlayers);
    try {
      // All online matches are forced to "Difícil" (Hard)
      const difficulty = 'Difícil';
      const cards = generateCards(difficulty);
      const roomId = await findOrCreatePublicRoom(maxPlayers, difficulty, cards);
      onJoinRoom(roomId, maxPlayers);
    } catch (err) {
      console.error('Join error:', err);
      setJoining(null);
    }
  };

  const publicOptions = [
    { players: 2, label: 'Dueto Online', icon: <Users className="w-6 h-6" /> },
    { players: 3, label: 'Trio Online', icon: <Users className="w-6 h-6" /> },
    { players: 4, label: 'Squad Online', icon: <Users className="w-6 h-6" /> },
    { players: 5, label: 'Quinteto Online', icon: <Users className="w-6 h-6" /> },
    { players: 6, label: 'Sexteto Online', icon: <Users className="w-6 h-6" /> },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-4 text-white">
      <div className="w-full max-w-4xl">
        <button 
          onClick={onBack}
          className="mb-8 flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors font-bold px-4 py-2 bg-blue-900/30 rounded-xl"
        >
          <ChevronLeft className="w-5 h-5" /> Voltar
        </button>

        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center justify-center p-3 bg-blue-600 rounded-2xl mb-4"
          >
            <Globe className="w-8 h-8" />
          </motion.div>
          <h1 className="text-4xl font-black tracking-tight mb-2">Lobby Online</h1>
          <p className="text-blue-400 font-medium">Encontre jogadores de todo o mundo</p>
        </div>

        {!isLoggedIn && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-yellow-500/10 border border-yellow-500/20 p-6 rounded-3xl mb-8 flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-500/20 rounded-2xl">
                <Lock className="w-6 h-6 text-yellow-500" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-yellow-500">Modo Convidado</h3>
                <p className="text-xs text-yellow-500/70">Faça login para salvar recordes no ranking global e jogar online.</p>
              </div>
            </div>
            <button 
              onClick={onAuth}
              className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-black rounded-2xl transition-all shadow-lg active:scale-95"
            >
              Fazer Login agora
            </button>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Solo Online Section */}
          <div className="lg:col-span-1">
            <motion.div
              whileHover={{ y: -5 }}
              className="bg-gradient-to-br from-green-600/20 to-green-900/40 p-8 rounded-[2.5rem] border border-green-500/30 h-full flex flex-col"
            >
              <div className="mb-6 p-4 bg-green-500/20 rounded-3xl w-fit">
                <Trophy className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-2xl font-black mb-2">Solo Online</h2>
              <p className="text-green-400/70 text-sm mb-8 flex-grow">
                Jogue sozinho e tente ficar no Top 3 do ranking mundial. Seu melhor tempo será salvo permanentemente.
              </p>
              <button
                disabled={!isLoggedIn}
                onClick={() => onStartSolo('Difícil', true)}
                className={`w-full py-4 rounded-2xl font-black text-lg transition-all shadow-xl active:scale-95 ${
                  isLoggedIn 
                  ? 'bg-green-500 hover:bg-green-400 text-black shadow-green-500/20' 
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
                }`}
              >
                {isLoggedIn ? 'Jogar e Pontuar' : 'Necessário Login'}
              </button>
            </motion.div>
          </div>

          {/* Multiplayer Public Rooms */}
          <div className="lg:col-span-2">
            <div className="bg-blue-900/40 p-8 rounded-[2.5rem] border border-blue-700 h-full">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black flex items-center gap-3">
                  <Globe className="w-6 h-6 text-blue-400" /> Partida Rápida
                </h2>
                {loading && <Loader2 className="w-5 h-5 animate-spin text-blue-400" />}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {publicOptions.map((opt) => {
                  const activeRooms = rooms.filter(r => r.maxPlayers === opt.players);
                  const totalPlayers = activeRooms.reduce((acc, r) => acc + r.players.length, 0);
                  
                  return (
                    <motion.button
                      key={opt.players}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleJoinPublic(opt.players)}
                      disabled={joining !== null}
                      className="relative overflow-hidden group p-5 bg-blue-950/50 rounded-3xl border border-blue-800/50 text-left hover:border-blue-400/50 transition-all flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/10 rounded-2xl group-hover:bg-blue-500/20 transition-colors">
                          <Users className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                          <span className="block font-black text-lg">{opt.label}</span>
                          <div className="flex gap-2 items-center">
                            <span className="text-[10px] text-blue-400/60 uppercase font-bold tracking-widest">
                              {opt.players} Jogadores
                            </span>
                            <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-black">DIFÍCIL</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end">
                        {joining === opt.players ? (
                          <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-xs font-bold text-green-400">{totalPlayers} jogando</span>
                          </div>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
              
              <p className="mt-8 text-center text-blue-400/40 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-4">
                <span>Você será pareado automaticamente</span>
                <span className="bg-blue-500/10 px-2 py-1 rounded text-blue-300">Modo Online: Difícil — 36 cartas</span>
              </p>
            </div>
          </div>
        </div>

        {/* List of active rooms */}
        <div className="bg-blue-900/40 p-8 rounded-[2.5rem] border border-blue-700 mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black flex items-center gap-2">
              <List className="w-5 h-5 text-blue-400" /> Salas Públicas ({rooms.length})
            </h2>
            <button onClick={fetchRooms} className="text-xs text-blue-400 hover:text-blue-300 font-bold uppercase underline">
              Atualizar
            </button>
          </div>
          
          <div className="space-y-3">
            {rooms.length > 0 ? (
              rooms.map((room) => (
                <div key={room.id} className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-blue-950/40 rounded-3xl border border-white/5 hover:border-blue-500/30 transition-all">
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="w-12 h-12 bg-blue-800 rounded-2xl flex items-center justify-center font-bold text-blue-200">
                      {room.maxPlayers}
                    </div>
                    <div>
                      <p className="font-black text-lg">Sala {room.id}</p>
                      <div className="flex gap-2 items-center">
                        <span className="text-[10px] text-blue-400 font-bold uppercase">{room.players.length}/{room.maxPlayers} Jogadores</span>
                        <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-black">DIFÍCIL</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <span className="px-3 py-1 bg-green-500/10 text-green-400 text-[10px] font-black uppercase rounded-lg border border-green-500/20">
                      Aguardando
                    </span>
                    <button 
                      onClick={() => onJoinRoom(room.id!)}
                      className="flex-grow sm:flex-grow-0 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-black text-sm transition-all shadow-lg active:scale-95"
                    >
                      Entrar
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 opacity-30 text-sm italic font-medium">
                Nenhuma sala pública aberta no momento. Crie uma nova!
              </div>
            )}
          </div>
        </div>

        {/* Community & Chat Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-blue-900/40 p-8 rounded-[2.5rem] border border-blue-700 h-full min-h-[400px]">
              <h2 className="text-xl font-black mb-6 flex items-center gap-3">
                <Users className="w-5 h-5 text-green-400" /> Online ({onlineUsers.length})
              </h2>
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {onlineUsers.map((user) => (
                  <div key={user.uid} className="flex items-center justify-between p-3 bg-blue-950/30 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-800 rounded-xl flex items-center justify-center font-bold text-blue-300">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{user.name}</p>
                        <p className="text-[10px] text-green-400 flex items-center gap-1">
                          <Circle className="w-2 h-2 fill-current" /> Ativo agora
                        </p>
                      </div>
                    </div>
                    {user.uid === currentUserId && (
                      <span className="text-[9px] bg-blue-600 px-2 py-1 rounded-full font-bold uppercase tracking-tighter">Você</span>
                    )}
                  </div>
                ))}
                {onlineUsers.length === 0 && (
                  <p className="text-center text-blue-400/50 py-10 italic">Nenhum jogador online</p>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-blue-900/40 p-8 rounded-[2.5rem] border border-blue-700 h-full flex flex-col min-h-[450px]">
              <h2 className="text-xl font-black mb-6 flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-blue-400" /> Chat da Comunidade
              </h2>
              
              <div className="flex-grow mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex flex-col ${msg.senderId === currentUserId ? 'items-end' : 'items-start'}`}>
                    <div className={`p-4 rounded-2xl max-w-[85%] ${
                      msg.senderId === currentUserId 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-blue-950/80 text-blue-100 rounded-tl-none border border-white/5'
                    }`}>
                      {msg.senderId !== currentUserId && (
                        <p className="text-[10px] font-black text-blue-400 mb-1 uppercase tracking-wider">{msg.sender}</p>
                      )}
                      <p className="text-sm">{msg.text}</p>
                    </div>
                    <span className="text-[9px] text-white/30 mt-1 px-1">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
                {messages.length === 0 && (
                  <div className="flex-grow flex flex-col items-center justify-center opacity-30 text-center">
                    <MessageSquare className="w-12 h-12 mb-4" />
                    <p>Seja o primeiro a dizer olá!</p>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="relative">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  className="w-full bg-blue-950/50 border border-blue-700/50 rounded-2xl py-4 pl-6 pr-14 focus:outline-none focus:border-blue-500 transition-all text-sm"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-2 p-3 bg-blue-600 hover:bg-blue-500 rounded-xl transition-all active:scale-95"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
