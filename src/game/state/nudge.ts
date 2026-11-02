import type { Progress } from './progress';
import { nextClue } from './story';

/** Thirty seconds of nothing is a visitor who could use a friendly pointer. */
export const NUDGE_AFTER_MS = 30_000;

export type NudgeHotspot = { id: string; found: boolean };

/**
 * Pick something gentle to point at after the visitor has gone quiet. The
 * next clue wins whenever it is in reach; otherwise any unfound thing will do.
 * Returns null before the nudge is due, or once there is nothing left to find.
 */
export function pickNudge(
  progress: Progress,
  idleMs: number,
  hotspots: readonly NudgeHotspot[],
): string | null {
  if (idleMs < NUDGE_AFTER_MS) return null;

  const clue = nextClue(progress);
  if (clue) {
    const next = hotspots.find((hotspot) => hotspot.id === clue && !hotspot.found);
    if (next) return next.id;
  }

  return hotspots.find((hotspot) => !hotspot.found)?.id ?? null;
}
