/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { useEffect } from 'react';
import { Trophy, RotateCcw, Home, List, Star, Flame, MinusCircle, PlusCircle } from 'lucide-react';
import { Player } from '../types.ts';
import { calculateOnlineRankingPoints } from '../lib/game-logic.ts';
import { audioController } from '../lib/audio.ts';

interface ResultScreenProps {
  mode: 'solo' | 'local' | 'online';
  players: Player[];
  time?: number;
  attempts?: number;
  onRestart: () => void;
  onMenu: () => void;
  onChangeDifficulty: () => void;
}

export function ResultScreen({ mode, players, time, attempts, onRestart, onMenu, onChangeDifficulty }: ResultScreenProps) {
  useEffect(() => {
    // Play victory sound with a small delay for better reliability
    const playTimer = setTimeout(() => {
      audioController.play('victory');
    }, 300);

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

    return () => {
      clearTimeout(playTimer);
    };
  }, []);

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const winner = sortedPlayers[0];

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 text-white">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-lg bg-blue-900/40 p-8 rounded-3xl border-2 border-green-500 shadow-[0_0_50px_rgba(34,197,94,0.3)] text-center relative overflow-hidden"
      >
        <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-4 animate-pulse" />
        
        <h2 className="text-4xl font-bold mb-2">Fim de Jogo!</h2>
        
        {mode === 'solo' ? (
          <div className="space-y-4 my-8">
            <div className="flex justify-around bg-blue-950/50 p-4 rounded-2xl">
              <div>
                <p className="text-blue-300 text-sm">Tempo</p>
                <p className="text-2xl font-bold">{time}s</p>
              </div>
              <div className="w-px bg-blue-700" />
              <div>
                <p className="text-blue-300 text-sm">Tentativas</p>
                <p className="text-2xl font-bold">{attempts}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="my-8 text-left space-y-6">
            <h3 className="text-xl text-blue-200 text-center mb-6">Resultados da Partida</h3>
            <div className="space-y-4">
              {sortedPlayers.map((p, i) => {
                const rank = i + 1;
                const roomSize = players.length;
                const breakdown = mode === 'online' 
                  ? calculateOnlineRankingPoints(rank, roomSize, p.score, p.maxCombo)
                  : { totalPoints: p.score * 10, pairPoints: p.score * 10, roomSizeBonus: 0, comboBonus: 0, penalty: 0 };

                return (
                  <motion.div 
                    key={p.uid}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`p-5 rounded-3xl border-2 ${
                      i === 0 
                        ? 'bg-green-600/20 border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.2)]' 
                        : 'bg-blue-950/60 border-blue-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${
                          i === 0 ? 'bg-green-500 text-black' : 'bg-blue-800 text-blue-200'
                        }`}>
                          {rank}º
                        </span>
                        <span className="font-black text-lg">{p.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[10px] uppercase font-bold text-blue-400">TotalRanking</span>
                        <span className={`text-xl font-black ${breakdown.totalPoints >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {breakdown.totalPoints > 0 ? '+' : ''}{breakdown.totalPoints}
                        </span>
                        <span className="block text-[8px] text-blue-500/50 font-bold uppercase tracking-tighter mt-1">
                          +{Math.max(0, breakdown.totalPoints)} XP Ganho
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="bg-black/20 p-2 rounded-xl text-center">
                        <p className="text-[9px] text-blue-400 uppercase font-black">Pares</p>
                        <p className="font-bold">{p.score}</p>
                      </div>
                      {mode === 'online' && (
                        <>
                          <div className="bg-black/20 p-2 rounded-xl text-center relative overflow-hidden">
                            <Star className="absolute -right-1 -top-1 w-4 h-4 text-yellow-500/20" />
                            <p className="text-[9px] text-blue-400 uppercase font-black">Vitória</p>
                            <p className="font-bold text-yellow-500">+{breakdown.roomSizeBonus}</p>
                          </div>
                          <div className="bg-black/20 p-2 rounded-xl text-center relative overflow-hidden">
                            <Flame className="absolute -right-1 -top-1 w-4 h-4 text-orange-500/20" />
                            <p className="text-[9px] text-blue-400 uppercase font-black">Combo</p>
                            <p className="font-bold text-orange-500">+{breakdown.comboBonus}</p>
                          </div>
                          <div className="bg-black/20 p-2 rounded-xl text-center relative overflow-hidden">
                            <MinusCircle className="absolute -right-1 -top-1 w-4 h-4 text-red-500/20" />
                            <p className="text-[9px] text-blue-400 uppercase font-black">Derrota</p>
                            <p className="font-bold text-red-500">-{breakdown.penalty}</p>
                          </div>
                        </>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8">
          <button onClick={onRestart} className="flex items-center justify-center gap-2 py-4 bg-green-600 hover:bg-green-500 rounded-2xl font-bold transition-all shadow-lg active:scale-95">
            <RotateCcw className="w-5 h-5" /> Jogar Novamente
          </button>
          
          {mode !== 'online' && (
            <button onClick={onChangeDifficulty} className="flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-bold transition-all shadow-lg active:scale-95">
              <List className="w-5 h-5" /> Trocar Dificuldade
            </button>
          )}

          <button onClick={onMenu} className={`flex items-center justify-center gap-2 py-4 bg-gray-600 hover:bg-gray-500 rounded-2xl font-bold transition-all shadow-lg active:scale-95 ${mode === 'online' ? '' : 'sm:col-span-2'}`}>
            <Home className="w-5 h-5" /> Voltar ao Menu
          </button>
        </div>
      </motion.div>
    </div>
  );
}
