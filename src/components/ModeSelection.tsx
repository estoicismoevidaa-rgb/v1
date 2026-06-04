/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { User, Users, Globe, ChevronLeft, Lock } from 'lucide-react';

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
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-4 text-white">
      <button 
        onClick={() => onNavigate('home')}
        className="self-start mb-8 flex items-center gap-2 text-blue-300 hover:text-white transition-colors"
      >
        <ChevronLeft className="w-6 h-6" /> Voltar ao Menu
      </button>

      <h2 className="text-4xl font-bold mb-10">Escolha o Modo</h2>

      <div className="flex flex-col gap-6 w-full max-w-xl">
        {modes.map((mode, index) => (
          <motion.button
            key={mode.id}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => handleChoice(mode.id, mode.online)}
            className={`flex items-center gap-6 p-6 border-2 rounded-3xl transition-all text-left shadow-xl ${
              mode.online && isGuest 
                ? 'bg-slate-900/40 border-slate-700 opacity-60 cursor-not-allowed' 
                : 'bg-blue-900/50 border-blue-700 hover:bg-blue-800/50 hover:border-blue-400'
            }`}
          >
            <div className={`p-4 rounded-2xl ${mode.online && isGuest ? 'text-slate-500' : 'text-green-400'} bg-blue-700/50`}>
              {mode.online && isGuest ? <Lock className="w-10 h-10" /> : mode.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-bold">{mode.label}</h3>
                {mode.online && <span className="text-[10px] bg-blue-600 px-2 py-0.5 rounded uppercase font-black tracking-widest text-white">Online</span>}
              </div>
              <p className="text-blue-200">{mode.desc}</p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
