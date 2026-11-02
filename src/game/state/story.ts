import type { Progress } from './progress';

/**
 * The short trail through the dark that unlocks the ending. Order matters:
 * each clue points at the next place to look, and the ending never needs a
 * single star.
 */
export const TRAIL = [
  'clue:note',
  'clue:hall',
  'clue:workshop',
  'clue:archive',
  'clue:observatory',
] as const;

export type ClueId = (typeof TRAIL)[number];
export type EndingLine = 'full' | 'most' | 'few';

const ENDING_SEEN = 'ending-seen';
const ENDING_RANK: Record<EndingLine, number> = { few: 1, most: 2, full: 3 };
const ENDING_BY_RANK: Record<number, EndingLine> = { 1: 'few', 2: 'most', 3: 'full' };

/** Clues live in `counters`, so they survive reloads with the rest of progress. */
export function hasClue(progress: Progress, id: string): boolean {
  return (progress.counters[id] ?? 0) > 0;
}

/** Marks a clue found. Already marked returns the same progress unchanged. */
export function markClue(progress: Progress, id: string): Progress {
  if (hasClue(progress, id)) return progress;

  return { ...progress, counters: { ...progress.counters, [id]: 1 } };
}

/** The next clue the visitor has still to find, in trail order. */
export function nextClue(progress: Progress): string | null {
  return TRAIL.find((id) => !hasClue(progress, id)) ?? null;
}

/** The ending opens once the whole trail is followed, however few stars that took. */
export function endingUnlocked(progress: Progress): boolean {
  return TRAIL.every((id) => hasClue(progress, id));
}

/**
 * Which of Huzbi's three lines the star count earns. The full line is only
 * for a complete collection; a half collection earns the middle line.
 */
export function endingLine(found: number, total: number): EndingLine {
  if (found === total) return 'full';
  if (found * 2 >= total) return 'most';
  return 'few';
}

/**
 * Record the best ending line the visitor has earned. Seeing the ending again
 * with more stars upgrades it, and it never downgrades or counts twice.
 */
export function onEndingSeen(progress: Progress, line: EndingLine): Progress {
  const rank = ENDING_RANK[line];
  if ((progress.counters[ENDING_SEEN] ?? 0) >= rank) return progress;

  return { ...progress, counters: { ...progress.counters, [ENDING_SEEN]: rank } };
}

/** The best ending line the visitor has already seen, or null before the first. */
export function seenEndingLine(progress: Progress): EndingLine | null {
  return ENDING_BY_RANK[progress.counters[ENDING_SEEN] ?? 0] ?? null;
}
