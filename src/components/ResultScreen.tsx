/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { useEffect } from 'react';
import { Trophy, RotateCcw, Home, List } from 'lucide-react';
import { Player } from '../types.ts';

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
          <div className="my-8">
            <h3 className="text-xl text-blue-200 mb-4">O vencedor é <span className="text-green-400 font-bold">{winner.name}</span>!</h3>
            <div className="space-y-2">
              {sortedPlayers.map((p, i) => (
                <div key={p.uid} className={`flex items-center justify-between p-3 rounded-xl ${i === 0 ? 'bg-green-600/30 border border-green-500' : 'bg-blue-950/50'}`}>
                  <span className="font-bold">{i + 1}º {p.name}</span>
                  <span className="text-lg font-mono">{p.score} pares</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8">
          <button onClick={onRestart} className="flex items-center justify-center gap-2 py-4 bg-green-600 hover:bg-green-500 rounded-2xl font-bold transition-all shadow-lg active:scale-95">
            <RotateCcw className="w-5 h-5" /> Jogar Novamente
          </button>
          <button onClick={onChangeDifficulty} className="flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-bold transition-all shadow-lg active:scale-95">
            <List className="w-5 h-5" /> Trocar Dificuldade
          </button>
          <button onClick={onMenu} className="flex items-center justify-center gap-2 py-4 bg-gray-600 hover:bg-gray-500 rounded-2xl font-bold transition-all shadow-lg active:scale-95 sm:col-span-2">
            <Home className="w-5 h-5" /> Voltar ao Menu
          </button>
        </div>
      </motion.div>
    </div>
  );
}
