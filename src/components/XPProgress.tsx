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
    <div className="bg-blue-900/10 p-6 rounded-[2rem] border border-blue-500/20 font-sans mt-6 relative overflow-hidden">
      <div className="relative z-10">
        <div className="text-center mb-6">
          <h3 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400 tracking-wider">
            LEVEL UP!
          </h3>
          <p className="text-[13px] text-blue-100/80 font-medium">Você chegou ao Lv {level}!</p>
        </div>

        <div className="flex justify-between items-end mb-3">
          <div className="text-blue-400 font-black text-xs uppercase italic">Lv {level}</div>
          <div className="text-blue-500/30 font-black text-[10px] uppercase italic tracking-tighter">Lv {level + 1}</div>
        </div>
        
        <div className="h-2 w-full bg-blue-950 rounded-full overflow-hidden border border-blue-900/50 relative shadow-inner">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-blue-400 to-green-400 shadow-[0_0_15px_rgba(74,222,128,0.4)] relative rounded-full"
          />
        </div>
        
        <div className="flex justify-between items-center mt-3">
          <div className="text-[10px] font-bold text-blue-100/40 tracking-tight">
            <span className="text-white">{currentXp}</span> / {nextLevelXp} <span className="opacity-50">XP</span>
          </div>
          <div className="text-[10px] font-bold text-blue-100/40 tracking-tight">
            Faltam <span className="text-white font-black">{remaining}</span> <span className="opacity-50">XP</span>
          </div>
        </div>
      </div>
    </div>
  );
}
