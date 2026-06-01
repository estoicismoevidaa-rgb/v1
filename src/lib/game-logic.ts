/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Card, Difficulty } from '../types.ts';

export const FRUITS = [
  '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', 
  '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦',
  '🥬', '🥒', '🌽', '🥕', '🥔'
];

export const DIFFICULTY_CONFIG = {
  'Fácil': { rows: 4, cols: 4, pairs: 8 },
  'Médio': { rows: 6, cols: 4, pairs: 12 },
  'Difícil': { rows: 6, cols: 6, pairs: 18 },
  'Extremo': { rows: 8, cols: 6, pairs: 24 }
};

export function shuffle<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export function generateCards(difficulty: Difficulty): Card[] {
  const { pairs } = DIFFICULTY_CONFIG[difficulty];
  const selectedFruits = FRUITS.slice(0, pairs);
  const cardPairs = [...selectedFruits, ...selectedFruits];
  
  return shuffle(cardPairs).map((fruit, index) => ({
    id: `${index}-${fruit}`,
    fruit,
    isFlipped: false,
    isMatched: false
  }));
}
