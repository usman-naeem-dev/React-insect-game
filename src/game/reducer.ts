import { HIGH_SCORE_KEY, STARTING_LIVES, multiplierFor } from './constants';
import type { Action, GameState } from './types';

export const readHighScore = (): number => {
  try {
    const raw = localStorage.getItem(HIGH_SCORE_KEY);
    const parsed = raw === null ? 0 : Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0;
  } catch {
    // Private mode / blocked storage: play on without a saved score.
    return 0;
  }
};

export const writeHighScore = (score: number): void => {
  try {
    localStorage.setItem(HIGH_SCORE_KEY, String(score));
  } catch {
    // Ignore — the run is still playable without persistence.
  }
};

export const initialState = (highScore = 0): GameState => ({
  status: 'idle',
  insects: [],
  score: 0,
  lives: STARTING_LIVES,
  combo: 0,
  bestCombo: 0,
  caught: 0,
  highScore,
});

export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'START':
      return { ...initialState(state.highScore), status: 'playing' };

    case 'SPAWN':
      if (state.status !== 'playing') return state;
      return { ...state, insects: [...state.insects, action.insect] };

    case 'EAT': {
      const eaten = state.insects.find((insect) => insect.id === action.id);
      if (!eaten) return state;

      const combo = state.combo + 1;
      const score = state.score + eaten.points * multiplierFor(state.combo);
      return {
        ...state,
        insects: state.insects.filter((insect) => insect.id !== action.id),
        score,
        combo,
        bestCombo: Math.max(state.bestCombo, combo),
        caught: state.caught + 1,
        highScore: Math.max(state.highScore, score),
      };
    }

    case 'ESCAPE': {
      const escaped = state.insects.find((insect) => insect.id === action.id);
      if (!escaped) return state;

      const lives = state.lives - 1;
      return {
        ...state,
        insects: lives > 0 ? state.insects.filter((i) => i.id !== action.id) : [],
        lives: Math.max(0, lives),
        combo: 0,
        status: lives > 0 ? state.status : 'over',
      };
    }

    case 'RESET':
      return initialState(state.highScore);

    default:
      return state;
  }
}
