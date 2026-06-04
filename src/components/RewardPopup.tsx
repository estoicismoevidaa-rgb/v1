import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, CheckCircle, ChevronRight, User } from 'lucide-react';
import { audioController } from '../lib/audio';

export function RewardPopup({ 
  rewards, 
  onClose,
  onEquip,
  onViewProfile 
}: { 
  rewards: any[]; 
  onClose: () => void;
  onEquip: (id: string) => Promise<void>;
  onViewProfile: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isEquipping, setIsEquipping] = useState(false);
  const [justEquipped, setJustEquipped] = useState(false);

  if (!rewards || rewards.length === 0 || currentIndex >= rewards.length) {
    if (rewards && currentIndex > 0) onClose();
    return null;
  }

  const currentReward = rewards[currentIndex];

  const handleNext = () => {
    setJustEquipped(false);
    if (currentIndex < rewards.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handleEquip = async () => {
    if (justEquipped) return;
    setIsEquipping(true);
    await onEquip(currentReward.reward_id);
    setJustEquipped(true);
    setIsEquipping(false);
    audioController.play('match'); // small sound effect
    setTimeout(() => {
      handleNext();
    }, 1500);
  };

  const getBorderColor = (color: string) => {
    switch(color) {
      case 'bronze': return 'border-[#cd7f32] shadow-[0_0_20px_#cd7f32]';
      case 'silver': return 'border-[#C0C0C0] shadow-[0_0_20px_#C0C0C0]';
      case 'gold': return 'border-[#FFD700] shadow-[0_0_25px_#FFD700]';
      case 'diamond': return 'border-[#00FFFF] shadow-[0_0_30px_#00FFFF]';
      case 'purple': return 'border-[#a855f7] shadow-[0_0_35px_#a855f7]';
      case 'red_gold': return 'border-[#ef4444] shadow-[0_0_40px_#ef4444]';
      case 'green_neon': return 'border-[#39ff14] shadow-[0_0_40px_#39ff14]';
      case 'blue_purple': return 'border-[#6366f1] shadow-[0_0_45px_#6366f1]';
      case 'white_silver': return 'border-[#ffffff] shadow-[0_0_50px_#ffffff]';
      case 'gold_blue_purple': return 'border-[#f59e0b] shadow-[0_0_55px_#f59e0b]';
      default: return 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]';
    }
  };

  const currentRewardData = {
    ...currentReward,
    color: currentReward.reward_id.replace('frame_', '') // Fallback logic
  };

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
        
        <motion.div 
          initial={{ scale: 0.8, y: 50, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          className="relative bg-[#001025] border-2 border-green-500 rounded-3xl p-8 max-w-sm w-full text-center shadow-[0_0_60px_rgba(34,197,94,0.3)] overflow-hidden"
        >
          {/* Top text */}
          <div className="mb-8">
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-green-400 to-blue-400 tracking-tighter uppercase drop-shadow-[0_2px_10px_rgba(0,0,0,1)]">
              🏆 NOVA CONQUISTA!
            </h2>
            <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-green-500 to-transparent mt-2" />
          </div>

          {/* Icon/Frame Preview */}
          <div className="relative w-32 h-32 mx-auto mb-6">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
              className="absolute -inset-8 opacity-20 bg-[radial-gradient(circle,rgba(255,255,255,0.8),transparent)] blur-xl" 
            />
            
            <div className={`w-full h-full rounded-full border-4 ${getBorderColor(currentRewardData.color)} flex items-center justify-center bg-black/50 relative z-10 p-2`}>
              <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border border-white/20">
                 <User className="w-12 h-12 text-slate-500" />
              </div>
            </div>
            {/* Particles or extra fx can be added here */}
          </div>

          <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2 drop-shadow-md">
            {currentReward.reward_name}
          </h3>
          <p className="text-green-400 font-black text-[10px] uppercase tracking-[0.2em] mb-4">
            Desbloqueada no Lv {currentReward.required_level}
          </p>

          <p className="text-sm font-medium text-blue-200/80 mb-8 max-w-[260px] mx-auto">
            {currentReward.description || "Você alcançou um novo marco de evolução. Equipe essa moldura e mostre sua conquista para outros jogadores!"}
          </p>

          <div className="space-y-3">
            <button 
              onClick={handleEquip}
              disabled={justEquipped || isEquipping}
              className={`w-full py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest transition-all ${
                justEquipped 
                  ? 'bg-green-600 text-white shadow-[0_0_20px_#16a34a]' 
                  : 'bg-green-500 hover:bg-green-400 text-black shadow-[0_0_20px_rgba(34,197,94,0.4)] active:scale-95'
              } flex items-center justify-center gap-2`}
            >
              {isEquipping ? '...' : justEquipped ? <><CheckCircle className="w-4 h-4" /> Equipada com sucesso!</> : 'Equipar Agora'}
            </button>

            <button 
              onClick={() => { onClose(); onViewProfile(); }}
              className="w-full py-3 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/50 rounded-2xl font-black uppercase text-[10px] tracking-widest text-white transition-all active:scale-95"
            >
              Ver no Perfil
            </button>
            
            <button 
              onClick={handleNext}
              className="w-full py-2 font-bold uppercase text-[9px] tracking-widest text-slate-400 hover:text-white transition-colors"
            >
              Continuar
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
