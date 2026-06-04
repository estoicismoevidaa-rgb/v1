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
    <div className="flex flex-col items-center min-h-screen p-4 text-white bg-[#000814]">
      <div className="w-full max-w-lg mb-4">
        <button 
          onClick={onBack} 
          className="flex items-center gap-1 text-[#4285f4] font-bold border border-[#4285f4]/50 rounded-xl px-4 py-1.5 hover:bg-[#4285f4]/10 transition-all"
        >
          <ChevronLeft className="w-5 h-5" /> Voltar ao Menu
        </button>
      </div>

      <div className="w-full max-w-xl text-center mb-10">
        <h1 className="text-7xl font-black italic tracking-tighter mb-1 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">RANKING</h1>
        <p className="text-blue-400 font-bold uppercase tracking-[0.2em] text-xs">Os melhores mestres da memória</p>
      </div>

      <div className="w-full max-w-lg space-y-6">
        {/* Mode Selector */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 text-[10px] font-black text-blue-500 uppercase tracking-widest">
            <div className="h-0.5 w-8 bg-blue-900" />
            MODO DE RANKING
            <div className="h-0.5 w-8 bg-blue-900" />
          </div>
          <div className="w-full grid grid-cols-3 bg-[#001d3d]/60 p-1.5 rounded-2xl border border-blue-900 shadow-2xl">
            <button 
              onClick={() => onModeChange('total')}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl font-black text-xs transition-all ${mode === 'total' ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.6)]' : 'text-blue-400'}`}
            >
              <Trophy className="w-4 h-4" /> GERAL
            </button>
            <button 
              onClick={() => onModeChange('solo')}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl font-black text-xs transition-all ${mode === 'solo' ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.6)]' : 'text-blue-400'}`}
            >
              <User className="w-4 h-4" /> SOLO
            </button>
            <button 
              onClick={() => onModeChange('versus')}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl font-black text-xs transition-all ${mode === 'versus' ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.6)]' : 'text-blue-400'}`}
            >
              <Swords className="w-4 h-4" /> VERSUS
            </button>
          </div>

          <div className="w-full grid grid-cols-2 max-w-[280px] bg-[#001d3d]/40 p-1 rounded-2xl border border-blue-900">
            <button 
              onClick={() => setTab('global')}
              className={`flex items-center justify-center gap-2 py-2 rounded-xl font-black text-xs transition-all ${tab === 'global' ? 'bg-blue-600 text-white shadow-lg' : 'text-blue-400'}`}
            >
              <Globe className="w-4 h-4" /> GLOBAL
            </button>
            <button 
              onClick={() => setTab('local')}
              className={`flex items-center justify-center gap-2 py-2 rounded-xl font-black text-xs transition-all ${tab === 'local' ? 'bg-blue-600 text-white shadow-lg' : 'text-blue-400'}`}
            >
              <div className="bg-blue-400/20 p-0.5 rounded">
                 <svg className="w-3 h-3 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                   <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                   <circle cx="12" cy="10" r="3" />
                 </svg>
              </div>
              LOCAL
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {tab === 'global' ? (
            <motion.div
              key={`global-${mode}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="py-10"
            >
              {loadingGlobal ? (
                <div className="py-20 text-center">
                  <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-blue-400 font-bold animate-pulse uppercase tracking-widest text-xs">Sincronizando Ranking...</p>
                </div>
              ) : filteredRanking.length > 0 ? (
                <>
                  {/* Podium Styling from Screenshot */}
                  <div className="flex items-end justify-center gap-2 relative">
                    
                    {/* 2nd Place (Silver/Blue) */}
                    {podium[1] && (
                      <div className="flex-1 flex flex-col items-center">
                         <div className="relative mb-2 w-full max-w-[140px]">
                           {/* Shield Border */}
                           <div className="absolute inset-0 opacity-80 scale-110">
                             <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">
                               <path d="M10 20 L50 5 L90 20 L90 90 L50 115 L10 90 Z" fill="rgba(15, 23, 42, 0.95)" stroke="#3b82f6" strokeWidth="1.5" />
                             </svg>
                           </div>
                           
                           <div className="relative z-10 flex flex-col items-center pb-6 pt-5">
                              <div className="w-16 h-16 rounded-full border-2 border-blue-400 p-0.5 mb-1 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                                <div className="w-full h-full rounded-full overflow-hidden bg-slate-800">
                                  {podium[1].avatarUrl ? (
                                    <img src={podium[1].avatarUrl} alt={podium[1].username} className="w-full h-full object-cover" />
                                  ) : (
                                    <User className="w-8 h-8 text-blue-400 mx-auto mt-3" />
                                  )}
                                </div>
                              </div>
                              
                              <div className="relative -mt-4 bg-[#1e293b] border-2 border-[#64748b] rounded-lg px-2 py-0.5 text-[10px] font-black z-20 shadow-lg text-white">2</div>
                              
                              <h3 className="font-black text-[11px] text-white uppercase mt-4 text-center w-full truncate px-2 leading-tight">NILZA SILVA</h3>
                              <div className="border border-blue-400/50 rounded-md px-2 py-0.5 mt-1 bg-[#1e293b]">
                                <span className="text-[10px] font-black text-white">LV {podium[1].level || 1}</span>
                              </div>
                              <p className="text-3xl font-black text-white mt-1 leading-none drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">{mode === 'solo' ? podium[1].soloPoints : mode === 'versus' ? podium[1].versusPoints : podium[1].totalPoints}</p>
                              <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest mt-1">Pontos</p>
                           </div>
                         </div>
                      </div>
                    )}

                    {/* 1st Place (Gold) */}
                    {podium[0] && (
                      <div className="flex-[1.3] flex flex-col items-center z-30 -mb-6">
                         <div className="mb-2">
                           <Trophy className="w-16 h-16 text-yellow-400 filter drop-shadow-[0_0_15px_rgba(250,204,21,0.7)]" />
                         </div>
                         <div className="relative w-full max-w-[200px]">
                           {/* Gold Shield Border */}
                           <div className="absolute inset-0 scale-[1.2] -translate-y-3">
                             <svg viewBox="0 0 100 130" className="w-full h-full drop-shadow-[0_0_25px_rgba(250,204,21,0.5)]">
                               <path d="M5 25 L50 5 L95 25 L95 100 L50 125 L5 100 Z" fill="rgba(15, 23, 42, 0.98)" stroke="#fbbf24" strokeWidth="3" />
                             </svg>
                           </div>
                           
                           <div className="relative z-10 flex flex-col items-center pb-12 pt-8">
                              <div className="w-28 h-28 rounded-full border-4 border-yellow-400 p-1 mb-1 shadow-[0_0_25px_rgba(250,204,21,0.5)]">
                                <div className="w-full h-full rounded-full overflow-hidden bg-slate-800 ring-2 ring-yellow-400/20">
                                  {podium[0].avatarUrl ? (
                                    <img src={podium[0].avatarUrl} alt={podium[0].username} className="w-full h-full object-cover" />
                                  ) : (
                                    <User className="w-14 h-14 text-yellow-400 mx-auto mt-5" />
                                  )}
                                </div>
                              </div>
                              
                              <div className="relative -mt-5 bg-[#fab005] border-2 border-yellow-100 rounded-lg px-4 py-1 text-xs font-black z-20 shadow-xl text-black flex items-center justify-center">1</div>
                              
                              <h3 className="font-black text-sm text-yellow-400 uppercase mt-5 text-center w-full truncate px-4 leading-tight">{podium[0].username}</h3>
                              <div className="border border-yellow-400/50 rounded-md px-3 py-1 mt-1 bg-yellow-900/40">
                                <span className="text-[12px] font-black text-white">LV {podium[0].level || 1}</span>
                              </div>
                              <p className="text-6xl font-black text-yellow-400 mt-2 leading-none drop-shadow-[0_0_15px_rgba(250,204,21,0.6)] tracking-tighter">{mode === 'solo' ? podium[0].soloPoints : mode === 'versus' ? podium[0].versusPoints : podium[0].totalPoints}</p>
                              <p className="text-[10px] font-black text-yellow-600 uppercase tracking-[0.2em] mt-1">Pontos Mundiais</p>
                           </div>
                         </div>
                      </div>
                    )}

                    {/* 3rd Place (Bronze/Orange) */}
                    {podium[2] && (
                      <div className="flex-1 flex flex-col items-center">
                         <div className="relative mb-2 w-full max-w-[140px]">
                           {/* Shield Border */}
                           <div className="absolute inset-x-0 inset-y-0 opacity-80 scale-110">
                             <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-[0_0_10px_rgba(249,115,22,0.5)]">
                               <path d="M10 20 L50 5 L90 20 L90 90 L50 115 L10 90 Z" fill="rgba(15, 23, 42, 0.95)" stroke="#f97316" strokeWidth="1.5" />
                             </svg>
                           </div>
                           
                           <div className="relative z-10 flex flex-col items-center pb-6 pt-5">
                              <div className="w-16 h-16 rounded-full border-2 border-orange-500 p-0.5 mb-1 shadow-[0_0_15px_rgba(249,115,22,0.3)]">
                                <div className="w-full h-full rounded-full overflow-hidden bg-slate-800">
                                  {podium[2].avatarUrl ? (
                                    <img src={podium[2].avatarUrl} alt={podium[2].username} className="w-full h-full object-cover" />
                                  ) : (
                                    <User className="w-8 h-8 text-orange-500 mx-auto mt-3" />
                                  )}
                                </div>
                              </div>
                              
                              <div className="relative -mt-4 bg-[#431407] border-2 border-[#b45309] rounded-lg px-2 py-0.5 text-[10px] font-black z-20 shadow-lg text-white">3</div>
                              
                              <h3 className="font-black text-[11px] text-white uppercase mt-4 text-center w-full truncate px-2 leading-tight">{podium[2].username}</h3>
                              <div className="border border-orange-400/50 rounded-md px-2 py-0.5 mt-1 bg-[#1e293b]">
                                <span className="text-[10px] font-black text-white">LV {podium[2].level || 1}</span>
                              </div>
                              <p className="text-3xl font-black text-orange-500 mt-1 leading-none drop-shadow-[0_0_10px_rgba(249,115,22,0.4)]">{mode === 'solo' ? podium[2].soloPoints : mode === 'versus' ? podium[2].versusPoints : podium[2].totalPoints}</p>
                              <p className="text-[8px] font-black text-orange-600 uppercase tracking-widest mt-1">Pontos</p>
                           </div>
                         </div>
                      </div>
                    )}

                    {/* Perspective Floor Effect */}
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[120%] h-20 bg-gradient-to-t from-blue-900/20 to-transparent rounded-full blur-xl -z-10" />
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-full h-[2px] bg-blue-600/30 -z-10" />
                  </div>

                  {/* List for 4+ */}
                  {remaining.length > 0 && (
                    <div className="mt-16 bg-[#001d3d]/40 rounded-3xl border border-blue-900/50 overflow-hidden backdrop-blur-sm">
                      <div className="p-4 bg-blue-900/20 border-b border-blue-800/50 flex justify-between text-[10px] uppercase font-black tracking-widest text-blue-500">
                        <span>Classificação</span>
                        <span>Detalhes da Pontuação</span>
                      </div>
                      <div className="divide-y divide-blue-900/30">
                        {remaining.map((entry, i) => (
                          <div key={i} className="flex items-center justify-between p-4 hover:bg-blue-600/10 transition-colors">
                            <div className="flex items-center gap-4">
                              <span className="w-8 font-black text-blue-600 text-lg">#{i + 4}</span>
                              <div className="w-10 h-10 rounded-full bg-blue-900/50 p-0.5 border border-blue-700/50">
                                <div className="w-full h-full rounded-full overflow-hidden">
                                  {entry.avatarUrl ? (
                                    <img src={entry.avatarUrl} alt={entry.username} className="w-full h-full object-cover" />
                                  ) : (
                                    <User className="w-5 h-5 text-blue-400 mx-auto mt-2" />
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-sm text-white">{entry.username}</span>
                                <span className="text-[9px] font-black text-green-400 uppercase tracking-tighter">Nível {entry.level || 1}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="font-black text-xl text-blue-100">
                                {mode === 'solo' ? entry.soloPoints : mode === 'versus' ? entry.versusPoints : entry.totalPoints}
                              </span>
                              <span className="block text-[7px] uppercase tracking-[0.2em] text-blue-500 font-black">
                                {mode === 'solo' ? 'Recorde Global' : mode === 'versus' ? 'Pontos Versus' : 'Rank Internacional'}
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
              className="py-6 space-y-8"
            >
              <div className="flex justify-end">
                <button onClick={onClear} className="flex items-center gap-2 text-red-500 hover:text-red-400 transition-colors text-xs font-black uppercase tracking-widest px-4 py-2 bg-red-500/10 rounded-xl border border-red-500/20">
                  <Trash2 className="w-4 h-4" /> Limpar Registros Locais
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Solo Local Records */}
                <div className="bg-[#001d3d]/40 p-8 rounded-[3rem] border border-blue-900 shadow-2xl">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-green-500/20 rounded-2xl">
                      <Clock className="w-6 h-6 text-green-400" />
                    </div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter italic">Solo Offline</h2>
                  </div>
                  
                  <div className="space-y-4">
                    {ranking.solo.length > 0 ? (
                      ranking.solo.sort((a,b) => a.bestTime - b.bestTime).slice(0, 5).map((entry, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-blue-900/30 rounded-2xl border border-blue-800/50">
                          <div className="flex items-center gap-3">
                            <span className="font-black text-blue-500 text-lg">#{i + 1}</span>
                            <div>
                              <p className="font-bold text-white">{entry.nickname}</p>
                              <p className="text-[9px] text-blue-400 uppercase font-black tracking-widest">{entry.difficulty}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-green-400 font-black text-2xl">{entry.bestTime}s</p>
                            <p className="text-[8px] text-blue-500 font-black uppercase tracking-tighter">{entry.attempts} TENTATIVAS</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center py-12 text-blue-400 font-bold opacity-50 italic">Nenhum recorde local.</p>
                    )}
                  </div>
                </div>

                {/* Local Multiplayer Records */}
                <div className="bg-[#001d3d]/40 p-8 rounded-[3rem] border border-blue-900 shadow-2xl">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-purple-500/20 rounded-2xl">
                      <Swords className="w-6 h-6 text-purple-400" />
                    </div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter italic">Versus Local</h2>
                  </div>

                  <div className="space-y-4">
                    {ranking.multiplayer.length > 0 ? (
                      ranking.multiplayer.sort((a,b) => b.wins - a.wins).slice(0, 5).map((entry, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-blue-900/30 rounded-2xl border border-blue-800/50">
                          <div className="flex items-center gap-3">
                            <span className="font-black text-purple-500 text-lg">#{i + 1}</span>
                            <span className="font-bold text-white">{entry.nickname}</span>
                          </div>
                          <div className="bg-purple-600/20 text-purple-400 px-4 py-1.5 rounded-xl font-black text-xs border border-purple-500/30">
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
      
      {/* Background Decorative Grid/Dots */}
      <div className="fixed inset-0 pointer-events-none -z-50 overflow-hidden opacity-20">
         <div className="absolute w-full h-full bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:40px_40px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>
    </div>
  );
}
