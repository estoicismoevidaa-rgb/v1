/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Card as CardType } from '../types.ts';

interface CardProps {
  card: CardType;
  onClick: () => void;
  disabled: boolean;
}

export const Card: React.FC<CardProps> = ({ card, onClick, disabled }) => {
  return (
    <div 
      className={`relative aspect-square cursor-pointer perspective-1000 ${disabled ? 'cursor-default' : ''}`}
      onClick={!disabled && !card.isMatched && !card.isFlipped ? onClick : undefined}
    >
      <motion.div
        className="w-full h-full relative preserve-3d"
        initial={false}
        animate={{ rotateY: card.isFlipped || card.isMatched ? 180 : 0 }}
        transition={{ duration: 0.4, type: 'spring', stiffness: 260, damping: 20 }}
      >
        {/* Front (Hidden) */}
        <div className="absolute inset-0 w-full h-full backface-hidden rounded-xl bg-green-600 border-4 border-green-400 flex items-center justify-center shadow-lg">
          <span className="text-4xl filter grayscale opacity-20">?</span>
        </div>

        {/* Back (Visible) */}
        <div className="absolute inset-0 w-full h-full backface-hidden rounded-xl bg-white border-4 border-green-500 flex items-center justify-center shadow-lg rotate-y-180">
          <span className="text-5xl select-none">{card.fruit}</span>
        </div>
        
        {card.isMatched && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 bg-green-500/20 rounded-xl pointer-events-none"
          />
        )}
      </motion.div>
    </div>
  );
}
