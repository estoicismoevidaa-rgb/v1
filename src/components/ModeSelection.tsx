/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { User, Users, Globe, ChevronLeft } from 'lucide-react';

interface ModeSelectionProps {
  onNavigate: (screen: string) => void;
  onChoice: (mode: 'solo' | 'local' | 'online') => void;
}

export function ModeSelection({ onNavigate, onChoice }: ModeSelectionProps) {
  const modes = [
    { id: 'solo', label: 'Solo', icon: <User className="w-10 h-10" />, desc: 'Jogue sozinho e quebre recordes' },
    { id: 'local', label: 'Multiplayer Local', icon: <Users className="w-10 h-10" />, desc: 'Jogue com amigos no mesmo aparelho' },
    { id: 'online', label: 'Online por Link', icon: <Globe className="w-10 h-10" />, desc: 'Desafie amigos à distância' },
  ];

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
            onClick={() => onChoice(mode.id as any)}
            className="flex items-center gap-6 p-6 bg-blue-900/50 border-2 border-blue-700 rounded-3xl hover:bg-blue-800/50 hover:border-blue-400 transition-all text-left shadow-xl"
          >
            <div className="p-4 bg-blue-700/50 rounded-2xl text-green-400">
              {mode.icon}
            </div>
            <div>
              <h3 className="text-2xl font-bold">{mode.label}</h3>
              <p className="text-blue-200">{mode.desc}</p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
