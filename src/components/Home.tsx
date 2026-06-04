/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Apple, Play, Trophy, Settings as SettingsIcon, Info, User, Grape, Cherry, Citrus } from 'lucide-react';

interface HomeProps {
  onNavigate: (screen: string) => void;
  onLogout?: () => void;
  username?: string;
  avatarUrl?: string;
  level?: number;
}

const FloatingFruit = ({ emoji, className, delay = 0, size = 40, opacity = 0.3 }: { emoji: string, className: string, delay?: number, size?: number, opacity?: number }) => (
  <motion.div
    initial={{ y: 0 }}
    animate={{ y: [0, -15, 0], rotate: [0, 5, -5, 0] }}
    transition={{ duration: 4 + Math.random() * 2, repeat: Infinity, delay, ease: "easeInOut" }}
    className={`absolute pointer-events-none select-none ${className}`}
    style={{ fontSize: size, opacity }}
  >
    {emoji}
  </motion.div>
);

const TechButton = ({ label, icon, color, glowColor, onClick, delay = 0 }: { label: string, icon: React.ReactNode, color: string, glowColor: string, onClick: () => void, delay?: number }) => (
  <motion.button
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay }}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className="relative w-full aspect-[1.3/1] group"
  >
    {/* Tech Frame */}
    <div className={`absolute inset-0 bg-[#001025]/90 rounded-3xl border-2 ${color} shadow-[0_0_15px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-300 group-hover:bg-[#001530]`}>
      {/* Corner Accents */}
      <div className={`absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 ${glowColor} rounded-tl-2xl opacity-60`} />
      <div className={`absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 ${glowColor} opacity-40`} />
      <div className={`absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 ${glowColor} opacity-40`} />
      <div className={`absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 ${glowColor} rounded-br-2xl opacity-60`} />
      
      {/* Scanline/Grid Effect */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
      
      {/* Glow */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300 bg-gradient-to-br from-transparent via-${color.replace('border-', '')}/20 to-transparent`} />
    </div>

    {/* Content */}
    <div className="relative z-10 flex flex-col items-center justify-center p-4">
      <div className={`p-4 rounded-2xl bg-[#000814]/60 border border-white/5 mb-2 shadow-inner group-hover:border-${glowColor.replace('text-', '')}/30 transition-colors`}>
        {React.cloneElement(icon as React.ReactElement, { className: `w-10 h-10 ${glowColor} drop-shadow-[0_0_8px_currentColor]` })}
      </div>
      <span className="text-white font-black text-lg uppercase tracking-tight italic drop-shadow-md">{label}</span>
    </div>
  </motion.button>
);

export function Home({ onNavigate, username, avatarUrl }: HomeProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-white bg-[#000814] relative overflow-hidden">
      {/* Background Decor Fruits */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <FloatingFruit emoji="🍇" className="top-[10%] left-[5%]" delay={0} size={60} opacity={0.4} />
        <FloatingFruit emoji="🍋" className="top-[5%] left-[30%]" delay={1} size={50} opacity={0.3} />
        <FloatingFruit emoji="🍒" className="top-[15%] right-[10%]" delay={0.5} size={70} opacity={0.4} />
        <FloatingFruit emoji="🍓" className="top-[40%] right-[2%]" delay={2} size={45} opacity={0.3} />
        <FloatingFruit emoji="🫐" className="top-[25%] left-[8%]" delay={1.5} size={30} opacity={0.2} />
        <FloatingFruit emoji="🍌" className="bottom-[5%] left-[2%]" delay={0.2} size={90} opacity={0.5} />
        <FloatingFruit emoji="🥥" className="bottom-[8%] left-[55%]" delay={1.2} size={55} opacity={0.4} />
        <FloatingFruit emoji="🍏" className="bottom-[3%] right-[5%]" delay={0.7} size={80} opacity={0.5} />
        <FloatingFruit emoji="🫐" className="bottom-[20%] left-[30%]" delay={2.5} size={40} opacity={0.3} />
      </div>

      {/* Header Profile - Blue Pill */}
      <div className="absolute top-8 right-8 z-50">
        <button 
          onClick={() => onNavigate('settings')}
          className="flex items-center gap-3 px-5 py-2.5 bg-[#001025]/80 border border-blue-500/50 rounded-full hover:bg-blue-900/50 transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] group"
        >
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-black text-sm overflow-hidden border border-blue-400/50 shadow-[0_0_10px_rgba(59,130,246,0.5)]">
            {avatarUrl ? (
              <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white drop-shadow-sm">{username ? username[0].toUpperCase() : 'J'}</span>
            )}
          </div>
          <span className="font-black text-sm text-white uppercase tracking-tight group-hover:text-blue-200 transition-colors">
            {username || 'Jogador'}
          </span>
        </button>
      </div>

      {/* Hero Section */}
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-10 relative z-20 flex flex-col items-center"
      >
        {/* Neon Apple Logo */}
        <div className="relative mb-6 group cursor-default">
          {/* Tech Rings */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-blue-500/10 rounded-full animate-[spin_20s_linear_infinite] pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 border border-t-blue-400/20 border-l-blue-400/20 border-r-transparent border-b-transparent rounded-full animate-[spin_15s_linear_infinite_reverse] pointer-events-none" />
          
          <div className="absolute inset-0 bg-green-500/20 blur-3xl rounded-full transition-all group-hover:bg-green-500/40" />
          <Apple className="w-36 h-36 text-[#39ff14] drop-shadow-[0_0_30px_#39ff14] relative z-10 animate-pulse duration-[3000ms]" strokeWidth={1} />
        </div>

        {/* Title with 3D Effect */}
        <div className="flex flex-col items-center">
            <h2 className="text-4xl font-black text-blue-100 uppercase tracking-tighter leading-none mb-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] italic">
                Jogo da
            </h2>
            <h1 className="text-7xl md:text-8xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-red-400 to-red-600 drop-shadow-[0_1px_0_rgba(0,0,0,0.8)] [text-shadow:0_2px_0_rgb(0,0,0,0.8),0_4px_0_rgb(0,0,0,0.8),0_6px_0_rgb(0,0,0,0.8),0_8px_10px_rgba(0,0,0,0.6)] leading-[0.85] select-none text-wrap max-w-sm px-4">
              Memória Frutas
            </h1>
        </div>

        {/* Subtitle with Tech Lines */}
        <div className="flex items-center gap-4 mt-8">
          <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-green-500/50" />
          <div className="w-1.5 h-1.5 border border-green-500/50 rotate-45" />
          <p className="text-blue-100 font-bold text-[13px] uppercase tracking-[0.1em] px-2 drop-shadow-md">
            Teste sua memória com as frutas mais deliciosas!
          </p>
          <div className="w-1.5 h-1.5 border border-green-500/50 rotate-45" />
          <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-green-500/50" />
        </div>
      </motion.div>

      {/* Menu Grid */}
      <div className="grid grid-cols-2 gap-5 w-full max-w-lg relative z-20">
        <TechButton 
          label="Jogar" 
          icon={<Play fill="currentColor" />} 
          color="border-green-500/40" 
          glowColor="text-green-400"
          onClick={() => onNavigate('mode-selection')}
          delay={0.1}
        />
        <TechButton 
          label="Ranking" 
          icon={<Trophy />} 
          color="border-blue-500/40" 
          glowColor="text-blue-400"
          onClick={() => onNavigate('ranking')}
          delay={0.2}
        />
        <TechButton 
          label="Configurações" 
          icon={<SettingsIcon />} 
          color="border-slate-500/40" 
          glowColor="text-slate-200"
          onClick={() => onNavigate('settings')}
          delay={0.3}
        />
        <TechButton 
          label="Como Jogar" 
          icon={<Info />} 
          color="border-orange-500/40" 
          glowColor="text-orange-400"
          onClick={() => onNavigate('how-to-play')}
          delay={0.4}
        />
      </div>
    </div>
  );
}
