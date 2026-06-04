/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import React from 'react';

const FRUIT_EMOJIS = ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍒', '🍑', '🥭', '🍍', '🥝', '🥥'];

interface FallingFruitProps {
  emoji: string;
  delay: number;
  duration: number;
  xStart: number;
  swayRange: number;
  size: number;
  opacity: number;
}

const FallingFruit = ({ emoji, delay, duration, xStart, swayRange, size, opacity }: FallingFruitProps) => {
  return (
    <motion.div
      initial={{ 
        y: '-15vh', 
        x: 0, 
        rotate: 0,
        opacity: 0 
      }}
      animate={{ 
        y: '115vh',
        x: [0, swayRange * 4, 0],
        rotate: [0, 180, 360],
        opacity: [0, opacity, opacity, 0]
      }}
      transition={{ 
        duration, 
        repeat: Infinity, 
        delay,
        ease: "linear",
        times: [0, 0.1, 0.9, 1] // balanced for smooth fade in/out
      }}
      className="absolute pointer-events-none select-none filter blur-[0.2px]"
      style={{ 
        left: `${xStart}%`,
        fontSize: size,
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {emoji}
    </motion.div>
  );
};

export function BackgroundAnimation() {
  const [elements, setElements] = React.useState<any[]>([]);

  React.useEffect(() => {
    // Generate fewer fruits on mobile for performance
    const isMobile = window.innerWidth < 640;
    const count = isMobile ? 8 : 25;

    const newElements = Array.from({ length: count }).map((_, i) => {
      const emoji = FRUIT_EMOJIS[Math.floor(Math.random() * FRUIT_EMOJIS.length)];
      const delay = Math.random() * -20; // negative delay to spawn immediately in mid-fall
      const duration = 12 + Math.random() * 15; // slow, gentle fall duration (12s to 27s)
      const xStart = Math.random() * 100;
      const swayRange = -10 + Math.random() * 20; // horizontal wave-like sway
      const size = 18 + Math.random() * 24; // smaller size to keep it clean and subtle
      const opacity = 0.08 + Math.random() * 0.12; // faint opacity to keep background non-distracting
      
      return {
        id: i,
        emoji,
        delay,
        duration,
        xStart,
        swayRange,
        size,
        opacity
      };
    });
    setElements(newElements);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 select-none">
      {elements.map((el) => (
        <FallingFruit key={el.id} {...el} />
      ))}
      <div className="absolute inset-0 bg-radial-gradient from-blue-950/10 via-transparent to-transparent opacity-60" />
    </div>
  );
}
