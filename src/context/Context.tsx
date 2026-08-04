import type { ReactNode } from 'react';
import { useGameEngine } from '../game/useGameEngine';
import { ActionsContext, ViewContext } from './gameContext';

export default function Context({ children }: { children: ReactNode }) {
  const { view, actions } = useGameEngine();

  return (
    <ActionsContext.Provider value={actions}>
      <ViewContext.Provider value={view}>{children}</ViewContext.Provider>
    </ActionsContext.Provider>
  );
}
