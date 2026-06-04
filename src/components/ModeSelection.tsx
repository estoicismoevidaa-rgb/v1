/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { User, Users, Globe, ChevronLeft, Lock, ChevronRight } from 'lucide-react';

interface ModeSelectionProps {
  onNavigate: (screen: string) => void;
  onChoice: (mode: 'solo' | 'local' | 'online' | 'lobby') => void;
  isGuest?: boolean;
}

export function ModeSelection({ onNavigate, onChoice, isGuest }: ModeSelectionProps) {
  const modes = [
    { id: 'solo', label: 'Solo', icon: <User className="w-10 h-10" />, desc: 'Jogue sozinho e quebre recordes', online: false },
    { id: 'local', label: 'Multiplayer Local', icon: <Users className="w-10 h-10" />, desc: 'Jogue com amigos no mesmo aparelho', online: false },
    { id: 'lobby', label: 'Online Lobby', icon: <Globe className="w-10 h-10" />, desc: 'Salas públicas e ranking mundial solo', online: true },
    { id: 'online', label: 'Sala Privada', icon: <Lock className="w-10 h-10" />, desc: 'Crie uma sala com link para amigos', online: true },
  ];

  const handleChoice = (modeId: string, isOnline: boolean) => {
    if (isOnline && isGuest) {
      alert('Os modos online e o ranking estão disponíveis apenas para jogadores logados. Por favor, faça login ou cadastre-se!');
      onNavigate('auth');
      return;
    }
    onChoice(modeId as any);
  };

  return (
    <div className="flex flex-col items-center min-h-screen p-4 text-white bg-[#000814] relative overflow-hidden">
      {/* Background stars effect */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute top-1/4 left-1/4 w-0.5 h-0.5 bg-white rounded-full animate-pulse" />
        <div className="absolute top-1/2 right-1/3 w-0.5 h-0.5 bg-blue-400 rounded-full animate-pulse" />
        <div className="absolute bottom-1/4 left-1/2 w-0.5 h-0.5 bg-white rounded-full animate-pulse" />
      </div>

      {/* Header with Back Button */}
      <div className="w-full max-w-lg flex items-center justify-start mt-6 mb-10 z-10">
        <button 
          onClick={() => onNavigate('home')} 
          className="flex items-center gap-2 text-blue-400 font-bold border border-blue-500/30 rounded-xl px-4 py-2 hover:bg-blue-500/10 transition-all group"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> 
          Voltar ao Menu
        </button>
      </div>

      {/* Central Title with glow effect like in image */}
      <div className="relative mb-8 sm:mb-12 z-10">
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-48 h-1 bg-blue-500 blur-[2px] opacity-50" />
        <h2 className="text-4xl sm:text-5xl font-black text-center text-white tracking-wider uppercase drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
          Escolha o Modo
        </h2>
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-64 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
      </div>

      <div className="w-full max-w-lg space-y-4 sm:space-y-6 z-10">
        {modes.map((mode, index) => (
          <motion.button
            key={mode.id}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => handleChoice(mode.id, mode.online)}
            className={`w-full flex items-center gap-4 sm:gap-6 p-1 rounded-3xl transition-all relative group h-28 sm:h-36 ${
              mode.online && isGuest 
                ? 'opacity-80' 
                : 'hover:scale-[1.02]'
            }`}
          >
            {/* Outer Glowing Border Frame */}
            <div className={`absolute inset-0 rounded-3xl border-2 transition-all ${
              mode.online && isGuest
                ? 'border-blue-900/40 bg-blue-950/20 shadow-[0_0_10px_rgba(30,58,138,0.2)]'
                : 'border-blue-500 bg-[#001d3d]/90 shadow-[0_0_20px_rgba(59,130,246,0.3)] group-hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] group-hover:border-blue-400'
            }`} />

            {/* Icon Frame with Corners */}
            <div className="ml-3 sm:ml-5 relative z-10 w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 flex items-center justify-center">
              {/* Corner Brackets for Icon */}
              <div className="absolute inset-0">
                 <div className="absolute top-0 left-0 w-3 sm:w-4 h-3 sm:h-4 border-t-2 border-l-2 border-green-500 rounded-tl-lg" />
                 <div className="absolute top-0 right-0 w-3 sm:w-4 h-3 sm:h-4 border-t-2 border-r-2 border-green-500 rounded-tr-lg opacity-40" />
                 <div className="absolute bottom-0 left-0 w-3 sm:w-4 h-3 sm:h-4 border-b-2 border-l-2 border-green-500 rounded-bl-lg opacity-40" />
                 <div className="absolute bottom-0 right-0 w-3 sm:w-4 h-3 sm:h-4 border-b-2 border-r-2 border-green-500 rounded-br-lg" />
              </div>
              
              <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center bg-blue-900/20 border border-blue-500/20 ${
                mode.online && isGuest ? 'text-blue-500' : 'text-green-500 drop-shadow-[0_0_10px_rgba(34,197,94,0.6)]'
              }`}>
                {mode.online && isGuest ? <Lock className="w-8 h-8 sm:w-10 sm:h-10" /> : mode.icon}
              </div>
            </div>

            {/* Texts */}
            <div className="flex-1 text-left relative z-10 space-y-0.5 sm:space-y-1">
              <div className="flex items-center gap-2 sm:gap-3">
                <h3 className="text-xl sm:text-3xl font-black text-white italic tracking-tight uppercase leading-none">{mode.label}</h3>
                {mode.online && (
                  <div className="bg-blue-600 px-1.5 py-0.5 rounded shadow-[0_0_10px_rgba(37,99,235,0.6)]">
                    <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-tighter text-white">ONLINE</span>
                  </div>
                )}
              </div>
              <p className="text-blue-200/80 text-xs sm:text-sm font-medium tracking-tight pr-4">
                {mode.desc}
              </p>
            </div>

            {/* Right Arrow */}
            <div className="mr-4 sm:mr-6 relative z-10">
              <ChevronRight className={`w-6 h-6 sm:w-8 sm:h-8 ${mode.online && isGuest ? 'text-blue-900' : 'text-blue-400 group-hover:text-white transition-colors'}`} />
            </div>
          </motion.button>
        ))}
      </div>

      {/* Decorative Floor effect like in image */}
      <div className="fixed bottom-0 left-0 w-full h-[1px] bg-blue-500/30 blur-[1px]" />
    </div>
  );
}
