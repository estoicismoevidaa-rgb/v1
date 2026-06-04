/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Trash2, Clock, Swords, Globe, Trophy, User, Medal, Crown } from 'lucide-react';
import { LocalRanking, RankingEntry } from '../types.ts';

interface RankingProps {
  ranking: LocalRanking;
  globalRanking: RankingEntry[];
  loadingGlobal: boolean;
  mode: 'solo' | 'versus' | 'total';
  userProfile?: any;
  onModeChange: (mode: 'solo' | 'versus' | 'total') => void;
  onClear: () => void;
  onBack: () => void;
}

const ShieldSvg = ({ color, rank }: { color: string, rank: number }) => {
  const isGold = rank === 1;
  return (
    <svg viewBox="0 0 100 130" className={`w-full h-full drop-shadow-[0_0_20px_${color}44]`}>
      <path 
        d="M5 25 L50 5 L95 25 L95 105 L50 125 L5 105 Z" 
        fill="rgba(0, 10, 30, 0.95)" 
        stroke={color} 
        strokeWidth={isGold ? "4" : "3"} 
      />
      <path 
        d="M12 30 L50 15 L88 30 L88 95 L50 115 L12 95 Z" 
        fill="none" 
        stroke={color} 
        strokeWidth="1" 
        strokeOpacity="0.3" 
      />
    </svg>
  );
};

