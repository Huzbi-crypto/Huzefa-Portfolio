import type { GameStore } from './store';

/**
 * The store the canvas game is currently running on, so UI that lives outside
 * the canvas (the CRT terminal) can award a star to the same progress the game
 * holds in memory. A missing store means no game is running: callers fall back
 * to the saved progress instead.
 */
let current: GameStore | null = null;

export function setLiveStore(store: GameStore | null): void {
  current = store;
}

export function getLiveStore(): GameStore | null {
  return current;
}

/** Clear the registration only if it still points at this store. */
export function clearLiveStore(store: GameStore): void {
  if (current === store) current = null;
}
