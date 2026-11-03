import type { GameStore } from '@/game/state/store';
import { loadProgress } from '@/game/state/progress';

/**
 * The first-visit controls hint used to live in React state alone, so every
 * reload showed it again. The walk is saved in the same progress counters as
 * everything else the visitor has done.
 */
export const WALKED_COUNTER = 'walked';

export function hasWalked(store: GameStore): boolean {
  return store.count(WALKED_COUNTER) > 0;
}

/** Record the visitor's first walk. Further walks keep the one saved mark. */
export function noteWalked(store: GameStore): void {
  if (hasWalked(store)) return;
  store.increment(WALKED_COUNTER);
}

/** Read the saved mark before the game store exists, so a reload paints no hint. */
export function hasSavedWalk(storage: Storage | null): boolean {
  return (loadProgress(storage).counters[WALKED_COUNTER] ?? 0) > 0;
}
