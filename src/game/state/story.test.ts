import { describe, expect, it } from 'vitest';
import { freshProgress, type Progress } from './progress';
import {
  TRAIL,
  endingLine,
  endingUnlocked,
  markClue,
  nextClue,
  onEndingSeen,
  seenEndingLine,
} from './story';

function withClues(ids: readonly string[]): Progress {
  let progress = freshProgress();
  for (const id of ids) progress = markClue(progress, id);
  return progress;
}

describe('the clue trail', () => {
  it('ending_locked_until_trail_done', () => {
    expect(endingUnlocked(freshProgress())).toBe(false);
    expect(endingUnlocked(withClues(TRAIL.slice(0, -1)))).toBe(false);
  });

  it('ending_unlocks_without_all_stars', () => {
    const progress = withClues(TRAIL);

    expect(progress.found).toEqual([]);
    expect(endingUnlocked(progress)).toBe(true);
  });

  it('the_next_clue_follows_the_trail_in_order', () => {
    let progress = freshProgress();
    expect(nextClue(progress)).toBe('clue:note');

    for (const clue of TRAIL) {
      progress = markClue(progress, clue);
      const index = TRAIL.indexOf(clue);
      expect(nextClue(progress)).toBe(TRAIL[index + 1] ?? null);
    }
  });

  it('marking_the_same_clue_twice_changes_nothing', () => {
    const once = markClue(freshProgress(), 'clue:note');

    expect(markClue(once, 'clue:note')).toBe(once);
  });
});

describe('the ending rules', () => {
  it('full_line_only_at_total', () => {
    expect(endingLine(10, 10)).toBe('full');
    expect(endingLine(9, 10)).toBe('most');
    expect(endingLine(9, 10)).not.toBe('full');
    expect(endingLine(5, 10)).toBe('most');
    expect(endingLine(4, 10)).toBe('few');
    expect(endingLine(0, 10)).toBe('few');
  });

  it('few_stars_then_all_stars_upgrades_the_line', () => {
    let progress = endingSeen(freshProgress(), 'few');
    expect(seenEndingLine(progress)).toBe('few');

    progress = endingSeen(progress, endingLine(10, 10));
    expect(seenEndingLine(progress)).toBe('full');

    // Coming back with a lazy save must not replay the teasing line.
    progress = endingSeen(progress, endingLine(1, 10));
    expect(seenEndingLine(progress)).toBe('full');
  });

  it('ending_seen_is_idempotent', () => {
    expect(seenEndingLine(freshProgress())).toBeNull();

    const once = endingSeen(freshProgress(), 'most');
    const twice = endingSeen(once, 'most');

    expect(seenEndingLine(once)).toBe('most');
    expect(twice).toEqual(once);
    expect(twice.counters).toEqual(once.counters);
  });
});

function endingSeen(progress: Progress, line: 'full' | 'most' | 'few'): Progress {
  return onEndingSeen(progress, line);
}