export function Ranking({ ranking, globalRanking, loadingGlobal, mode, userProfile, onModeChange, onClear, onBack }: RankingProps) {
  const [tab, setTab] = useState<'global' | 'local'>('global');

  const filteredRanking = globalRanking; 
  const podium = filteredRanking.slice(0, 3);
  const remaining = filteredRanking.slice(3);

  // Find current user's global rank
  const myRankIndex = globalRanking.findIndex(r => r.uid === userProfile?.uid);
  const myRank = myRankIndex !== -1 ? myRankIndex + 1 : '--';
  const myPoints = myRankIndex !== -1 ? 
    (mode === 'solo' ? globalRanking[myRankIndex].soloPoints : mode === 'versus' ? globalRanking[myRankIndex].versusPoints : globalRanking[myRankIndex].totalPoints) 
    : 0;

  return (
    <div className="flex flex-col items-center min-h-screen text-white bg-[#000814] relative overflow-hidden pb-32">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[10%] left-[5%] w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px]" />
        <div className="absolute top-[40%] right-[-10%] w-[350px] h-[350px] bg-blue-400/10 rounded-full blur-[80px]" />
        <div className="absolute bottom-0 w-full h-[30%] bg-gradient-to-t from-blue-900/10 to-transparent" />
      </div>

      <div className="w-full flex items-center justify-between p-6 relative z-30">
        <button 
          onClick={onBack} 
          className="group"
        >
          <div className="relative px-5 py-2 flex items-center gap-2 overflow-hidden border border-blue-500/30 rounded-xl bg-blue-950/20 backdrop-blur-md">
            <ChevronLeft className="w-5 h-5 text-blue-400 group-hover:-translate-x-1 transition-transform" /> 
            <span className="text-white font-bold text-xs uppercase tracking-tight">Voltar ao Menu</span>
          </div>
        </button>
      </div>

      <div className="w-full max-w-xl text-center mb-8 relative z-20 px-4">
        <div className="relative inline-block mb-2">
           {/* Laurel Wreath Mock */}
           <div className="absolute -inset-x-12 -inset-y-4 opacity-40">
             <svg viewBox="0 0 200 100" className="w-full h-full text-blue-400">
               <path d="M40 80 Q 20 60 40 40 L 50 50 M160 80 Q 180 60 160 40 L 150 50" fill="none" stroke="currentColor" strokeWidth="2" />
             </svg>
           </div>
           <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-blue-100 to-blue-400 drop-shadow-[0_0_20px_rgba(59,130,246,0.6)] leading-none select-none">
            RANKING
          </h1>
        </div>
        <p className="text-blue-400 font-extrabold uppercase tracking-[0.4em] text-[10px] drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]">
          Os melhores mestres da memória
        </p>
      </div>

      <div className="w-full max-w-xl space-y-6 relative z-20 px-4">
        {/* Mode Selector - 3 Columns */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-[9px] font-black text-blue-500 uppercase tracking-[0.3em]">
            <div className="h-[1px] w-8 bg-blue-500/30" />
            MODO DE RANKING
            <div className="h-[1px] w-8 bg-blue-500/30" />
          </div>

          <div className="w-full grid grid-cols-3 bg-[#001025]/80 p-1.5 rounded-2xl border border-blue-900/50 shadow-2xl backdrop-blur-md">
            <button 
              onClick={() => onModeChange('total')}
              className={`flex flex-col items-center justify-center gap-1 py-3 rounded-xl transition-all relative ${mode === 'total' ? 'text-white' : 'text-blue-400/50'}`}
            >
              {mode === 'total' && (
                <motion.div layoutId="activeMode" className="absolute inset-0 bg-blue-600 rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.5)] border border-blue-400/30" />
              )}
              <Trophy className="w-5 h-5 relative z-10" />
              <span className="text-[10px] font-black uppercase tracking-widest relative z-10">Geral</span>
            </button>
            <button 
              onClick={() => onModeChange('solo')}
              className={`flex flex-col items-center justify-center gap-1 py-3 rounded-xl transition-all relative ${mode === 'solo' ? 'text-white' : 'text-blue-400/50'}`}
            >
              {mode === 'solo' && (
                <motion.div layoutId="activeMode" className="absolute inset-0 bg-blue-600 rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.5)] border border-blue-400/30" />
              )}
              <User className="w-5 h-5 relative z-10" />
              <span className="text-[10px] font-black uppercase tracking-widest relative z-10">Solo</span>
            </button>
            <button 
              onClick={() => onModeChange('versus')}
              className={`flex flex-col items-center justify-center gap-1 py-3 rounded-xl transition-all relative ${mode === 'versus' ? 'text-white' : 'text-blue-400/50'}`}
            >
              {mode === 'versus' && (
                <motion.div layoutId="activeMode" className="absolute inset-0 bg-blue-600 rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.5)] border border-blue-400/30" />
              )}
              <Swords className="w-5 h-5 relative z-10" />
              <span className="text-[10px] font-black uppercase tracking-widest relative z-10">Versus</span>
            </button>
          </div>

          {/* Tab Selector - 2 Columns */}
          <div className="w-full grid grid-cols-2 bg-[#001025]/40 p-1 rounded-2xl border border-blue-900/30">
            <button 
              onClick={() => setTab('global')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-black text-[10px] transition-all relative ${tab === 'global' ? 'text-white' : 'text-blue-400/50'}`}
            >
              {tab === 'global' && <motion.div layoutId="activeTab" className="absolute inset-0 bg-blue-600 rounded-xl shadow-lg border border-blue-400/20" />}
              <Globe className="w-4 h-4 relative z-10" />
              <span className="relative z-10 uppercase tracking-widest">Global</span>
            </button>
            <button 
              onClick={() => setTab('local')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-black text-[10px] transition-all relative ${tab === 'local' ? 'text-white' : 'text-blue-400/50'}`}
            >
              {tab === 'local' && <motion.div layoutId="activeTab" className="absolute inset-0 bg-blue-600 rounded-xl shadow-lg border border-blue-400/20" />}
              <svg className="w-4 h-4 relative z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span className="relative z-10 uppercase tracking-widest">Local</span>
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {tab === 'global' ? (
            <motion.div
              key={`global-${mode}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12"
            >
              {loadingGlobal ? (
                <div className="py-20 text-center">
                  <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-blue-400 font-bold animate-pulse uppercase tracking-widest text-[10px]">Sincronizando Ranking...</p>
                </div>
              ) : filteredRanking.length > 0 ? (
                <div className="flex flex-col items-center">
                  {/* Podium Base Grid */}
                  <div className="flex items-end justify-center w-full max-w-lg gap-2 relative min-h-[420px] mb-8">
                    
                    {/* 2nd Place */}
                    {podium[1] && (
                      <div className="flex-1 flex flex-col items-center relative z-10">
                         <div className="relative w-full max-w-[120px]">
                           {/* Shield */}
                           <div className="absolute inset-0 scale-[1.1] translate-y-2 opacity-80">
                             <ShieldSvg color="#94a3b8" rank={2} />
                           </div>
                           
                           <div className="relative z-10 flex flex-col items-center pb-6 pt-8">
                              <div className="w-20 h-20 rounded-full border-[3px] border-slate-400 p-0.5 mb-2 shadow-[0_0_15px_rgba(148,163,184,0.4)]">
                                <div className="w-full h-full rounded-full overflow-hidden bg-slate-900 border border-slate-500/30">
                                  {podium[1].avatarUrl ? (
                                    <img src={podium[1].avatarUrl} alt={podium[1].username} className="w-full h-full object-cover" />
                                  ) : (
                                    <User className="w-10 h-10 text-slate-400 mx-auto mt-4" />
                                  )}
                                </div>
                              </div>
                              
                              <div className="relative -mt-6 bg-[#001025] border-2 border-slate-400 rounded-full w-8 h-8 flex items-center justify-center text-sm font-black z-20 shadow-xl text-white">2</div>
                              
                              <h3 className="font-black text-[12px] text-white uppercase mt-4 text-center w-full truncate px-2 leading-tight drop-shadow-md">{podium[1].username || 'Jogador'}</h3>
                              <div className="bg-blue-600/20 border border-blue-500/30 rounded px-2 py-0.5 mt-1">
                                <span className="text-[9px] font-black text-blue-300">LV {podium[1].level || 1}</span>
                              </div>
                              <p className="text-3xl font-black text-white mt-1 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] tracking-tighter">
                                {mode === 'solo' ? podium[1].soloPoints?.toLocaleString() : mode === 'versus' ? podium[1].versusPoints?.toLocaleString() : podium[1].totalPoints?.toLocaleString()}
                              </p>
                              <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest leading-none">Pontos</p>
                           </div>
                         </div>
                         {/* Platform */}
                         <div className="w-24 h-12 bg-gradient-to-b from-slate-400/20 to-slate-400/0 rounded-[100%] border-t border-slate-400/40 -mt-2 blur-[1px]" />
                      </div>
                    )}

                    {/* 1st Place */}
                    {podium[0] && (
                      <div className="flex-[1.2] flex flex-col items-center z-30 pb-4">
                         <div className="mb-[-15px] relative z-40">
                            <Crown className="w-12 h-12 text-yellow-400 drop-shadow-[0_0_10px_#fbbf24]" fill="#fbbf24" strokeWidth={1} />
                         </div>
                         <div className="relative w-full max-w-[150px]">
                            {/* Gold Shield */}
                           <div className="absolute inset-0 scale-[1.15] translate-y-3">
                             <ShieldSvg color="#fbbf24" rank={1} />
                           </div>
                           
                           <div className="relative z-10 flex flex-col items-center pb-10 pt-8">
                              <div className="w-24 h-24 rounded-full border-[4px] border-yellow-400 p-1 mb-2 shadow-[0_0_25px_rgba(251,191,36,0.6)]">
                                <div className="w-full h-full rounded-full overflow-hidden bg-slate-900 border border-yellow-500/50">
                                  {podium[0].avatarUrl ? (
                                    <img src={podium[0].avatarUrl} alt={podium[0].username} className="w-full h-full object-cover" />
                                  ) : (
                                    <User className="w-12 h-12 text-yellow-400 mx-auto mt-5" />
                                  )}
                                </div>
                              </div>
                              
                              <div className="relative -mt-7 bg-yellow-400 border-2 border-white rounded-full w-9 h-9 flex items-center justify-center text-base font-black z-20 shadow-2xl text-black">1</div>
                              
                              <h3 className="font-black text-[14px] text-white uppercase mt-4 text-center w-full truncate px-4 leading-tight drop-shadow-lg">{podium[0].username}</h3>
                              <div className="bg-yellow-400/20 border border-yellow-400/30 rounded px-3 py-0.5 mt-1">
                                <span className="text-[11px] font-black text-yellow-400">LV {podium[0].level || 1}</span>
                              </div>
                              <p className="text-5xl font-black text-yellow-400 mt-1 leading-none drop-shadow-[0_0_15px_rgba(251,191,36,0.6)] tracking-tighter">
                                {mode === 'solo' ? podium[0].soloPoints?.toLocaleString() : mode === 'versus' ? podium[0].versusPoints?.toLocaleString() : podium[0].totalPoints?.toLocaleString()}
                              </p>
                              <p className="text-[10px] font-black text-yellow-600 uppercase tracking-widest mt-0.5">Pontos Mundiais</p>
                           </div>
                         </div>
                         {/* Platform */}
                         <div className="w-32 h-16 bg-gradient-to-b from-yellow-400/20 to-yellow-400/0 rounded-[100%] border-t border-yellow-400/40 -mt-2 blur-[1px]" />
                      </div>
                    )}

                    {/* 3rd Place */}
                    {podium[2] && (
                      <div className="flex-1 flex flex-col items-center relative z-10">
                         <div className="relative w-full max-w-[120px]">
                           {/* Shield */}
                           <div className="absolute inset-0 scale-[1.1] translate-y-2 opacity-80">
                             <ShieldSvg color="#f97316" rank={3} />
                           </div>
                           
                           <div className="relative z-10 flex flex-col items-center pb-6 pt-8">
                              <div className="w-20 h-20 rounded-full border-[3px] border-orange-500 p-0.5 mb-2 shadow-[0_0_15px_rgba(249,115,22,0.4)]">
                                <div className="w-full h-full rounded-full overflow-hidden bg-slate-900 border border-orange-500/30">
                                  {podium[2].avatarUrl ? (
                                    <img src={podium[2].avatarUrl} alt={podium[2].username} className="w-full h-full object-cover" />
                                  ) : (
                                    <User className="w-10 h-10 text-orange-500 mx-auto mt-4" />
                                  )}
                                </div>
                              </div>
                              
                              <div className="relative -mt-6 bg-[#001025] border-2 border-orange-500 rounded-full w-8 h-8 flex items-center justify-center text-sm font-black z-20 shadow-xl text-white">3</div>
                              
                              <h3 className="font-black text-[12px] text-white uppercase mt-4 text-center w-full truncate px-2 leading-tight drop-shadow-md">{podium[2].username}</h3>
                              <div className="bg-blue-600/20 border border-blue-500/30 rounded px-2 py-0.5 mt-1">
                                <span className="text-[9px] font-black text-blue-300">LV {podium[2].level || 1}</span>
                              </div>
                              <p className="text-3xl font-black text-orange-500 mt-1 leading-none drop-shadow-[0_0_10px_rgba(249,115,22,0.4)] tracking-tighter">
                                {mode === 'solo' ? podium[2].soloPoints?.toLocaleString() : mode === 'versus' ? podium[2].versusPoints?.toLocaleString() : podium[2].totalPoints?.toLocaleString()}
                              </p>
                              <p className="text-[8px] font-black text-orange-600 uppercase tracking-widest leading-none">Pontos</p>
                           </div>
                         </div>
                         {/* Platform */}
                         <div className="w-24 h-12 bg-gradient-to-b from-orange-400/20 to-orange-400/0 rounded-[100%] border-t border-orange-400/40 -mt-2 blur-[1px]" />
                      </div>
                    )}
                  </div>

                  {/* List for 4+ */}
                  {remaining.length > 0 && (
                    <div className="w-full max-w-lg bg-[#001025]/60 rounded-3xl border border-blue-900/50 overflow-hidden backdrop-blur-md shadow-inner mb-8">
                      <div className="divide-y divide-blue-900/30">
                        {remaining.map((entry, i) => (
                          <div key={i} className="flex items-center justify-between p-4 hover:bg-blue-600/5 transition-all group">
                            <div className="flex items-center gap-4">
                              <span className="w-6 font-black text-blue-700 text-lg group-hover:text-blue-400">#{i + 4}</span>
                              <div className="w-10 h-10 rounded-full bg-blue-900/40 p-0.5 border border-blue-700/30">
                                <div className="w-full h-full rounded-full overflow-hidden">
                                  {entry.avatarUrl ? (
                                    <img src={entry.avatarUrl} alt={entry.username} className="w-full h-full object-cover" />
                                  ) : (
                                    <User className="w-6 h-6 text-blue-500/50 mx-auto mt-2" />
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col">
                                <span className="font-black text-sm text-white group-hover:text-blue-200">{entry.username}</span>
                                <div className="bg-blue-900/40 border border-blue-800/50 rounded px-1.5 py-0 min-w-fit w-fit">
                                  <span className="text-[8px] font-black text-blue-400 uppercase">LV {entry.level || 1}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="font-black text-xl text-white tracking-tighter group-hover:text-blue-400">
                                {mode === 'solo' ? entry.soloPoints?.toLocaleString() : mode === 'versus' ? entry.versusPoints?.toLocaleString() : entry.totalPoints?.toLocaleString()}
                              </span>
                              <span className="block text-[7px] uppercase tracking-widest text-blue-600 font-black">Pontos</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

              ) : (
                <div className="text-center py-24 bg-blue-950/20 rounded-[3rem] border border-blue-900/50 backdrop-blur-sm">
                  <p className="text-blue-400 font-black text-xl mb-2 italic">O Ranking está vazio!</p>
                  <p className="text-blue-500/70 text-[10px] uppercase tracking-widest font-bold">Seja o primeiro a dominar o topo em modo {mode}!</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="local"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 space-y-12"
            >
              <div className="flex justify-end">
                <button 
                  onClick={onClear} 
                  className="flex items-center gap-2 text-red-500 hover:bg-red-500/10 transition-all text-[10px] font-black uppercase tracking-widest px-6 py-3 bg-red-500/5 rounded-2xl border border-red-500/20 group"
                >
                  <Trash2 className="w-4 h-4 group-hover:rotate-12 transition-transform" /> 
                  Limpar Registros Locais
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Solo Local Records */}
                <div className="bg-[#001025]/60 p-8 rounded-[2.5rem] border border-blue-900 shadow-2xl relative overflow-hidden backdrop-blur-md">
                   {/* Decoration */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-3xl -mr-16 -mt-16" />
                  
                  <div className="flex items-center gap-4 mb-10 relative z-10">
                    <div className="p-4 bg-green-500/10 rounded-2xl border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                      <Clock className="w-7 h-7 text-green-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black uppercase tracking-tighter italic leading-none">Solo Offline</h2>
                      <p className="text-[10px] font-bold text-green-500/60 uppercase tracking-[0.2em] mt-1 ml-1">Registros Locais</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4 relative z-10">
                    {ranking.solo.length > 0 ? (
                      ranking.solo.sort((a,b) => a.bestTime - b.bestTime).slice(0, 5).map((entry, i) => (
                        <div key={i} className="flex items-center justify-between p-5 bg-blue-900/10 rounded-3xl border border-blue-900/30 hover:bg-blue-600/5 transition-colors group">
                          <div className="flex items-center gap-5">
                            <span className="font-black text-blue-500 text-xl italic w-6">#{i + 1}</span>
                            <div>
                              <p className="font-black text-white text-base group-hover:text-blue-200 transition-colors">{entry.nickname}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[8px] text-blue-400 uppercase font-black tracking-widest bg-blue-900/40 px-2 py-0.5 rounded-full">
                                  {entry.difficulty}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-green-400 font-black text-3xl tracking-tighter drop-shadow-[0_0_8px_rgba(34,197,94,0.3)]">{entry.bestTime}s</p>
                            <p className="text-[9px] text-blue-700 font-black uppercase tracking-tighter mt-1">{entry.attempts} TENTATIVAS</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-16 border-2 border-dashed border-blue-900/30 rounded-3xl">
                        <p className="text-blue-500/50 font-black uppercase tracking-widest text-[10px] italic">Sem recordes locais.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Local Multiplayer Records */}
                <div className="bg-[#001025]/60 p-8 rounded-[2.5rem] border border-blue-900 shadow-2xl relative overflow-hidden backdrop-blur-md">
                  {/* Decoration */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl -mr-16 -mt-16" />

                  <div className="flex items-center gap-4 mb-10 relative z-10">
                    <div className="p-4 bg-purple-500/10 rounded-2xl border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                      <Swords className="w-7 h-7 text-purple-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black uppercase tracking-tighter italic leading-none">Versus Local</h2>
                      <p className="text-[10px] font-bold text-purple-500/60 uppercase tracking-[0.2em] mt-1 ml-1">Registros Locais</p>
                    </div>
                  </div>

                  <div className="space-y-4 relative z-10">
                    {ranking.multiplayer.length > 0 ? (
                      ranking.multiplayer.sort((a,b) => b.wins - a.wins).slice(0, 5).map((entry, i) => (
                        <div key={i} className="flex items-center justify-between p-5 bg-blue-900/10 rounded-3xl border border-blue-900/30 hover:bg-purple-600/5 transition-colors group">
                          <div className="flex items-center gap-5">
                            <span className="font-black text-purple-600 text-xl italic w-6">#{i + 1}</span>
                            <span className="font-black text-white text-base group-hover:text-purple-200 transition-colors">{entry.nickname}</span>
                          </div>
                          <div className="bg-purple-600/10 text-purple-400 px-5 py-2 rounded-2xl font-black text-xs border border-purple-500/30 shadow-lg group-hover:bg-purple-600/20 transition-all">
                            {entry.wins} VITÓRIAS
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-16 border-2 border-dashed border-blue-900/30 rounded-3xl">
                        <p className="text-blue-500/50 font-black uppercase tracking-widest text-[10px] italic">Sem dados registrados.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Fixed User Summary Footer */}
      <div className="fixed bottom-0 left-0 w-full p-4 z-50">
        <div className="max-w-xl mx-auto bg-[#001025]/95 border border-blue-500/50 rounded-[2rem] p-4 flex items-center justify-between gap-4 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] backdrop-blur-xl">
           <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full border-2 border-blue-500/50 p-0.5 overflow-hidden shadow-inner">
                {userProfile?.avatarUrl ? (
                  <img src={userProfile.avatarUrl} className="w-full h-full object-cover rounded-full" />
                ) : (
                  <div className="w-full h-full bg-blue-900/50 flex items-center justify-center rounded-full">
                    <User className="w-6 h-6 text-blue-400" />
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none mb-1">Sua Posição</p>
                <div className="flex items-center gap-1">
                  {/* Laurel Icon SVG */}
                  <svg viewBox="0 0 24 24" className="w-5 h-5 text-yellow-500 opacity-80" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M7 10 L4 7 L7 4 M17 10 L20 7 L17 4 M12 20 L12 20" />
                    <circle cx="12" cy="12" r="5" fill="currentColor" fillOpacity="0.2" />
                  </svg>
                  <span className="text-3xl font-black text-white italic leading-none">{myRank}º</span>
                </div>
              </div>
           </div>

           <div className="hidden sm:flex flex-col items-center">
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none mb-1">Seu Nível</p>
              <div className="bg-blue-600/30 border border-blue-500/50 rounded-lg px-3 py-1">
                <span className="text-sm font-black text-white italic">LV {userProfile?.level || 1}</span>
              </div>
           </div>

           <div className="flex flex-col items-end">
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none mb-1">Seus Pontos</p>
              <p className="text-2xl font-black text-yellow-400 italic leading-none tracking-tighter">{myPoints.toLocaleString()}</p>
              <p className="text-[8px] font-black text-blue-500 uppercase tracking-[0.2em] mt-0.5">Pontos Mundiais</p>
           </div>

           <div className="w-12 h-12 flex items-center justify-center">
              <Medal className="w-10 h-10 text-blue-400 rotate-12 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
           </div>
        </div>
      </div>
    </div>
  );
}
