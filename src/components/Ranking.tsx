/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Trash2, Clock, Swords, Globe, Trophy, Users, User } from 'lucide-react';
import { LocalRanking, RankingEntry } from '../types.ts';

interface RankingProps {
  ranking: LocalRanking;
  globalRanking: RankingEntry[];
  loadingGlobal: boolean;
  mode: 'solo' | 'versus' | 'total';
  onModeChange: (mode: 'solo' | 'versus' | 'total') => void;
  onClear: () => void;
  onBack: () => void;
}

export function Ranking({ ranking, globalRanking, loadingGlobal, mode, onModeChange, onClear, onBack }: RankingProps) {
  const [tab, setTab] = useState<'global' | 'local'>('global');

  const filteredRanking = globalRanking; // Already filtered/ordered by API
  const podium = filteredRanking.slice(0, 3);
  const remaining = filteredRanking.slice(3);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-4 text-white">
      <div className="w-full max-w-4xl">
        <button 
          onClick={onBack} 
          className="mb-8 flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors font-bold px-4 py-2 bg-blue-900/30 rounded-xl"
        >
          <ChevronLeft className="w-5 h-5" /> Voltar ao Menu
        </button>

        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div>
            <h1 className="text-5xl font-black italic tracking-tighter mb-2">RANKING</h1>
            <p className="text-blue-400 font-medium uppercase tracking-widest text-xs">Os melhores mestres da memória</p>
          </div>
          
          <div className="flex flex-col items-end gap-3">
            <p className="text-[10px] text-blue-500 font-black uppercase tracking-tighter mr-2">MODO DE RANKING</p>
            <div className="flex bg-blue-900/40 p-1.5 rounded-2xl border border-blue-800 shadow-2xl backdrop-blur-xl">
              <button 
                onClick={() => onModeChange('total')}
                className={`px-6 py-2.5 rounded-xl font-black text-xs transition-all flex items-center gap-2 ${mode === 'total' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-blue-400 hover:text-white'}`}
              >
                <Trophy className="w-4 h-4" /> GERAL
              </button>
              <button 
                onClick={() => onModeChange('solo')}
                className={`px-6 py-2.5 rounded-xl font-black text-xs transition-all flex items-center gap-2 ${mode === 'solo' ? 'bg-green-600 text-white shadow-lg shadow-green-600/20' : 'text-blue-400 hover:text-white'}`}
              >
                <User className="w-4 h-4" /> SOLO
              </button>
              <button 
                onClick={() => onModeChange('versus')}
                className={`px-6 py-2.5 rounded-xl font-black text-xs transition-all flex items-center gap-2 ${mode === 'versus' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-blue-400 hover:text-white'}`}
              >
                <Swords className="w-4 h-4" /> VERSUS
              </button>
            </div>

            <div className="flex bg-blue-950/80 p-1.5 rounded-2xl border border-blue-800 shadow-2xl backdrop-blur-xl">
              <button 
                onClick={() => setTab('global')}
                className={`px-6 py-2.5 rounded-xl font-black text-sm transition-all flex items-center gap-2 ${tab === 'global' ? 'bg-blue-600 text-white shadow-lg' : 'text-blue-400 hover:text-white'}`}
              >
                <Globe className="w-4 h-4" /> GLOBAL
              </button>
              <button 
                onClick={() => setTab('local')}
                className={`px-6 py-2.5 rounded-xl font-black text-sm transition-all flex items-center gap-2 ${tab === 'local' ? 'bg-blue-600 text-white shadow-lg' : 'text-blue-400 hover:text-white'}`}
              >
                <Users className="w-4 h-4" /> LOCAL
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {tab === 'global' ? (
            <motion.div
              key={`global-${mode}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              {loadingGlobal ? (
                <div className="py-20 text-center">
                  <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-blue-400 font-bold animate-pulse uppercase tracking-widest text-xs">Sincronizando Ranking...</p>
                </div>
              ) : filteredRanking.length > 0 ? (
                <>
                  {/* Podium */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                    {/* 2nd Place */}
                    {podium[1] && (
                      <div className="order-2 md:order-1">
                        <div className="flex flex-col items-center">
                          <div className="relative mb-4">
                            <div className="w-20 h-20 rounded-full border-4 border-slate-400 bg-slate-800 flex items-center justify-center overflow-hidden shadow-2xl">
                              {podium[1].avatarUrl ? (
                                <img src={podium[1].avatarUrl} alt={podium[1].username} className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-10 h-10 text-slate-400" />
                              )}
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-slate-400 text-black w-8 h-8 rounded-full flex items-center justify-center font-black shadow-lg">2</div>
                          </div>
                          <div className="bg-slate-400/10 border border-slate-400/20 p-6 rounded-[2rem] w-full text-center">
                            <h3 className="font-black text-xl mb-1 truncate px-2">{podium[1].username}</h3>
                            <p className="text-slate-400 font-black text-2xl">
                              {mode === 'solo' ? podium[1].soloPoints : mode === 'versus' ? podium[1].versusPoints : podium[1].totalPoints}
                            </p>
                            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mt-1">Pontos</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 1st Place */}
                    {podium[0] && (
                      <div className="order-1 md:order-2">
                        <div className="flex flex-col items-center">
                          <Trophy className="w-12 h-12 text-yellow-400 mb-4 animate-bounce" />
                          <div className="relative mb-6">
                            <div className="w-28 h-28 rounded-full border-4 border-yellow-400 bg-slate-800 flex items-center justify-center overflow-hidden shadow-[0_0_50px_rgba(250,204,21,0.3)]">
                              {podium[0].avatarUrl ? (
                                <img src={podium[0].avatarUrl} alt={podium[0].username} className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-16 h-16 text-yellow-400" />
                              )}
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-black w-10 h-10 rounded-full flex items-center justify-center font-black text-xl shadow-lg ring-4 ring-blue-950">1</div>
                          </div>
                          <div className="bg-yellow-400/10 border-2 border-yellow-400/30 p-8 rounded-[2.5rem] w-full text-center scale-110">
                            <h3 className="font-black text-2xl mb-1 truncate px-2 text-yellow-400">{podium[0].username}</h3>
                            <p className="text-yellow-400 font-black text-4xl">
                              {mode === 'solo' ? podium[0].soloPoints : mode === 'versus' ? podium[0].versusPoints : podium[0].totalPoints}
                            </p>
                            <p className="text-[10px] uppercase font-bold text-yellow-500/60 tracking-widest mt-1">Pontos Mundiais</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 3rd Place */}
                    {podium[2] && (
                      <div className="order-3">
                        <div className="flex flex-col items-center">
                          <div className="relative mb-4">
                            <div className="w-20 h-20 rounded-full border-4 border-orange-600 bg-slate-800 flex items-center justify-center overflow-hidden shadow-2xl">
                              {podium[2].avatarUrl ? (
                                <img src={podium[2].avatarUrl} alt={podium[2].username} className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-10 h-10 text-orange-600" />
                              )}
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-orange-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-black shadow-lg">3</div>
                          </div>
                          <div className="bg-orange-600/10 border border-orange-600/20 p-6 rounded-[2rem] w-full text-center">
                            <h3 className="font-black text-xl mb-1 truncate px-2">{podium[2].username}</h3>
                            <p className="text-orange-600 font-black text-2xl">
                              {mode === 'solo' ? podium[2].soloPoints : mode === 'versus' ? podium[2].versusPoints : podium[2].totalPoints}
                            </p>
                            <p className="text-[10px] uppercase font-bold text-orange-600/50 tracking-widest mt-1">Pontos</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* List for 4+ */}
                  {remaining.length > 0 && (
                    <div className="bg-blue-950/40 rounded-[2.5rem] border border-blue-900 overflow-hidden">
                      <div className="p-4 bg-blue-900/40 border-b border-blue-800 flex justify-between text-[10px] uppercase font-black tracking-widest text-blue-400">
                        <span>Posição & Nome</span>
                        <span>Pontuação</span>
                      </div>
                      <div className="divide-y divide-blue-900">
                        {remaining.map((entry, i) => (
                          <div key={i} className="flex items-center justify-between p-5 hover:bg-blue-600/10 transition-colors">
                            <div className="flex items-center gap-4">
                              <span className="w-8 font-black text-blue-600 text-lg">#{i + 4}</span>
                              <div className="w-10 h-10 rounded-full bg-blue-900 flex items-center justify-center border border-blue-700 overflow-hidden">
                                {entry.avatarUrl ? (
                                  <img src={entry.avatarUrl} alt={entry.username} className="w-full h-full object-cover" />
                                ) : (
                                  <User className="w-5 h-5 text-blue-400" />
                                )}
                              </div>
                              <span className="font-bold text-lg">{entry.username}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-black text-xl text-blue-200">
                                {mode === 'solo' ? entry.soloPoints : mode === 'versus' ? entry.versusPoints : entry.totalPoints}
                              </span>
                              <span className="block text-[8px] uppercase tracking-widest text-blue-500 font-bold">
                                {mode === 'solo' ? 'Recorde Solo' : mode === 'versus' ? 'Pontos Versus' : 'Pontos Totais'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-24 bg-blue-950/20 rounded-[3rem] border-2 border-dashed border-blue-800">
                  <p className="text-blue-400 font-black text-xl mb-2">O Ranking está vazio!</p>
                  <p className="text-blue-500 text-sm">Seja o primeiro a jogar e dominar o topo em modo {mode}!</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="local"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="flex justify-end">
                <button onClick={onClear} className="flex items-center gap-2 text-red-500 hover:text-red-400 transition-colors text-xs font-black uppercase tracking-widest px-4 py-2 bg-red-500/10 rounded-xl border border-red-500/20">
                  <Trash2 className="w-4 h-4" /> Limpar Tudo
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Solo Section */}
                <div className="bg-blue-950/40 p-8 rounded-[3rem] border border-blue-800">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-green-500/20 rounded-2xl">
                      <Clock className="w-6 h-6 text-green-400" />
                    </div>
                    <h2 className="text-2xl font-black">Recordes Solo</h2>
                  </div>
                  
                  <div className="space-y-4">
                    {ranking.solo.length > 0 ? (
                      ranking.solo.sort((a,b) => a.bestTime - b.bestTime).slice(0, 10).map((entry, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-blue-900/50 rounded-2xl border border-blue-800">
                          <div className="flex items-center gap-3">
                            <span className="font-black text-blue-500">{i + 1}º</span>
                            <div>
                              <p className="font-bold">{entry.nickname}</p>
                              <p className="text-[10px] text-blue-400 uppercase font-bold tracking-widest">{entry.difficulty}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-green-400 font-black text-xl">{entry.bestTime}s</p>
                            <p className="text-[8px] text-blue-500 font-bold uppercase tracking-tighter">{entry.attempts} tentativas</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center py-12 text-blue-400 font-bold opacity-50 italic">Nenhum recorde local.</p>
                    )}
                  </div>
                </div>

                {/* Multiplayer Section */}
                <div className="bg-blue-950/40 p-8 rounded-[3rem] border border-blue-800">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-purple-500/20 rounded-2xl">
                      <Swords className="w-6 h-6 text-purple-400" />
                    </div>
                    <h2 className="text-2xl font-black">Multiplayer Local</h2>
                  </div>

                  <div className="space-y-4">
                    {ranking.multiplayer.length > 0 ? (
                      ranking.multiplayer.sort((a,b) => b.wins - a.wins).slice(0, 10).map((entry, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-blue-900/50 rounded-2xl border border-blue-800">
                          <div className="flex items-center gap-3">
                            <span className="font-black text-purple-500">{i + 1}º</span>
                            <span className="font-bold text-lg">{entry.nickname}</span>
                          </div>
                          <div className="bg-purple-600/20 text-purple-400 px-4 py-1 rounded-full font-black text-sm border border-purple-500/30">
                            {entry.wins} VITÓRIAS
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center py-12 text-blue-400 font-bold opacity-50 italic">Nenhum dado local.</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
