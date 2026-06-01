/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Difficulty } from '../types.ts';

interface SoloConfigProps {
  onBack: () => void;
  onStart: (nickname: string, difficulty: Difficulty) => void;
  initialNickname?: string;
}

export function SoloConfig({ onBack, onStart, initialNickname = '' }: SoloConfigProps) {
  const [nickname, setNickname] = useState(initialNickname);
  const [difficulty, setDifficulty] = useState<Difficulty>('Fácil');

  const difficulties: Difficulty[] = ['Fácil', 'Médio', 'Difícil', 'Extremo'];

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-4 text-white">
      <button onClick={onBack} className="self-start mb-8 flex items-center gap-2 text-blue-300 hover:text-white">
        <ChevronLeft className="w-6 h-6" /> Voltar
      </button>

      <h2 className="text-3xl font-bold mb-8">Modo Solo</h2>

      <div className="w-full max-w-md bg-blue-900/40 p-8 rounded-3xl border border-blue-700 shadow-2xl">
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-blue-200">Seu Nickname</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Ex: MestreFruta"
            className="w-full px-4 py-3 bg-blue-950 border border-blue-700 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
            maxLength={15}
          />
        </div>

        <div className="mb-8">
          <label className="block text-sm font-medium mb-3 text-blue-200">Dificuldade</label>
          <div className="grid grid-cols-2 gap-3">
            {difficulties.map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`py-3 rounded-xl border-2 transition-all font-bold ${
                  difficulty === d 
                    ? 'bg-green-600 border-green-400 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]' 
                    : 'bg-blue-950 border-blue-700 text-blue-300 hover:border-blue-500'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <button
          disabled={!nickname.trim()}
          onClick={() => onStart(nickname, difficulty)}
          className="w-full py-4 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-2xl font-bold text-xl transition-all shadow-xl active:scale-95"
        >
          Começar Partida
        </button>
      </div>
    </div>
  );
}
