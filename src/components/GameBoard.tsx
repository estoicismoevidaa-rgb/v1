/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Card as CardType, Difficulty } from '../types.ts';
import { Card } from './Card.tsx';
import { DIFFICULTY_CONFIG } from '../lib/game-logic.ts';

interface GameBoardProps {
  cards: CardType[];
  difficulty: Difficulty;
  onCardClick: (index: number) => void;
  disabled: boolean;
}

export function GameBoard({ cards, difficulty, onCardClick, disabled }: GameBoardProps) {
  const { rows, cols } = DIFFICULTY_CONFIG[difficulty];

  // Dynamically calculate grid columns based on difficulty
  const gridColsClass = {
    4: 'grid-cols-4',
    6: 'grid-cols-4 sm:grid-cols-6', // Responsive adjustment
    8: 'grid-cols-6 sm:grid-cols-8'
  }[cols] || 'grid-cols-4';

  // Overriding cols class specifically for mobile if it's too wide
  // Extremo 8x6 -> 6 cols mobile is a lot. Maybe 4 cols and scroll? 
  // User says "extremo deve continuar jogável em celular".
  
  return (
    <div className={`grid ${gridColsClass} gap-2 sm:gap-4 w-full max-w-4xl mx-auto p-2`}>
      {cards.map((card, index) => (
        <Card 
          key={card.id} 
          card={card} 
          onClick={() => onCardClick(index)} 
          disabled={disabled || card.isFlipped || card.isMatched}
        />
      ))}
    </div>
  );
}
