/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Apple, Play, Trophy, Settings as SettingsIcon, Info, User } from 'lucide-react';

interface HomeProps {
  onNavigate: (screen: string) => void;
  onLogout?: () => void;
  username?: string;
  avatarUrl?: string;
  level?: number;
}

const FloatingFruit = ({ emoji, className, delay = 0, size = 40, opacity = 0.5, blur = false }: { emoji: string, className: string, delay?: number, size?: number, opacity?: number, blur?: boolean }) => (
  <motion.div
    initial={{ y: 0, x: 0 }}
    animate={{ 
      y: [0, -20, 0], 
      x: [0, 10, -10, 0],
      rotate: [0, 10, -10, 0] 
    }}
    transition={{ duration: 6 + Math.random() * 4, repeat: Infinity, delay, ease: "easeInOut" }}
    className={`absolute pointer-events-none select-none z-10 ${className} ${blur ? 'blur-[1px]' : ''}`}
    style={{ fontSize: size, opacity, filter: `drop-shadow(0 10px 15px rgba(0,0,0,0.5))` }}
  >
    {emoji}
  </motion.div>
);

const TechButton = ({ label, icon, borderColor, glowColor, onClick, delay = 0, innerColor }: { label: string, icon: React.ReactNode, borderColor: string, glowColor: string, onClick: () => void, delay?: number, innerColor: string }) => (
  <motion.button
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay, type: 'spring', stiffness: 100 }}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className="relative w-full aspect-[1.4/1] group cursor-pointer"
  >
    {/* Double Neon Border Frame */}
    <div className={`absolute inset-0 bg-[#001025]/60 backdrop-blur-sm rounded-[2rem] border-2 ${borderColor} shadow-[0_0_30px_rgba(0,0,0,1)] transition-all duration-300 group-hover:bg-white/5`}>
       {/* Inner Glow/Line */}
       <div className={`absolute inset-2 border border-${innerColor}-500/30 rounded-[1.5rem] pointer-events-none`} />
       
       {/* Hex-style Corners */}
       <div className={`absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 ${glowColor} rounded-tl-[2rem] rounded-tr-none rounded-bl-none opacity-80 group-hover:scale-110 transition-transform`} />
       <div className={`absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 ${glowColor} rounded-br-[2rem] rounded-tl-none rounded-tr-none opacity-80 group-hover:scale-110 transition-transform`} />
       
       {/* High Frequency Lines Effect */}
       <div className="absolute inset-0 opacity-[0.05] pointer-events-none" 
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '100% 4px' }} />
    </div>

    {/* Content */}
    <div className="relative z-10 h-full flex flex-col items-center justify-center p-2">
      <div className={`mb-1 transition-transform group-hover:scale-110 duration-300`}>
        {React.cloneElement(icon as React.ReactElement, { className: `w-10 h-10 sm:w-14 sm:h-14 ${glowColor} drop-shadow-[0_0_15px_#fff]` })}
      </div>
      <span className="text-white font-black text-lg sm:text-2xl uppercase tracking-tighter drop-shadow-xl text-center leading-tight">{label}</span>
    </div>
    
    {/* Outer Glow on Hover */}
    <div className={`absolute -inset-2 ${borderColor.replace('border-', 'bg-')} opacity-0 group-hover:opacity-10 transition-opacity blur-2xl rounded-full`} />
  </motion.button>
);

