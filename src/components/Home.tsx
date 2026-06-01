/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Apple, Play, Info, Trophy, Settings as SettingsIcon, Users } from 'lucide-react';

interface HomeProps {
  onNavigate: (screen: string) => void;
  onLogout?: () => void;
  username?: string;
}

export function Home({ onNavigate, onLogout, username }: HomeProps) {
  const menuItems = [
    { id: 'mode-selection', label: 'Jogar', icon: <Play className="w-6 h-6" />, color: 'bg-green-600 hover:bg-green-500' },
    { id: 'ranking', label: 'Ranking', icon: <Trophy className="w-6 h-6" />, color: 'bg-blue-600 hover:bg-blue-500' },
    { id: 'settings', label: 'Configurações', icon: <SettingsIcon className="w-6 h-6" />, color: 'bg-gray-600 hover:bg-gray-500' },
    { id: 'how-to-play', label: 'Como Jogar', icon: <Info className="w-6 h-6" />, color: 'bg-orange-600 hover:bg-orange-500' },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 text-white">
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-12"
      >
        <div className="flex items-center justify-center mb-4">
          <Apple className="w-16 h-16 text-green-400 animate-bounce" />
        </div>
        <h1 className="text-5xl font-bold tracking-tighter mb-2">Jogo da Memória Frutas</h1>
        <p className="text-blue-200 text-lg">Teste sua memória com as frutas mais deliciosas!</p>
      </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md">
          {menuItems.map((item, index) => (
            <motion.button
              key={item.id}
              initial={{ x: index % 2 === 0 ? -20 : 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onNavigate(item.id)}
              className={`flex items-center justify-center gap-3 py-4 rounded-2xl transition-all shadow-lg active:scale-95 ${item.color} font-bold text-lg`}
            >
              {item.icon}
              {item.label}
            </motion.button>
          ))}
        </div>

        {onLogout && (
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            onClick={onLogout}
            className="mt-12 px-6 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-3 cursor-pointer group"
          >
            <Users className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <div className="text-left">
              <p className="text-[10px] uppercase tracking-widest font-bold opacity-60">Logado como</p>
              <p className="text-sm font-bold text-white">{username} <span className="text-red-400 font-normal ml-1">(Sair)</span></p>
            </div>
          </motion.button>
        )}
      </div>
  );
}
