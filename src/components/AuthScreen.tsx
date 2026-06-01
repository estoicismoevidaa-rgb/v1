/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Mail, CheckCircle2, AlertCircle, Loader2, LogIn, UserPlus } from 'lucide-react';
import { checkUsernameExists, registerProfile, loginProfile } from '../lib/profile-service.ts';
import { UserProfile } from '../types.ts';

interface AuthScreenProps {
  onAuthenticated: (profile: UserProfile) => void;
  currentUid: string;
}

export function AuthScreen({ onAuthenticated, currentUid }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !email.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      if (mode === 'register') {
        const exists = await checkUsernameExists(username);
        if (exists) {
          setError('Este nome de usuário já está em uso. Escolha outro.');
          setIsLoading(false);
          return;
        }

        const profile = await registerProfile(currentUid, username, email);
        setIsSuccess(true);
        setTimeout(() => onAuthenticated(profile), 1500);
      } else {
        const profile = await loginProfile(username, email);
        if (!profile) {
          setError('Usuário ou email incorretos. Verifique seus dados.');
          setIsLoading(false);
          return;
        }

        setIsSuccess(true);
        setTimeout(() => onAuthenticated(profile), 1000);
      }
    } catch (err: any) {
      console.error('Auth flow error:', err);
      setError('Ocorreu um erro ao processar seu pedido. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 z-10 relative">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden relative"
      >
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/20 blur-[80px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-green-500/20 blur-[80px] rounded-full pointer-events-none" />

        <div className="flex justify-center mb-6">
          <div className="flex bg-slate-800/50 p-1 rounded-2xl border border-white/5">
            <button 
              onClick={() => { setMode('login'); setError(null); }}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${mode === 'login' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-400 hover:text-white'}`}
            >
              <LogIn className="w-4 h-4" /> Entrar
            </button>
            <button 
              onClick={() => { setMode('register'); setError(null); }}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${mode === 'register' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-400 hover:text-white'}`}
            >
              <UserPlus className="w-4 h-4" /> Registrar
            </button>
          </div>
        </div>

        <div className="text-center mb-8">
          <motion.div 
            key={mode}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-block p-4 bg-blue-500/10 rounded-3xl mb-4"
          >
            {mode === 'login' ? <User className="w-10 h-10 text-blue-400" /> : <UserPlus className="w-10 h-10 text-blue-400" />}
          </motion.div>
          <h1 className="text-4xl font-black text-white mb-2 font-sans tracking-tight uppercase">
            {mode === 'login' ? 'BEM-VINDO' : 'CRIAR CONTA'}
          </h1>
          <p className="text-slate-400 text-sm max-w-[280px] mx-auto">
            {mode === 'login' 
              ? 'Entre com seu nome e email para continuar seu progresso.' 
              : 'Registre-se agora para salvar seu progresso e jogar online com amigos!'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2 ml-1">
              Nome de Usuário
            </label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
              <input
                type="text"
                placeholder="Ex: roni"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading || isSuccess}
                className="w-full pl-12 pr-4 py-4 bg-slate-800/40 border border-white/5 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all disabled:opacity-50"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2 ml-1">
              Email
            </label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
              <input
                type="email"
                placeholder="Ex: roni@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading || isSuccess}
                className="w-full pl-12 pr-4 py-4 bg-slate-800/40 border border-white/5 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all disabled:opacity-50"
                required
              />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p>{error}</p>
              </motion.div>
            )}

            {isSuccess && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm justify-center"
              >
                <CheckCircle2 className="w-5 h-5" />
                <p className="font-bold">{mode === 'login' ? 'Login realizado!' : 'Conta criada com sucesso!'}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={isLoading || isSuccess}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-bold text-lg shadow-xl shadow-blue-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : isSuccess ? (
              'Redirecionando...'
            ) : (
              'Começar a Jogar'
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-slate-500 text-xs uppercase tracking-widest font-medium">
          Jogo da Memória Frutas • 2024
        </p>
      </motion.div>
    </div>
  );
}