export function Home({ onNavigate, username, avatarUrl }: HomeProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-white bg-[#000814] relative overflow-hidden">
      {/* Background Deep Glows & Tech Grid */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[10%] left-[50%] -translate-x-1/2 w-full max-w-4xl aspect-square bg-[radial-gradient(circle,rgba(30,144,255,0.15)_0%,transparent_70%)] blur-[100px]" />
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
        {/* Subtle Tech Grid */}
        <div className="absolute inset-0 opacity-[0.03]" 
             style={{ backgroundImage: 'radial-gradient(circle, #3b82f6 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
      </div>

      {/* Foreground Realistic Fruits - Optimized for Mobile */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
        {/* Top */}
        <FloatingFruit emoji="🍇" className="top-[-2%] left-[4%]" delay={0} size={100} opacity={0.6} blur />
        <FloatingFruit emoji="🍋" className="top-[5%] left-[35%] max-sm:hidden" delay={1} size={70} opacity={0.7} />
        <FloatingFruit emoji="🍒" className="top-[8%] right-[5%]" delay={0.5} size={90} opacity={0.7} />
        
        {/* Middle */}
        <FloatingFruit emoji="🫐" className="top-[25%] left-[-2%] max-sm:hidden" delay={1.5} size={50} opacity={0.4} blur />
        <FloatingFruit emoji="🍓" className="top-[30%] right-[1%]" delay={2} size={85} opacity={0.7} />
        
        {/* Bottom */}
        <FloatingFruit emoji="🍌" className="bottom-[-3%] left-[2%] max-sm:scale-75" delay={0.2} size={130} opacity={0.8} />
        <FloatingFruit emoji="🥥" className="bottom-[5%] left-[58%] max-sm:hidden" delay={1.2} size={80} opacity={0.7} />
        <FloatingFruit emoji="🍏" className="bottom-[2%] right-[5%] max-sm:scale-75" delay={0.7} size={110} opacity={0.8} />
        <FloatingFruit emoji="🍇" className="bottom-[10%] left-[35%] max-sm:hidden" delay={2.5} size={60} opacity={0.5} blur />
      </div>

      {/* Header Profile - Premium Pill */}
      <div className="absolute top-4 right-4 sm:top-8 sm:right-8 z-50">
        <button 
          onClick={() => onNavigate('settings')}
          className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-2 sm:py-2.5 bg-[#001025]/90 border-[1.5px] border-blue-500 rounded-2xl hover:bg-blue-600/20 transition-all shadow-[0_0_30px_rgba(59,130,246,0.4)] group"
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-600 flex items-center justify-center font-black text-sm sm:text-lg overflow-hidden border-2 border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.3)]">
            {avatarUrl ? (
              <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white italic">
                {username ? username[0].toUpperCase() : 'J'}
              </div>
            )}
          </div>
          <span className="font-black text-lg text-white uppercase tracking-tight transition-colors">
            {username || 'Jogador'}
          </span>
        </button>
      </div>

      {/* Hero Section - Scaled for Mobile */}
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-6 sm:mb-12 relative z-30 flex flex-col items-center max-sm:scale-[0.85] max-sm:mt-8"
      >
        {/* Green Neon Apple Logo */}
        <div className="relative mb-6 sm:mb-8 group cursor-default">
          {/* Tech Circles */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 sm:w-64 sm:h-64 border border-blue-500/10 rounded-full pointer-events-none" 
          />
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 sm:w-72 sm:h-72 border-2 border-t-green-500/20 border-l-green-500/20 border-transparent rounded-full pointer-events-none" 
          />
          
          <div className="absolute inset-0 bg-green-500/20 blur-[60px] sm:blur-[80px] rounded-full animate-pulse transition-all group-hover:bg-green-500/40" />
          <Apple 
            className="w-32 h-32 sm:w-48 h-48 text-[#39ff14] drop-shadow-[0_0_40px_#39ff14] relative z-10" 
            strokeWidth={0.8} 
          />
        </div>

        {/* 3D Title */}
        <div className="flex flex-col items-center gap-1">
            <motion.h2 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-3xl sm:text-5xl font-black text-blue-100 uppercase tracking-tighter leading-none italic drop-shadow-[0_5px_10px_rgba(0,0,0,0.8)]"
            >
                Jogo da
            </motion.h2>
            <motion.h1 
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-6xl sm:text-8xl md:text-9xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-blue-200 to-blue-600 drop-shadow-[0_2px_0_rgba(0,0,0,1)] [text-shadow:0_3px_0_#000,0_6px_0_#1e3a8a,0_9px_0_#1e3a8a,0_15px_30px_rgba(0,0,0,0.8)] leading-[0.8] select-none text-wrap max-w-lg px-4"
            >
              Memória Frutas
            </motion.h1>
        </div>

        {/* Subtitle */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex items-center gap-4 sm:gap-6 mt-6 sm:mt-10"
        >
          <div className="h-[2px] w-12 sm:w-16 bg-gradient-to-r from-transparent to-green-400" />
          <p className="text-blue-200 font-bold text-sm sm:text-lg uppercase tracking-widest px-2 sm:px-4 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">
            Teste sua memória com as frutas mais deliciosas!
          </p>
          <div className="h-[2px] w-12 sm:w-16 bg-gradient-to-l from-transparent to-green-400" />
        </motion.div>
      </motion.div>

      {/* Menu Grid - High End Responsive Grid */}
      <div className="grid grid-cols-2 gap-4 sm:gap-6 w-full max-w-xl relative z-30 mt-0 sm:mt-4 max-sm:scale-[0.9]">
        <TechButton 
          label="Jogar" 
          icon={<Play fill="currentColor" strokeWidth={0} />} 
          borderColor="border-green-500" 
          glowColor="text-green-500"
          innerColor="green"
          onClick={() => onNavigate('mode-selection')}
          delay={0.7}
        />
        <TechButton 
          label="Classificação" 
          icon={<Trophy strokeWidth={1.5} />} 
          borderColor="border-blue-500" 
          glowColor="text-blue-500"
          innerColor="blue"
          onClick={() => onNavigate('ranking')}
          delay={0.8}
        />
        <TechButton 
          label="Configurações" 
          icon={<SettingsIcon strokeWidth={1.5} />} 
          borderColor="border-slate-300" 
          glowColor="text-blue-200"
          innerColor="blue"
          onClick={() => onNavigate('settings')}
          delay={0.9}
        />
        <TechButton 
          label="Como Jogar" 
          icon={<Info strokeWidth={1.5} />} 
          borderColor="border-orange-500" 
          glowColor="text-orange-500"
          innerColor="orange"
          onClick={() => onNavigate('how-to-play')}
          delay={1.0}
        />
      </div>
    </div>
  );
}
