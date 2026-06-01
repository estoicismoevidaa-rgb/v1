/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { ChevronLeft, Plus, X, User } from 'lucide-react';
import { Difficulty } from '../types.ts';

interface LocalMPConfigProps {
  onBack: () => void;
  onStart: (players: string[], difficulty: Difficulty) => void;
}

export function LocalMPConfig({ onBack, onStart }: LocalMPConfigProps) {
  const [newPlayer, setNewPlayer] = useState('');
  const [players, setPlayers] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>('Fácil');

  const addPlayer = () => {
    if (newPlayer.trim() && players.length < 6) {
      setPlayers([...players, newPlayer.trim()]);
      setNewPlayer('');
    }
  };

  const removePlayer = (index: number) => {
    setPlayers(players.filter((_, i) => i !== index));
  };

  const difficulties: Difficulty[] = ['Fácil', 'Médio', 'Difícil', 'Extremo'];

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-4 text-white">
      <button onClick={onBack} className="self-start mb-8 flex items-center gap-2 text-blue-300 hover:text-white">
        <ChevronLeft className="w-6 h-6" /> Voltar
      </button>

      <h2 className="text-3xl font-bold mb-8 text-center">Multiplayer Local</h2>

      <div className="w-full max-w-md bg-blue-900/40 p-8 rounded-3xl border border-blue-700 shadow-2xl">
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-blue-200">Adicionar Jogadores</label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={newPlayer}
              onChange={(e) => setNewPlayer(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addPlayer()}
              placeholder="Nome do jogador"
              className="flex-1 px-4 py-3 bg-blue-950 border border-blue-700 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
            />
            <button
              onClick={addPlayer}
              disabled={!newPlayer.trim() || players.length >= 6}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl flex items-center justify-center gap-2 font-bold disabled:bg-gray-600 sm:w-auto w-full"
            >
              <Plus className="w-5 h-5" /> Adicionar
            </button>
          </div>
        </div>

        {players.length > 0 && (
          <div className="mb-6 space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
            {players.map((p, i) => (
              <div key={i} className="flex items-center justify-between bg-blue-950/80 p-3 rounded-xl border border-blue-800">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-green-400" />
                  <span className="font-medium">{p}</span>
                </div>
                <button onClick={() => removePlayer(i)} className="p-1 hover:bg-red-500/20 rounded-lg text-red-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}

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
          disabled={players.length < 2}
          onClick={() => onStart(players, difficulty)}
          className="w-full py-4 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-2xl font-bold text-xl transition-all shadow-xl active:scale-95"
        >
          Começar (Mínimo 2)
        </button>
      </div>
    </div>
  );
}
