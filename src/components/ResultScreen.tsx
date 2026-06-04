/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { useEffect } from 'react';
import { Trophy, RotateCcw, Home, List, Star, Flame, MinusCircle, PlusCircle } from 'lucide-react';
import { Player, Difficulty } from '../types.ts';
import { calculateOnlineRankingPoints, calculateSoloRankingPoints, DIFFICULTY_CONFIG } from '../lib/game-logic.ts';
import { audioController } from '../lib/audio.ts';
import { XPProgress } from './XPProgress.tsx';

interface ResultScreenProps {
  mode: 'solo' | 'local' | 'online';
  players: Player[];
  difficulty: Difficulty;
  time?: number;
  attempts?: number;
  levelUpData?: any;
  currentUserId?: string | null;
  onRestart: () => void;
  onMenu: () => void;
  onChangeDifficulty: () => void;
}

export function ResultScreen({ mode, players, difficulty, time, attempts, levelUpData, currentUserId, onRestart, onMenu, onChangeDifficulty }: ResultScreenProps) {
  useEffect(() => {
    // Determine if the current player is the winner
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    const winner = sortedPlayers[0];
    
    let result: 'victory' | 'defeat' = 'victory';
    
    if (mode === 'online' && currentUserId) {
      if (winner && winner.uid !== currentUserId) {
        result = 'defeat';
      }
    } else if (mode === 'solo') {
      result = 'victory';
    } else if (mode === 'local') {
      result = 'victory'; // In local MP, someone always wins on the screen
    }

    // Play result sound with a small delay for better reliability
    const playTimer = setTimeout(() => {
      audioController.play(result);
    }, 500);

    if (result === 'victory') {
      const duration = 3 * 1000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 2,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#22c55e', '#3b82f6', '#f59e0b']
        });
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#22c55e', '#3b82f6', '#f59e0b']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }

    return () => {
      clearTimeout(playTimer);
    };
  }, [mode, players, currentUserId]);

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-white">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-lg bg-[#001025] p-6 sm:p-10 rounded-[2.5rem] border-[1px] border-green-500/80 shadow-[0_0_40px_rgba(34,197,94,0.2)] text-center relative overflow-hidden"
      >
        <div className="relative mb-6">
           <Trophy className="w-16 h-16 text-yellow-500 mx-auto drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]" />
        </div>
        
        <h2 className="text-4xl font-black mb-10 tracking-tight">Fim de Jogo!</h2>
        
        {mode === 'solo' ? (
          <div className="space-y-6">
            <div className="grid grid-cols-[1fr,2px,1fr] items-center bg-blue-900/20 p-6 rounded-[2rem] border border-blue-500/20">
              <div className="text-center">
                <p className="text-blue-400 text-[10px] uppercase font-black tracking-[0.2em] mb-2 leading-none">Tempo</p>
                <p className="text-3xl font-black text-white">{time}s</p>
              </div>
              <div className="h-10 bg-blue-500/20" />
              <div className="text-center">
                <p className="text-blue-400 text-[10px] uppercase font-black tracking-[0.2em] mb-2 leading-none">Tentativas</p>
                <p className="text-3xl font-black text-white">{attempts}</p>
              </div>
            </div>

            {(() => {
              const errors = (attempts || 0) - DIFFICULTY_CONFIG[difficulty].pairs;
              const soloResult = calculateSoloRankingPoints(difficulty, time || 0, Math.max(0, errors));
              return (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="bg-green-600/10 border-[1px] border-green-500/50 rounded-[2.5rem] p-10 relative overflow-hidden group"
                >
                  <PlusCircle className="absolute -right-6 -top-6 w-32 h-32 text-green-500/5 group-hover:scale-110 transition-transform duration-1000" />
                  <p className="text-green-500 font-black uppercase tracking-[0.2em] text-[10px] mb-3 leading-none">Pontuação Conquistada</p>
                  <h3 className="text-7xl font-black text-white mb-2 tracking-tighter drop-shadow-lg">{soloResult.totalPoints}</h3>
                  <div className="flex justify-center gap-4 text-[9px] text-blue-300/40 font-bold font-mono">
                    <span>Base: {soloResult.basePoints}</span>
                    <span className="opacity-30">•</span>
                    <span>Mult: x{soloResult.difficultyMultiplier}</span>
                  </div>
                </motion.div>
              );
            })()}
          </div>
        ) : (
          <div className="space-y-6">
            {/* ... keeping multi-player consistent with new style ... */}
            <div className="space-y-3">
              {sortedPlayers.map((p, i) => {
                const rank = i + 1;
                const roomSize = players.length;
                const breakdown = mode === 'online' 
                  ? calculateOnlineRankingPoints(rank, roomSize, p.score, p.maxCombo)
                  : { totalPoints: p.score * 10, pairPoints: p.score * 10, roomSizeBonus: 0, comboBonus: 0, penalty: 0 };

                return (
                  <motion.div 
                    key={p.uid}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`p-5 rounded-3xl border ${
                      i === 0 
                        ? 'bg-green-600/10 border-green-500/50' 
                        : 'bg-blue-900/10 border-blue-500/20'
                    } flex items-center justify-between`}
                  >
                    <div className="flex items-center gap-4 text-left">
                       <span className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm italic ${
                         i === 0 ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.5)]' : 'bg-blue-800/50 text-blue-300'
                       }`}>
                         {rank}º
                       </span>
                       <div>
                         <p className="font-black text-base leading-none mb-1">{p.name}</p>
                         <p className="text-[9px] font-bold text-blue-500/60 uppercase">Pares: {p.score}</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest leading-none mb-1">Pontos</p>
                       <p className={`text-2xl font-black tracking-tighter ${breakdown.totalPoints >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                         {breakdown.totalPoints > 0 ? '+' : ''}{breakdown.totalPoints}
                       </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {levelUpData && (
          <XPProgress 
            level={levelUpData.level} 
            currentXp={levelUpData.xpAtual} 
            nextLevelXp={levelUpData.xpParaProximoLevel} 
            leveledUp={levelUpData.leveledUp} 
            xpGanho={levelUpData.xpGanho} 
          />
        )}

        <div className="flex flex-col gap-3 mt-10">
          <div className="grid grid-cols-2 gap-3">
             <button onClick={onRestart} className="flex items-center justify-center gap-2 py-4 bg-green-600 hover:bg-green-500 rounded-2xl font-black text-sm transition-all shadow-lg active:scale-95 group">
                <RotateCcw className="w-5 h-5 group-hover:rotate-[-45deg] transition-transform" /> Jogar Novamente
             </button>
             
             {mode !== 'online' ? (
                <button onClick={onChangeDifficulty} className="flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black text-sm transition-all shadow-lg active:scale-95 group">
                   <List className="w-5 h-5 group-hover:scale-110 transition-transform" /> Trocar Dificuldade
                </button>
             ) : (
                <div className="bg-blue-900/10 border border-blue-500/20 rounded-2xl flex items-center justify-center p-4">
                   <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Partida Finalizada</span>
                </div>
             )}
          </div>

          <button onClick={onMenu} className="flex items-center justify-center gap-2 py-4 bg-slate-700 hover:bg-slate-600 rounded-2xl font-black text-sm transition-all shadow-lg active:scale-95 group">
            <Home className="w-5 h-5 group-hover:scale-110 transition-transform" /> Voltar ao Menu
          </button>
        </div>
      </motion.div>
    </div>
  );
}
