/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Mail, CheckCircle2, AlertCircle, Loader2, LogIn, UserPlus, Lock } from 'lucide-react';
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
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    if (mode === 'register' && !username.trim()) return;

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

        await registerProfile(username, email, password);
        setNeedsConfirmation(true);
      } else {
        const profile = await loginProfile(email, password);
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
      let msg = err.message || 'Ocorreu um erro ao processar seu pedido. Tente novamente.';
      if (msg.toLowerCase().includes('api key') || msg.toLowerCase().includes('chave de api') || msg.toLowerCase().includes('invalid')) {
        msg = 'Erro de Conexão: A Chave de API está inválida ou o projeto Supabase foi pausado. Por favor, verifique as chaves VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY nas configurações ou jogue como convidado.';
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestMode = () => {
    const guestProfile: UserProfile = {
      uid: currentUid,
      username: 'Convidado',
      email: 'guest@local',
      createdAt: new Date().toISOString()
    };
    onAuthenticated(guestProfile);
  };

  if (needsConfirmation) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 z-10 relative">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl text-center"
        >
          <div className="inline-block p-4 bg-green-500/10 rounded-3xl mb-6">
            <Mail className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Verifique seu E-mail</h2>
          <p className="text-slate-400 mb-8">
            Enviamos um link de confirmação para <span className="text-white font-bold">{email}</span>. 
            Por favor, clique no link para ativar sua conta.
          </p>
          <button 
            onClick={() => {
              setNeedsConfirmation(false);
              setMode('login');
              setPassword('');
            }}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-colors"
          >
            Ir para Login
          </button>
        </motion.div>
      </div>
    );
  }

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
              <UserPlus className="w-4 h-4" /> Criar Conta
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
            {mode === 'login' ? 'ENTRAR' : 'CRIAR CONTA'}
          </h1>
          <p className="text-slate-400 text-sm max-w-[280px] mx-auto">
            {mode === 'login' 
              ? 'Use suas credenciais para continuar jogando.' 
              : 'Registre-se para salvar seu progresso e conquistas!'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <AnimatePresence mode="popLayout">
            {mode === 'register' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
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
                    required={mode === 'register'}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

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

          <div>
            <label className="block text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2 ml-1">
              Senha
            </label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading || isSuccess}
                className="w-full pl-12 pr-4 py-4 bg-slate-800/40 border border-white/5 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all disabled:opacity-50"
                required
                minLength={6}
              />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p>{error}</p>
                </div>
                {error.includes('Erro de Conexão') && (
                  <button
                    type="button"
                    onClick={handleGuestMode}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-xl text-xs font-bold transition-all border border-blue-500/20"
                  >
                    Continuar como Convidado (Modo Offline)
                  </button>
                )}
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

          {mode === 'register' && !isLoading && !isSuccess && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl text-blue-300 text-[10px] text-center leading-relaxed"
            >
              <p>Ao clicar em cadastrar, você receberá um <b>email de verificação</b> para ativar sua conta e salvar seu progresso.</p>
            </motion.div>
          )}

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
              mode === 'login' ? 'Entrar no Jogo' : 'Cadastrar'
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

