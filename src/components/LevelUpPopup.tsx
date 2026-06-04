import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { Star, Award, Crown, ChevronUp } from 'lucide-react';

interface LevelUpPopupProps {
  level: number;
  onClose: () => void;
}

export function LevelUpPopup({ level, onClose }: LevelUpPopupProps) {
  useEffect(() => {
    // Efeito de confetes especial para level up
    const duration = 5 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#FFD700', '#FFA500', '#FFFFFF', '#3b82f6']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#FFD700', '#FFA500', '#FFFFFF', '#3b82f6']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.5, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 20, stiffness: 150 }}
        className="relative w-full max-w-[420px] bg-gradient-to-b from-[#002855] to-[#001025] rounded-[3rem] border-4 border-yellow-500 shadow-[0_0_80px_rgba(234,179,8,0.4)] p-8 text-center overflow-hidden"
      >
        {/* Background Patterns & Glows */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-[radial-gradient(circle_at_50%_20%,rgba(59,130,246,0.5),transparent_80%)] pointer-events-none" />
        
        {/* Laurel Leaves (side decorations) */}
        <div className="absolute left-4 bottom-24 opacity-20 transform -rotate-12">
           <Award className="w-24 h-24 text-blue-400" />
        </div>
        <div className="absolute right-4 bottom-24 opacity-20 transform rotate-12">
           <Award className="w-24 h-24 text-blue-400" />
        </div>

        {/* Top Banner with Crown */}
        <div className="relative mb-8 pt-4">
           <motion.div
             initial={{ y: -20, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             transition={{ delay: 0.4 }}
             className="absolute -top-4 left-1/2 -translate-x-1/2 z-30"
           >
              <Crown className="w-12 h-12 text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.8)] fill-current" />
           </motion.div>
           
           <div className="relative z-20">
              <div className="bg-gradient-to-r from-blue-900 via-blue-700 to-blue-900 px-12 py-3 rounded-xl shadow-[0_8px_20px_rgba(0,0,0,0.6)] border-y border-white/20 transform -translate-y-2">
                 <span className="text-3xl font-black text-white italic tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase">PARABÉNS!</span>
              </div>
              <div className="absolute -left-3 top-2 w-6 h-10 bg-blue-950 -z-10 rounded-l-lg rotate-12" />
              <div className="absolute -right-3 top-2 w-6 h-10 bg-blue-950 -z-10 rounded-r-lg -rotate-12" />
              <div className="absolute -left-6 top-1 w-8 h-8 bg-blue-800 -z-20 rotate-45" />
              <div className="absolute -right-6 top-1 w-8 h-8 bg-blue-800 -z-20 -rotate-45" />
           </div>
        </div>

        {/* Central Shield Level Display */}
        <div className="relative flex justify-center mb-6">
           <div className="absolute inset-0 flex justify-center items-center">
              <div className="w-64 h-64 bg-blue-500/10 blur-3xl animate-pulse" />
           </div>

           {/* Upward Arrows */}
           <motion.div
             animate={{ y: [0, -10, 0], opacity: [0.3, 0.6, 0.3] }}
             transition={{ duration: 2, repeat: Infinity }}
             className="absolute -left-0 top-1/2 -translate-y-1/2 text-yellow-500/40"
           >
              <ChevronUp className="w-24 h-24 stroke-[4]" />
           </motion.div>
           <motion.div
             animate={{ y: [0, -10, 0], opacity: [0.3, 0.6, 0.3] }}
             transition={{ duration: 2, repeat: Infinity, delay: 1 }}
             className="absolute -right-0 top-1/2 -translate-y-1/2 text-yellow-500/40"
           >
              <ChevronUp className="w-24 h-24 stroke-[4]" />
           </motion.div>

           <motion.div
             initial={{ scale: 0, rotate: -20 }}
             animate={{ scale: 1, rotate: 0 }}
             transition={{ type: 'spring', delay: 0.5 }}
             className="relative z-10"
           >
              {/* Outer Golden Glow */}
              <div className="absolute inset-0 bg-yellow-500/30 blur-2xl rounded-full scale-110" />
              
              {/* Shield Shape */}
              <div className="w-48 h-56 bg-gradient-to-br from-blue-400 via-blue-600 to-blue-900 border-[6px] border-yellow-500 rounded-[2.5rem] shadow-[0_15px_35px_rgba(0,0,0,0.8)] flex items-center justify-center relative clip-shield overflow-hidden group">
                 <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.2),transparent_70%)]" />
                 <span className="relative z-10 text-9xl font-black text-white italic drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] tracking-tighter">
                   {level}
                 </span>
                 <div className="absolute top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-blue-300 rounded-full blur-sm opacity-50" />
              </div>

              {/* XP Badge */}
              <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 z-20">
                 <div className="bg-[#002855] border-4 border-yellow-500 p-2 transform rotate-45 shadow-xl">
                    <div className="-rotate-45">
                       <span className="text-[10px] font-black text-white tracking-tighter">XP</span>
                    </div>
                 </div>
              </div>
           </motion.div>
        </div>

        {/* Level text */}
        <div className="relative z-10 my-8">
           <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 italic tracking-tighter leading-none mb-1 drop-shadow-lg uppercase">
              Nível {level}
           </h2>
           <h3 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-blue-400 to-blue-600 italic tracking-tighter leading-none drop-shadow-lg uppercase">
              Alcançado
           </h3>
        </div>

        {/* Stars */}
        <Star className="absolute top-1/4 left-1/4 w-4 h-4 text-white fill-current opacity-30 animate-ping" />
        <Star className="absolute top-1/3 right-1/4 w-3 h-3 text-yellow-400 fill-current opacity-40 animate-pulse" />
        <Star className="absolute bottom-1/3 left-1/3 w-2 h-2 text-blue-400 fill-current opacity-50" />

        <p className="text-white/90 text-sm font-medium px-4 mb-10 leading-relaxed max-w-[80%] mx-auto drop-shadow-sm">
          Você evoluiu e chegou ao nível <span className="text-yellow-400 font-black">{level}</span>.
          <br />
          <span className="text-blue-300 font-bold uppercase tracking-widest text-[10px]">Continue jogando para desbloquear novas conquistas!</span>
        </p>

        <button
          onClick={onClose}
          className="w-full relative group"
        >
          <div className="absolute inset-0 bg-yellow-400 blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
          <div className="relative bg-gradient-to-b from-yellow-400 via-yellow-500 to-orange-500 p-[3px] rounded-2xl shadow-[0_10px_30px_rgba(234,179,8,0.4)] transition-all transform active:scale-95 group-hover:-translate-y-1">
             <div className="bg-gradient-to-b from-yellow-300 to-orange-400 rounded-[13px] py-4 shadow-inner flex items-center justify-center">
                <span className="text-xl font-black text-black tracking-widest uppercase italic drop-shadow-sm">CONTINUAR</span>
             </div>
          </div>
        </button>

        <style>{`
          .clip-shield {
            clip-path: polygon(0 0, 100% 0, 100% 80%, 50% 100%, 0 80%);
          }
        `}</style>
      </motion.div>
    </motion.div>
  );
}
