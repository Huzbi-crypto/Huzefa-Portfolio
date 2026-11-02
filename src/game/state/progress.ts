import { allStarIds } from '@/game/content/stars';

export const PROGRESS_KEY = 'huzbi-game-v1';

export type Progress = {
  version: 1;
  found: string[];
  doorOpened: boolean;
  sound: boolean;
  counters: Record<string, number>;
};

export function freshProgress(): Progress {
  return {
    version: 1,
    found: [],
    doorOpened: false,
    sound: false,
    counters: {},
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Load saved progress, always returning a usable state. Missing, corrupt,
 * stale or unreadable storage starts the visitor fresh instead of failing.
 */
export function loadProgress(storage: Storage | null): Progress {
  if (!storage) return freshProgress();

  let raw: string | null;
  try {
    raw = storage.getItem(PROGRESS_KEY);
  } catch {
    return freshProgress();
  }
  if (!raw) return freshProgress();

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return freshProgress();
  }

  if (!isRecord(parsed) || parsed.version !== 1) return freshProgress();

  const knownIds = new Set(allStarIds());
  const found: string[] = [];
  if (Array.isArray(parsed.found)) {
    for (const id of parsed.found) {
      if (
        typeof id === 'string' &&
        knownIds.has(id) &&
        !found.includes(id)
      ) {
        found.push(id);
      }
    }
  }

  const counters: Record<string, number> = {};
  if (isRecord(parsed.counters)) {
    for (const [id, value] of Object.entries(parsed.counters)) {
      if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
        counters[id] = Math.floor(value);
      }
    }
  }

  return {
    version: 1,
    found,
    doorOpened: parsed.doorOpened === true,
    sound: parsed.sound === true,
    counters,
  };
}

export function saveProgress(storage: Storage | null, progress: Progress): void {
  if (!storage) return;

  try {
    storage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // Private browsing or a full quota: the visit keeps working unsaved.
  }
}

/** Returns true only the first time a star is awarded. */
export function award(progress: Progress, id: string): boolean {
  if (progress.found.includes(id)) return false;

  progress.found.push(id);
  return true;
}
