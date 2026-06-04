/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Trash2, Clock, Swords, Globe, Trophy, User, Medal, Crown, Award, Star } from 'lucide-react';
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

const TechCorner = ({ className }: { className: string }) => (
  <div className={`absolute w-4 h-4 border-white/20 pointer-events-none ${className}`} />
);

const Particle = ({ delay = 0 }: { delay?: number }) => (
  <motion.div
    initial={{ y: '100%', x: Math.random() * 100 + '%', opacity: 0 }}
    animate={{ y: '-10%', opacity: [0, 1, 0] }}
    transition={{ duration: 5 + Math.random() * 5, repeat: Infinity, delay, ease: 'linear' }}
    className="absolute w-1 h-1 bg-blue-400 rounded-full blur-[1px] pointer-events-none"
  />
);

const Laurels = ({ className }: { className: string }) => (
  <svg viewBox="0 0 100 80" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M30 70 Q 10 50 30 20" />
    <path d="M35 65 Q 20 50 35 30" />
    <path d="M40 60 Q 30 50 40 40" />
  </svg>
);

const FilterButton = ({ active, onClick, icon, label, glowColor = 'blue' }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, glowColor?: string }) => (
  <button
    onClick={onClick}
    className={`relative flex items-center justify-center gap-2 py-3 rounded-2xl transition-all duration-300 font-black text-[11px] uppercase tracking-widest flex-1 group ${
      active ? 'text-white' : 'text-blue-400/40 hover:text-blue-400/60'
    }`}
  >
    {active && (
      <motion.div 
        layoutId={`filter-${glowColor}`}
        className={`absolute inset-0 rounded-2xl border-2 shadow-[0_0_20px_rgba(59,130,246,0.3)] ${
          glowColor === 'blue' ? 'bg-blue-600 border-blue-400 shadow-blue-500/50' : 'bg-blue-700/40 border-blue-400/60'
        }`}
      />
    )}
    <div className="relative z-10 flex items-center gap-2">
      {icon}
      <span>{label}</span>
    </div>
  </button>
);

