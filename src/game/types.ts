export type InsectType = 'Beetle' | 'Ant' | 'Wasp';

export type GameStatus = 'idle' | 'playing' | 'over';

/** An insect the player can see and feed to the owl. */
export interface Insect {
  id: number;
  type: InsectType;
  imgSrc: string;
  points: number;
}

export interface GameState {
  status: GameStatus;
  insects: Insect[];
  score: number;
  lives: number;
  /** Consecutive catches without an escape. Drives the score multiplier. */
  combo: number;
  bestCombo: number;
  caught: number;
  highScore: number;
}

export type Action =
  | { type: 'START' }
  | { type: 'SPAWN'; insect: Insect }
  | { type: 'EAT'; id: number }
  | { type: 'ESCAPE'; id: number }
  | { type: 'RESET' };
