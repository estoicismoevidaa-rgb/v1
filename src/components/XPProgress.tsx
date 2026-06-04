import { motion } from 'motion/react';
import React from 'react';

interface XPProgressProps {
  level: number;
  currentXp: number;
  nextLevelXp: number;
  leveledUp?: boolean;
  xpGanho?: number;
}

export function XPProgress({ level, currentXp, nextLevelXp, leveledUp, xpGanho }: XPProgressProps) {
  const percentage = Math.min((currentXp / nextLevelXp) * 100, 100);
  const remaining = Math.max(nextLevelXp - currentXp, 0);

  return (
    <div className="bg-slate-900/80 p-4 rounded-2xl border border-blue-500/30 font-sans mt-4 relative overflow-hidden">
      {leveledUp && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-green-500/20 to-blue-600/20 flex items-center justify-center z-0 animate-pulse"
        />
      )}

      <div className="relative z-10">
        {leveledUp && (
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-center mb-3"
          >
            <h3 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
              LEVEL UP!
            </h3>
            <p className="text-sm text-green-200">Você chegou ao Lv {level}!</p>
          </motion.div>
        )}

        {xpGanho && !leveledUp && (
          <div className="text-center mb-3 text-sm text-blue-300 font-medium">
            Você ganhou <span className="text-green-400 font-bold">+{xpGanho} XP</span>!
          </div>
        )}

        <div className="flex justify-between items-end mb-2">
          <div className="text-blue-400 font-bold">Lv {level}</div>
          <div className="text-blue-500/50 font-bold text-xs uppercase">Lv {level + 1}</div>
        </div>
        
        <div className="h-4 w-full bg-black/50 rounded-full overflow-hidden border border-blue-900/50 relative shadow-inner">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-blue-600 to-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)] relative"
          >
            <div className="absolute top-0 bottom-0 left-0 right-0 bg-gradient-to-b from-white/20 to-transparent"></div>
          </motion.div>
        </div>
        
        <div className="flex justify-between items-center mt-2 text-xs">
          <div className="text-slate-300 font-mono">
            <span className="font-bold text-white">{currentXp}</span> / {nextLevelXp} XP
          </div>
          <div className="text-blue-300">
            Faltam <span className="font-bold text-white">{remaining}</span> XP
          </div>
        </div>
      </div>
    </div>
  );
}