const PodiumCard = ({ entry, rank, mode }: { entry: RankingEntry, rank: 1 | 2 | 3, mode: string }) => {
  const isFirst = rank === 1;
  const config = {
    1: { 
      color: '#fbbf24', 
      glow: 'shadow-[0_0_40px_rgba(251,191,36,0.5)]', 
      border: 'border-yellow-500', 
      bg: 'bg-yellow-500/10',
      label: 'Dourado',
      size: 'scale-110'
    },
    2: { 
      color: '#cbd5e1', 
      glow: 'shadow-[0_0_30px_rgba(203,213,225,0.3)]', 
      border: 'border-blue-400/50', 
      bg: 'bg-blue-900/20',
      label: 'Prata',
      size: 'scale-95'
    },
    3: { 
      color: '#d97706', 
      glow: 'shadow-[0_0_30px_rgba(217,119,6,0.3)]', 
      border: 'border-orange-500/50', 
      bg: 'bg-orange-500/10',
      label: 'Bronze',
      size: 'scale-90'
    }
  }[rank];

  const points = mode === 'solo' ? entry.soloPoints : mode === 'versus' ? entry.versusPoints : entry.totalPoints;
  const pointsLabel = mode === 'solo' ? 'PONTOS SOLO' : mode === 'versus' ? 'PONTOS VERSUS' : 'PONTOS MUNDIAIS';

  return (
    <motion.div 
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: rank * 0.1 }}
      className={`relative flex flex-col items-center ${config.size} z-${isFirst ? '30' : '20'}`}
    >
      {/* Glow Base on Ground */}
      <div className={`absolute -bottom-4 w-32 h-8 rounded-full blur-2xl opacity-40 ${config.bg.replace('10', '40')}`} />
      
      {isFirst && (
        <div className="mb-[-10px] relative z-40">
          <Crown className="w-10 h-10 text-yellow-400 drop-shadow-[0_0_15px_#fbbf24]" fill="#fbbf24" strokeWidth={1} />
        </div>
      )}

      {/* Main Card Frame */}
      <div className={`relative px-4 pt-8 pb-6 bg-[#001025]/90 rounded-[2.5rem] border-2 ${config.border} ${config.glow} backdrop-blur-md w-full max-w-[130px] flex flex-col items-center overflow-hidden`}>
        {/* Subtle Tech Lines */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '100% 10px' }} />
        
        {/* Avatar */}
        <div className={`relative mb-3 group`}>
          <div className={`w-20 h-20 rounded-full border-2 ${config.border} p-1 shadow-inner relative z-10`}>
            <div className="w-full h-full rounded-full overflow-hidden bg-slate-900 border border-white/10">
               {entry.avatarUrl ? (
                 <img src={entry.avatarUrl} alt={entry.username} className="w-full h-full object-cover" />
               ) : (
                 <User className={`w-10 h-10 mx-auto mt-4 ${isFirst ? 'text-yellow-500' : 'text-blue-400/50'}`} />
               )}
            </div>
          </div>
          {/* Position Seal */}
          <div className={`absolute -bottom-2 -right-1 w-8 h-8 rounded-full border-2 border-white flex items-center justify-center font-black text-sm z-20 shadow-xl ${isFirst ? 'bg-yellow-500 text-black' : 'bg-slate-800 text-white'}`}>
            {rank}
          </div>
        </div>

        {/* Name & Content */}
        <h3 className="text-white font-black text-[12px] uppercase tracking-tighter w-full text-center truncate mb-1 px-1 drop-shadow-md">{entry.username}</h3>
        <div className={`px-2 py-0.5 rounded-full border ${isFirst ? 'border-yellow-500/30 bg-yellow-500/10' : 'border-blue-500/30 bg-blue-500/10'} mb-2`}>
           <span className={`text-[9px] font-black ${isFirst ? 'text-yellow-400' : 'text-blue-300'}`}>LV {entry.level || 1}</span>
        </div>
        
        <div className="text-center">
          <p className="text-2xl font-black text-white tracking-tighter drop-shadow-md leading-none">{points?.toLocaleString()}</p>
          <p className={`text-[7px] font-black uppercase tracking-[0.15em] mt-1.5 ${isFirst ? 'text-yellow-500' : 'text-blue-500'}`}>{pointsLabel}</p>
        </div>
      </div>
    </motion.div>
  );
};

