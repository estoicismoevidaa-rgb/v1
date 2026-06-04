/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Globe, Key, User } from 'lucide-react';
import { Difficulty } from '../types.ts';

interface OnlineMPConfigProps {
  onBack: () => void;
  onCreate: (nickname: string, difficulty: Difficulty, password?: string) => void;
  onJoin: (nickname: string, roomId: string, password?: string) => void;
  initialNickname?: string;
}

export function OnlineMPConfig({ onBack, onCreate, onJoin, initialNickname = '' }: OnlineMPConfigProps) {
  const params = new URLSearchParams(window.location.search);
  const initialRoomId = params.get('room') || '';
  
  const [activeTab, setActiveTab] = useState<'create' | 'join'>(initialRoomId ? 'join' : 'create');
  const [nickname, setNickname] = useState(initialNickname);
  const [roomId, setRoomId] = useState(initialRoomId);
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<'search' | 'password'>(initialRoomId ? 'password' : 'search');
  const [showAuthWarning, setShowAuthWarning] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [roomFound, setRoomFound] = useState<any>(null);

  // Auto-search if coming from URL
  useEffect(() => {
    if (initialRoomId) {
      const autoSearch = async () => {
        setIsSearching(true);
        try {
          const { getRoom } = await import('../lib/supabase-service.ts');
          const data = await getRoom(initialRoomId.toUpperCase());
          if (data) {
            setRoomFound(data);
            setStep('password');
          }
        } catch (err) {
          console.error('Auto-search error:', err);
        } finally {
          setIsSearching(false);
        }
      };
      autoSearch();
    }
  }, [initialRoomId]);

  const handleCreate = async () => {
    if (isCreating) return;
    setIsCreating(true);
    try {
      const finalNickname = nickname.trim() || `Player${Math.floor(Math.random() * 9000) + 1000}`;
      // Online mode always forced to Hard difficulty
      await onCreate(finalNickname, 'Difícil', password);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSearch = async () => {
    if (!roomId.trim() || isSearching) return;
    setIsSearching(true);
    try {
      const { getRoom } = await import('../lib/supabase-service.ts');
      const data = await getRoom(roomId.toUpperCase());
      
      if (!data) {
        alert('Sala não encontrada! Verifique o código.');
        return;
      }
      
      setRoomFound(data);
      setStep('password');
    } catch (err) {
      console.error(err);
      alert('Erro ao buscar sala.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleJoin = async () => {
    if (isJoining) return;
    setIsJoining(true);
    try {
      const finalNickname = nickname.trim() || `Player${Math.floor(Math.random() * 9000) + 1000}`;
      await onJoin(finalNickname, roomId.toUpperCase(), password);
    } finally {
      setIsJoining(false);
    }
  };

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
              <div className="mb-8 p-4 bg-blue-500/10 border border-blue-500/30 rounded-2xl">
                <p className="text-sm font-bold text-blue-400 mb-1">Dificuldade Fixa</p>
                <p className="text-xl font-black text-white">DIFÍCIL — 36 CARTAS</p>
                <p className="text-[10px] text-blue-400/60 mt-2 uppercase tracking-widest font-bold">
                  Todas as partidas online são padronizadas
                </p>
              </div>
              <div className="mb-8">
                <label className="block text-sm font-medium mb-2 text-blue-200">Senha da Sala (Opcional)</label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Deixe em branco para aberta"
                    className="w-full pl-12 pr-4 py-3 bg-blue-950 border border-blue-700 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
                  />
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
            <AnimatePresence mode="wait">
              {step === 'search' ? (
                <motion.div
                  key="search"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div className="mb-8">
                    <label className="block text-sm font-medium mb-2 text-blue-200">Código da Sala</label>
                    <div className="relative">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
                      <input
                        type="text"
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                        placeholder="EXP: ABCD12"
                        className="w-full pl-12 pr-4 py-3 bg-blue-950 border border-blue-700 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all uppercase"
                      />
                    </div>
                  </div>
                  <button
                    disabled={!roomId.trim() || isSearching}
                    onClick={handleSearch}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl font-bold text-xl transition-all shadow-xl"
                  >
                    {isSearching ? 'Buscando...' : 'Pesquisar Sala'}
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="password"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center gap-3">
                    <Globe className="w-6 h-6 text-green-400" />
                    <div>
                      <p className="text-xs text-green-400 font-bold uppercase">Sala Encontrada</p>
                      <p className="text-lg font-black tracking-widest">{roomId}</p>
                    </div>
                    <button 
                      onClick={() => setStep('search')}
                      className="ml-auto text-xs text-blue-400 underline"
                    >
                      Alterar
                    </button>
                  </div>

                  <div className="mb-8">
                    <label className="block text-sm font-medium mb-2 text-blue-200">Senha da Sala</label>
                    <div className="relative">
                      <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Digite a senha"
                        autoFocus
                        className="w-full pl-12 pr-4 py-3 bg-blue-950 border border-blue-700 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <button
                    disabled={isJoining}
                    onClick={handleJoin}
                    className="w-full py-4 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl font-bold text-xl transition-all shadow-xl"
                  >
                    {isJoining ? 'Entrando...' : 'Confirmar e Entrar'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
