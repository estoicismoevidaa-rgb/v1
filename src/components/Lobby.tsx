/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, User, Users, ChevronLeft, Lock, Loader2, Trophy } from 'lucide-react';
import { GameRoom } from '../types.ts';
import { getPublicRooms, findOrCreatePublicRoom } from '../lib/supabase-service.ts';
import { generateCards } from '../lib/game-logic.ts';

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
    const interval = setInterval(fetchRooms, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  const handleJoinPublic = async (maxPlayers: number) => {
    if (!isLoggedIn) {
      onAuth();
      return;
    }
    setJoining(maxPlayers);
    try {
      // For public rooms, we use "Fácil" as default or let them choose?
      // User didn't specify difficulty for public rooms, let's use Médio for a balanced experience
      const difficulty = 'Médio';
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                onClick={() => onStartSolo('Médio', true)}
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
                  <Users className="w-6 h-6 text-blue-400" /> Salas Públicas
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
                          <span className="text-[10px] text-blue-400/60 uppercase font-bold tracking-widest">
                            Limite: {opt.players} Jogadores
                          </span>
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
              
              <p className="mt-8 text-center text-blue-400/40 text-[10px] font-bold uppercase tracking-widest">
                Novas salas são criadas automaticamente se necessário
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
