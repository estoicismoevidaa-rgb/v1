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
  avatarUrl?: string;
}

export function Home({ onNavigate, onLogout, username, avatarUrl }: HomeProps) {
  const menuItems = [
    { id: 'mode-selection', label: 'Jogar', icon: <Play className="w-6 h-6" />, color: 'bg-green-600 hover:bg-green-500' },
    { id: 'ranking', label: 'Ranking', icon: <Trophy className="w-6 h-6" />, color: 'bg-blue-600 hover:bg-blue-500' },
    { id: 'settings', label: 'Configurações', icon: <SettingsIcon className="w-6 h-6" />, color: 'bg-gray-600 hover:bg-gray-500' },
    { id: 'how-to-play', label: 'Como Jogar', icon: <Info className="w-6 h-6" />, color: 'bg-orange-600 hover:bg-orange-500' },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 text-white">
      {onLogout && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute top-4 right-4 animate-in fade-in slide-in-from-top-4 duration-300"
        >
          {username ? (
              <button 
                onClick={() => onNavigate('settings')}
                className="flex items-center gap-3 px-4 py-2 bg-blue-900/40 rounded-xl border border-blue-700 hover:border-green-500 hover:bg-blue-800 transition-all cursor-pointer shadow-lg active:scale-95 duration-200"
              >
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs overflow-hidden border border-blue-500/50">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
                  ) : (
                    username[0].toUpperCase()
                  )}
                </div>
                <span className="font-bold text-sm hidden sm:inline">{username}</span>
              </button>
          ) : (
            <button 
              onClick={() => onNavigate('auth')}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-500 rounded-xl font-bold transition-all shadow-lg active:scale-95"
            >
              <Users className="w-4 h-4" /> Entrar / Cadastro
            </button>
          )}
        </motion.div>
      )}

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
      </div>
  );
}
