/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Difficulty = 'Fácil' | 'Médio' | 'Difícil' | 'Extremo';

export interface Card {
  id: string;
  fruit: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export interface Player {
  uid: string;
  name: string;
  score: number;
  isHost?: boolean;
}

export interface UserProfile {
  uid: string;
  username: string;
  email: string;
  createdAt: string;
  avatarUrl?: string;
}

export interface UserStats {
  uid: string;
  gamesPlayed: number;
  bestTimeEasy?: number;
  bestTimeMedium?: number;
  bestTimeHard?: number;
  bestTimeExtreme?: number;
  totalPoints: number;
  achievements: string[]; // IDs of unlocked achievements
  lastPlayedAt: string;
}

export interface RankingEntry {
  username: string;
  avatarUrl?: string;
  totalPoints: number;
  bestTimeEasy?: number;
  gamesPlayed: number;
}

export type GameStatus = 'waiting' | 'playing' | 'finished';

export interface GameRoom {
  id?: string;
  ownerId: string;
  status: GameStatus;
  difficulty: Difficulty;
  players: Player[];
  cards: Card[];
  currentPlayerIndex: number;
  password?: string;
  createdAt: any;
  updatedAt: any;
  gameStartedAt?: any;
}

export interface LocalRanking {
  solo: {
    difficulty: Difficulty;
    bestTime: number; // in seconds
    attempts: number;
    nickname: string;
  }[];
  multiplayer: {
    nickname: string;
    wins: number;
  }[];
}

export interface GameSettings {
  music: boolean;
  sfx: boolean;
  vibration: boolean;
  animations: boolean;
  theme: 'dark' | 'light';
}
