import { createContext, useContext } from 'react';
import type { GameActions, GameView } from '../game/useGameEngine';

/**
 * Two contexts on purpose:
 *  - `ActionsContext` never changes identity, so components that only *do*
 *    things (insects, buttons) never re-render when the score ticks.
 *  - `ViewContext` changes with game state and is read only by the HUD/overlays.
 */
export const ActionsContext = createContext<GameActions | undefined>(undefined);
export const ViewContext = createContext<GameView | undefined>(undefined);

export function useGameActions(): GameActions {
  const context = useContext(ActionsContext);
  if (!context) throw new Error('useGameActions must be used within <Context>');
  return context;
}

export function useGameView(): GameView {
  const context = useContext(ViewContext);
  if (!context) throw new Error('useGameView must be used within <Context>');
  return context;
}
