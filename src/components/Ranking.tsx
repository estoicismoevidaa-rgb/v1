/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChevronLeft, Trash2, Clock, Swords, Globe } from 'lucide-react';
import { LocalRanking, RankingEntry } from '../types.ts';
import { useState } from 'react';

interface RankingProps {
  ranking: LocalRanking;
  globalRanking: RankingEntry[];
  loadingGlobal: boolean;
  onClear: () => void;
  onBack: () => void;
}

export function Ranking({ ranking, globalRanking, loadingGlobal, onClear, onBack }: RankingProps) {
  const [tab, setTab] = useState<'local' | 'global'>('global');

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-4 text-white">
      <div className="w-full max-w-2xl">
        <button onClick={onBack} className="self-start mb-8 flex items-center gap-2 text-blue-300 hover:text-white transition-colors">
          <ChevronLeft className="w-6 h-6" /> Voltar ao Menu
        </button>

        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <h2 className="text-4xl font-bold">Ranking</h2>
          
          <div className="flex bg-blue-900/60 p-1 rounded-xl border border-blue-700">
            <button 
              onClick={() => setTab('global')}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${tab === 'global' ? 'bg-blue-600 text-white' : 'text-blue-300 hover:text-white'}`}
            >
              <Globe className="w-4 h-4" /> Global
            </button>
            <button 
              onClick={() => setTab('local')}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${tab === 'local' ? 'bg-blue-600 text-white' : 'text-blue-300 hover:text-white'}`}
            >
              <div className="w-4 h-4 rounded-full border-2 border-current" /> Local
            </button>
          </div>
        </div>

        {tab === 'global' ? (
          <div className="bg-blue-900/40 p-6 sm:p-8 rounded-3xl border border-blue-700 shadow-xl overflow-hidden">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-yellow-400">
              <Globe className="w-5 h-5" /> Melhores Jogadores (Supabase)
            </h3>
            
            {loadingGlobal ? (
              <div className="py-20 text-center text-blue-400 animate-pulse">Carregando dados globais...</div>
            ) : globalRanking.length > 0 ? (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {globalRanking.map((entry, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-blue-950/50 rounded-2xl border border-blue-800/50 hover:border-blue-500/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold ${i === 0 ? 'bg-yellow-500 text-black' : i === 1 ? 'bg-slate-300 text-black' : i === 2 ? 'bg-orange-500 text-black' : 'bg-blue-800 text-blue-100'}`}>
                        {i + 1}
                      </div>
                      <div>
                        <p className="font-bold text-lg">{entry.username}</p>
                        <p className="text-[10px] text-blue-400 uppercase tracking-tighter">{entry.gamesPlayed} partidas jogadas</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-yellow-400 font-black text-xl">{entry.totalPoints} pts</p>
                      {entry.bestTimeEasy && <p className="text-[10px] text-blue-400">Recorde: {entry.bestTimeEasy}s</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-blue-400">
                <p>Nenhum dado global disponível.</p>
                <p className="text-xs mt-2 opacity-60">Certifique-se de que as tabelas 'profiles' e 'stats' foram criadas no Supabase.</p>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="flex justify-end mb-4">
              <button onClick={onClear} className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors text-sm font-bold">
                <Trash2 className="w-4 h-4" /> Limpar Histórico Local
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Solo Best Time */}
              <div className="bg-blue-900/40 p-6 rounded-3xl border border-blue-700 shadow-xl">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-green-400">
                  <Clock className="w-5 h-5" /> Melhor Tempo Solo
                </h3>
                <div className="space-y-3">
                  {ranking.solo.length > 0 ? (
                    ranking.solo.sort((a,b) => a.bestTime - b.bestTime).slice(0, 5).map((entry, i) => (
                      <div key={i} className="flex flex-col p-3 bg-blue-950/50 rounded-xl border border-blue-800">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold">{i + 1}º {entry.nickname}</span>
                          <span className="text-green-400 font-mono font-bold">{entry.bestTime}s</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-blue-400">
                          <span>Dificuldade: {entry.difficulty}</span>
                          <span>Tentativas: {entry.attempts}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-blue-400 text-center py-8">Nenhum recorde ainda.</p>
                  )}
                </div>
              </div>

              {/* Multiplayer Wins */}
              <div className="bg-blue-900/40 p-6 rounded-3xl border border-blue-700 shadow-xl">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-400">
                  <Swords className="w-5 h-5" /> Maiores Vencedores
                </h3>
                <div className="space-y-3">
                  {ranking.multiplayer.length > 0 ? (
                    ranking.multiplayer.sort((a,b) => b.wins - a.wins).slice(0, 5).map((entry, i) => (
                      <div key={i} className="flex justify-between items-center p-4 bg-blue-950/50 rounded-xl border border-blue-800">
                        <span className="font-bold text-lg">{i + 1}º {entry.nickname}</span>
                        <span className="bg-blue-800 px-3 py-1 rounded-lg font-bold">{entry.wins} vitórias</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-blue-400 text-center py-8">Jogue multiplayer para ver resultados.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