export function Ranking({ ranking, globalRanking, loadingGlobal, mode, userProfile, onModeChange, onClear, onBack }: RankingProps) {
  const [tab, setTab] = useState<'global' | 'local'>('global');

  const filteredRanking = globalRanking; 
  const podium = [filteredRanking[1], filteredRanking[0], filteredRanking[2]]; // Order: 2nd, 1st, 3rd for pódium layout
  const remaining = filteredRanking.slice(3);

  const myRankIndex = globalRanking.findIndex(r => r.uid === userProfile?.uid);
  const myRank = myRankIndex !== -1 ? myRankIndex + 1 : '--';
  const myPoints = myRankIndex !== -1 ? 
    (mode === 'solo' ? globalRanking[myRankIndex].soloPoints : mode === 'versus' ? globalRanking[myRankIndex].versusPoints : globalRanking[myRankIndex].totalPoints) 
    : 0;

  return (
    <div className="flex flex-col items-center min-h-screen text-white bg-[#000814] relative overflow-hidden pb-40">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[50%] bg-[radial-gradient(circle_at_50%_0%,rgba(30,144,255,0.15)_0%,transparent_70%)]" />
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
        <div className="absolute inset-0 opacity-[0.05]" 
             style={{ backgroundImage: 'linear-gradient(45deg, #3b82f6 1px, transparent 1px), linear-gradient(-45deg, #3b82f6 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        
        {/* Animated Particles - Reduced for Mobile performance */}
        <div className="hidden sm:block">
          {[...Array(15)].map((_, i) => (
            <Particle key={i} delay={i * 0.5} />
          ))}
        </div>
        <div className="sm:hidden">
          {[...Array(6)].map((_, i) => (
            <Particle key={i} delay={i * 1.2} />
          ))}
        </div>
      </div>

      {/* Top Header */}
      <div className="w-full flex items-center justify-between p-6 relative z-30">
        <button 
          onClick={onBack} 
          className="group"
        >
          <div className="relative px-6 py-3 flex items-center gap-2 border-[1.5px] border-blue-500/40 rounded-2xl bg-[#001025]/80 backdrop-blur-md shadow-[0_0_15px_rgba(59,130,246,0.2)] transition-all hover:bg-blue-600/10 active:scale-95">
            <ChevronLeft className="w-5 h-5 text-blue-400 group-hover:-translate-x-1 transition-transform" /> 
            <span className="text-white font-black text-[10px] uppercase tracking-[0.2em] italic">Voltar ao Menu</span>
          </div>
        </button>
      </div>

      {/* Hero Title Container */}
      <div className="w-full max-w-2xl text-center mb-6 sm:mb-10 relative z-20 px-4 mt-4 sm:mt-2">
        <div className="relative inline-block">
           {/* Blue Laurels */}
           <div className="absolute -left-20 top-1/2 -translate-y-1/2 w-16 h-16 text-blue-500 opacity-80 hidden md:block">
              <Laurels className="w-full h-full rotate-[-15deg]" />
           </div>
           <div className="absolute -right-20 top-1/2 -translate-y-1/2 w-16 h-16 text-blue-500 opacity-80 hidden md:block">
              <Laurels className="w-full h-full scale-x-[-1] rotate-[15deg]" />
           </div>

           <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative"
           >
              <h1 className="text-6xl sm:text-8xl md:text-9xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-blue-100 to-blue-500 [text-shadow:0_4px_0_#000,0_8px_0_#1e3a8a,0_12px_20px_rgba(59,130,246,0.6)] leading-none select-none px-6 sm:px-12">
                RANKING
              </h1>
              <div className="h-[3px] w-full bg-gradient-to-r from-transparent via-blue-500 to-transparent mt-2 opacity-50 shadow-[0_0_10px_#3b82f6]" />
           </motion.div>
        </div>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-blue-400 font-black uppercase tracking-[0.4em] text-[11px] mt-4 italic drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]"
        >
          Os melhores mestres da memória
        </motion.p>
      </div>

      <div className="w-full max-w-xl space-y-8 relative z-20 px-4">
        {/* Filtering Systems */}
        <div className="flex flex-col items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-4 text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] w-full px-8">
            <div className="h-[1.5px] flex-1 bg-gradient-to-r from-transparent to-blue-500/50" />
            MODO DE RANKING
            <div className="h-[1.5px] flex-1 bg-gradient-to-l from-transparent to-blue-500/50" />
          </div>

          <div className="w-full space-y-4">
            {/* Primary Modes */}
            <div className="flex bg-[#001025]/90 p-1.5 rounded-[2rem] border border-blue-500/30 shadow-2xl backdrop-blur-xl relative overflow-hidden">
               <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #3b82f6 1px, transparent 1px)', backgroundSize: '15px 15px' }} />
               <FilterButton label="Geral" active={mode === 'total'} onClick={() => onModeChange('total')} icon={<Trophy className="w-4 h-4" />} />
               <FilterButton label="Solo" active={mode === 'solo'} onClick={() => onModeChange('solo')} icon={<User className="w-4 h-4" />} />
               <FilterButton label="Versus" active={mode === 'versus'} onClick={() => onModeChange('versus')} icon={<Swords className="w-4 h-4" />} />
            </div>

            {/* Scope Selection */}
            <div className="flex bg-[#001025]/60 p-1 rounded-2xl border border-blue-500/20 max-w-xs mx-auto">
               <FilterButton label="Global" active={tab === 'global'} onClick={() => setTab('global')} icon={<Globe className="w-4 h-4" />} glowColor="dark" />
               <FilterButton label="Local" active={tab === 'local'} onClick={() => setTab('local')} icon={<Award className="w-4 h-4" />} glowColor="dark" />
            </div>
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
                  <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-400 rounded-full animate-spin mx-auto mb-6 shadow-[0_0_30px_rgba(59,130,246,0.3)]" />
                  <p className="text-blue-400 font-black animate-pulse uppercase tracking-[0.3em] text-[11px]">Sincronizando Rede Global...</p>
                </div>
              ) : filteredRanking.length > 0 ? (
                <div className="flex flex-col items-center">
                  {/* Pódium Section - Scaled for Mobile */}
                  <div className="flex items-end justify-center w-full gap-1 sm:gap-2 relative min-h-[350px] sm:min-h-[400px] mb-8 sm:mb-12 px-1 sm:px-2 max-sm:scale-90">
                    {/* 2nd Place */}
                    <div className="flex-1">
                       {podium[0] && <PodiumCard entry={podium[0]} rank={2} mode={mode} />}
                    </div>
                    {/* 1st Place */}
                    <div className="flex-[1.1] scale-110">
                       {podium[1] && <PodiumCard entry={podium[1]} rank={1} mode={mode} />}
                    </div>
                    {/* 3rd Place */}
                    <div className="flex-1">
                       {podium[2] && <PodiumCard entry={podium[2]} rank={3} mode={mode} />}
                    </div>
                  </div>

                  {/* List Container */}
                  {remaining.length > 0 && (
                    <div className="w-full bg-[#001025]/80 rounded-[2.5rem] border border-blue-500/30 overflow-hidden backdrop-blur-xl shadow-2xl relative mb-12">
                      <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(to right, #3b82f6 1px, transparent 1px), linear-gradient(to bottom, #3b82f6 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                      <div className="divide-y divide-blue-500/10 relative z-10">
                        {remaining.map((entry, i) => (
                          <div key={i} className="flex items-center justify-between p-5 hover:bg-blue-600/5 transition-all group relative">
                            <div className="flex items-center gap-4">
                              <span className="w-8 font-black text-blue-600/50 text-base group-hover:text-blue-400 transition-colors">#{i + 4}</span>
                              <div className="w-12 h-12 rounded-full border border-blue-500/30 p-0.5">
                                <div className="w-full h-full rounded-full overflow-hidden bg-blue-900/20">
                                  {entry.avatarUrl ? (
                                    <img src={entry.avatarUrl} alt={entry.username} className="w-full h-full object-cover" />
                                  ) : (
                                    <User className="w-6 h-6 text-blue-500/30 mx-auto mt-2.5" />
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col">
                                <span className="font-black text-[13px] text-blue-100 uppercase tracking-tight group-hover:text-white">{entry.username}</span>
                                <span className="text-[9px] font-black text-blue-500/60 uppercase">LV {entry.level || 1}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="font-black text-2xl text-white tracking-tighter group-hover:text-blue-400">
                                {(mode === 'solo' ? entry.soloPoints : mode === 'versus' ? entry.versusPoints : entry.totalPoints)?.toLocaleString()}
                              </span>
                              <div className="h-0.5 w-full bg-blue-500/10 rounded-full mt-0.5" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-24 bg-blue-950/10 rounded-[3rem] border border-blue-900/50 backdrop-blur-sm">
                  <Trophy className="w-16 h-16 text-blue-900/30 mx-auto mb-4" />
                  <p className="text-blue-400 font-black text-2xl mb-2 italic tracking-tighter">Ranking Vazio</p>
                  <p className="text-blue-500/50 text-[10px] uppercase tracking-[0.4em] font-black">Seja o primeiro mestre!</p>
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
              <div className="flex justify-center">
                <button 
                  onClick={onClear} 
                  className="flex items-center gap-3 px-8 py-4 bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-500/30 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-lg group"
                >
                  <Trash2 className="w-5 h-5 group-hover:rotate-12 transition-transform" /> 
                  Limpar Registros Locais
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Local Stats Panels */}
                {[
                  { title: 'Solo Offline', icon: <Clock className="text-green-500" />, stats: ranking.solo.sort((a,b) => a.bestTime - b.bestTime).slice(0, 5), color: 'green' },
                  { title: 'Versus Local', icon: <Swords className="text-purple-500" />, stats: ranking.multiplayer.sort((a,b) => b.wins - a.wins).slice(0, 5), color: 'purple' }
                ].map((panel, idx) => (
                  <div key={idx} className={`bg-[#001025]/80 p-8 rounded-[3rem] border border-${panel.color}-500/20 shadow-2xl relative overflow-hidden backdrop-blur-md`}>
                    <div className="flex items-center gap-4 mb-8">
                      <div className={`p-4 bg-${panel.color}-500/10 rounded-2xl border border-${panel.color}-500/20`}>{panel.icon}</div>
                      <h2 className="text-2xl font-black uppercase tracking-tighter italic">{panel.title}</h2>
                    </div>
                    <div className="space-y-4">
                      {panel.stats.length > 0 ? panel.stats.map((entry: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-5 bg-blue-900/10 rounded-3xl border border-blue-900/30">
                          <div className="flex items-center gap-4">
                            <span className="font-black text-xl italic text-blue-700">#{i + 1}</span>
                            <span className="font-black text-lg text-white">{entry.nickname}</span>
                          </div>
                          <span className={`text-${panel.color}-400 font-black text-2xl tracking-tighter`}>
                             {idx === 0 ? `${entry.bestTime}s` : `${entry.wins} Wit`}
                          </span>
                        </div>
                      )) : (
                        <p className="text-blue-500/30 text-center py-10 font-black uppercase tracking-widest text-[9px]">Nenhum registro</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Premium Footer Summary - Optimized for Mobile */}
      <div className="fixed bottom-0 left-0 w-full p-2 sm:p-6 z-50">
        <div className="max-w-xl mx-auto bg-[#001025]/95 border-2 border-blue-500/60 rounded-2xl sm:rounded-[3rem] p-4 sm:p-6 flex items-center justify-between gap-4 sm:gap-6 shadow-[0_-20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(59,130,246,0.3)] backdrop-blur-2xl relative overflow-hidden origin-bottom">
           <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_10px_#3b82f6]" />
           
           <div className="flex items-center gap-5">
              <div className="relative group">
                <div className="w-16 h-16 rounded-full border-2 border-blue-500/50 p-1 relative z-10 shadow-[0_0_15px_rgba(59,130,246,0.4)]">
                  <div className="w-full h-full rounded-full overflow-hidden bg-blue-900/20">
                    {userProfile?.avatarUrl ? (
                      <img src={userProfile.avatarUrl} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <User className="w-8 h-8 text-blue-400/50 mx-auto mt-3.5" />
                    )}
                  </div>
                </div>
                <div className="absolute -top-1 -right-1 z-20">
                   <div className="bg-yellow-500 border border-white rounded-lg px-2 py-0.5 shadow-xl">
                      <span className="text-[9px] font-black text-black">LV {userProfile?.level || 1}</span>
                   </div>
                </div>
              </div>

              <div className="flex flex-col">
                 <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-1 italic">Sua Posição</p>
                 <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    <span className="text-4xl font-black text-white italic tracking-tighter leading-none">{myRank}º</span>
                 </div>
              </div>
           </div>

           <div className="flex flex-col items-end">
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-1 italic">Seus Pontos</p>
              <p className="text-3xl font-black text-blue-100 italic leading-none tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">{myPoints.toLocaleString()}</p>
              <p className="text-[8px] font-black text-blue-600 uppercase tracking-[0.2em] mt-1">Pontos Globais</p>
           </div>

           <div className="w-14 h-14 flex items-center justify-center relative">
              <div className="absolute inset-0 bg-blue-600/10 blur-xl rounded-full" />
              <Medal className="w-12 h-12 text-blue-400 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)] rotate-12 transition-transform hover:scale-110" />
           </div>
        </div>
      </div>
    </div>
  );
}

