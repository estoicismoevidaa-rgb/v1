/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import { Play, RotateCcw, Settings, LogOut, X } from 'lucide-react';

interface PauseMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onRestart: () => void;
  onSettings: () => void;
  onMenu: () => void;
}

export function PauseMenu({ isOpen, onClose, onRestart, onSettings, onMenu }: PauseMenuProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="w-full max-w-xs bg-blue-900 border-2 border-blue-700 rounded-3xl p-6 shadow-2xl"
        >
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-white">Pausa</h2>
            <button onClick={onClose} className="p-2 hover:bg-blue-800 rounded-full transition-all">
              <X className="w-6 h-6 text-blue-400" />
            </button>
          </div>

          <div className="flex flex-col gap-4">
            <button onClick={onClose} className="flex items-center gap-4 p-4 bg-green-600 hover:bg-green-500 rounded-2xl text-white font-bold transition-all shadow-xl">
              <Play className="w-6 h-6" /> Continuar
            </button>
            <button onClick={onRestart} className="flex items-center gap-4 p-4 bg-blue-700 hover:bg-blue-600 rounded-2xl text-white font-bold transition-all shadow-xl">
              <RotateCcw className="w-6 h-6" /> Reiniciar
            </button>
            <button onClick={onSettings} className="flex items-center gap-4 p-4 bg-gray-700 hover:bg-gray-600 rounded-2xl text-white font-bold transition-all shadow-xl">
              <Settings className="w-6 h-6" /> Configurações
            </button>
            <div className="h-px bg-blue-800 my-2" />
            <button onClick={onMenu} className="flex items-center gap-4 p-4 text-red-400 hover:bg-red-500/10 rounded-2xl font-bold transition-all">
              <LogOut className="w-6 h-6" /> Sair para o Menu
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
