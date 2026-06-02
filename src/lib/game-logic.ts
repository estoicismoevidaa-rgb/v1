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

export interface OnlineScoreBreakdown {
  playerPairs: number;
  pairPoints: number;
  roomSizeBonus: number;
  comboBonus: number;
  penalty: number;
  totalPoints: number;
}

export interface SoloScoreBreakdown {
  basePoints: number;
  timeBonus: number;
  errorPenalty: number;
  difficultyMultiplier: number;
  totalPoints: number;
}

export function calculateSoloRankingPoints(
  difficulty: Difficulty,
  timeInSeconds: number,
  errors: number
): SoloScoreBreakdown {
  const configs: Record<Difficulty, { base: number, timeFactor: number, errorFactor: number, multiplier: number }> = {
    'Fácil': { base: 1000, timeFactor: 5, errorFactor: 10, multiplier: 1 },
    'Médio': { base: 2500, timeFactor: 5, errorFactor: 15, multiplier: 1.5 },
    'Difícil': { base: 5000, timeFactor: 5, errorFactor: 20, multiplier: 2 },
    'Extremo': { base: 10000, timeFactor: 5, errorFactor: 25, multiplier: 3 }
  };

  const config = configs[difficulty];
  
  // Scoring formula: Base - (time penalty) - (error penalty)
  // We multiply at the end to reward harder difficulties more
  const rawPoints = config.base - (timeInSeconds * config.timeFactor) - (errors * config.errorFactor);
  
  // Ensure we don't go below a minimum participation score
  const totalPoints = Math.max(50, Math.floor(rawPoints * config.multiplier));

  return {
    basePoints: config.base,
    timeBonus: -(timeInSeconds * config.timeFactor),
    errorPenalty: -(errors * config.errorFactor),
    difficultyMultiplier: config.multiplier,
    totalPoints
  };
}

export function calculateOnlineRankingPoints(
  rank: number, 
  roomSize: number, 
  pairsFound: number, 
  maxCombo: number = 0
): OnlineScoreBreakdown {
  const pairPoints = pairsFound * 10;
  
  // Room Size Bonus (Only for Winner)
  let roomSizeBonus = 0;
  if (rank === 1) {
    if (roomSize === 2) roomSizeBonus = 50;
    else if (roomSize === 3) roomSizeBonus = 60;
    else if (roomSize === 4) roomSizeBonus = 70;
    else if (roomSize === 5) roomSizeBonus = 80;
    else if (roomSize === 6) roomSizeBonus = 100;
  }
  
  // Combo Bonus (All players)
  let comboBonus = 0;
  if (maxCombo >= 5) comboBonus = 40;
  else if (maxCombo === 4) comboBonus = 25;
  else if (maxCombo === 3) comboBonus = 15;
  
  // Penalty (Losers)
  let penalty = 0;
  if (rank > 1) {
    const penalties: Record<string, number[]> = {
      '2': [0, 15],
      '3': [0, 8, 12],
      '4': [0, 5, 10, 15],
      '5': [0, 4, 8, 12, 16],
      '6': [0, 3, 6, 9, 12, 15]
    };
    const roomPenalties = penalties[roomSize.toString()] || [];
    penalty = roomPenalties[rank - 1] || 0;
  }
  
  const totalPoints = pairPoints + roomSizeBonus + comboBonus - penalty;
  
  return {
    playerPairs: pairsFound,
    pairPoints,
    roomSizeBonus,
    comboBonus,
    penalty,
    totalPoints
  };
}
