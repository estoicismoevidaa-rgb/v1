/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { ChevronLeft, Globe, Key, User } from 'lucide-react';
import { Difficulty } from '../types.ts';

interface OnlineMPConfigProps {
  onBack: () => void;
  onCreate: (nickname: string, difficulty: Difficulty) => void;
  onJoin: (nickname: string, roomId: string) => void;
  initialNickname?: string;
}

export function OnlineMPConfig({ onBack, onCreate, onJoin, initialNickname = '' }: OnlineMPConfigProps) {
  const params = new URLSearchParams(window.location.search);
  const initialRoomId = params.get('room') || '';
  
  const [activeTab, setActiveTab] = useState<'create' | 'join'>(initialRoomId ? 'join' : 'create');
  const [nickname, setNickname] = useState(initialNickname);
  const [difficulty, setDifficulty] = useState<Difficulty>('Fácil');
  const [roomId, setRoomId] = useState(initialRoomId);
  const [showAuthWarning, setShowAuthWarning] = useState(false);

  const checkAuth = (action: () => void) => {
    // We check if the userId is a real firebase UID (usually starts with something specific or just check the flag in App)
    // But since this component is nested, we can just check if we can actually reach Firestore or something.
    // For now, I'll assume if it starts with 'local-user-', auth failed.
    const isMockAuth = window.localStorage.getItem('auth-failed') === 'true'; // I'll set this in App
    action(); 
  };

  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const handleCreate = async () => {
    if (isCreating) return;
    setIsCreating(true);
    try {
      const finalNickname = nickname.trim() || `Player${Math.floor(Math.random() * 9000) + 1000}`;
      await onCreate(finalNickname, difficulty);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoin = async () => {
    if (isJoining) return;
    setIsJoining(true);
    try {
      const finalNickname = nickname.trim() || `Player${Math.floor(Math.random() * 9000) + 1000}`;
      if (!roomId.trim()) return;
      await onJoin(finalNickname, roomId.toUpperCase());
    } finally {
      setIsJoining(false);
    }
  };

  const difficulties: Difficulty[] = ['Fácil', 'Médio', 'Difícil', 'Extremo'];

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-4 text-white">
      <button onClick={onBack} className="self-start mb-8 flex items-center gap-2 text-blue-300 hover:text-white">
        <ChevronLeft className="w-6 h-6" /> Voltar
      </button>

      {showAuthWarning && (
        <div className="w-full max-w-md mb-6 p-4 bg-orange-950/50 border border-orange-500 rounded-2xl text-orange-200 text-sm">
          <p className="font-bold mb-1">Apenas Jogos Locais Disponíveis</p>
          <p>Houve um problema de conexão com o Supabase. Solo e Multiplayer Local funcionam normalmente!</p>
          <button onClick={() => setShowAuthWarning(false)} className="mt-2 text-xs underline">Entendi</button>
        </div>
      )}

      <div className="w-full max-w-md bg-blue-900/40 rounded-3xl border border-blue-700 shadow-2xl overflow-hidden">
        <div className="flex border-b border-blue-700">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-4 font-bold transition-all ${
              activeTab === 'create' ? 'bg-blue-800 text-white' : 'text-blue-400 hover:bg-blue-800/30'
            }`}
          >
            Criar Sala
          </button>
          <button
            onClick={() => setActiveTab('join')}
            className={`flex-1 py-4 font-bold transition-all ${
              activeTab === 'join' ? 'bg-blue-800 text-white' : 'text-blue-400 hover:bg-blue-800/30'
            }`}
          >
            Entrar em Sala
          </button>
        </div>

        <div className="p-8">
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-blue-200">Seu Nickname</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Ex: Player1"
                className="w-full pl-12 pr-4 py-3 bg-blue-950 border border-blue-700 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
              />
            </div>
          </div>

          {activeTab === 'create' ? (
            <>
              <div className="mb-8">
                <label className="block text-sm font-medium mb-3 text-blue-200">Dificuldade</label>
                <div className="grid grid-cols-2 gap-3">
                  {difficulties.map((d) => (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className={`py-3 rounded-xl border-2 transition-all font-bold ${
                        difficulty === d 
                          ? 'bg-green-600 border-green-400 text-white' 
                          : 'bg-blue-950 border-blue-700 text-blue-300'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <button
                disabled={isCreating}
                onClick={handleCreate}
                className="w-full py-4 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl font-bold text-xl transition-all shadow-xl"
              >
                {isCreating ? 'Criando...' : 'Gerar Sala'}
              </button>
            </>
          ) : (
            <>
              <div className="mb-8">
                <label className="block text-sm font-medium mb-2 text-blue-200">Código da Sala</label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
                  <input
                    type="text"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                    placeholder="CÓDIGO"
                    className="w-full pl-12 pr-4 py-3 bg-blue-950 border border-blue-700 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all uppercase"
                  />
                </div>
              </div>
              <button
                disabled={!roomId.trim() || isJoining}
                onClick={handleJoin}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl font-bold text-xl transition-all shadow-xl"
              >
                {isJoining ? 'Entrando...' : 'Entrar na Sala'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
