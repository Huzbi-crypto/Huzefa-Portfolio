import { describe, expect, it } from 'vitest';
import { NUDGE_AFTER_MS, pickNudge } from './nudge';
import { freshProgress } from './progress';
import { markClue } from './story';

type Target = { id: string; found: boolean };

const SOMETHING_TO_DO: Target[] = [
  { id: 'shelf', found: false },
  { id: 'note', found: false },
];

describe('idle nudges', () => {
  it('no_nudge_under_30s', () => {
    expect(pickNudge(freshProgress(), 0, SOMETHING_TO_DO)).toBeNull();
    expect(pickNudge(freshProgress(), 29_999, SOMETHING_TO_DO)).toBeNull();
    expect(pickNudge(freshProgress(), NUDGE_AFTER_MS - 1, SOMETHING_TO_DO)).toBeNull();
  });

  it('no_nudge_when_everything_found', () => {
    expect(pickNudge(freshProgress(), 60_000, [])).toBeNull();
    expect(
      pickNudge(
        freshProgress(),
        60_000,
        SOMETHING_TO_DO.map((target) => ({ ...target, found: true })),
      ),
    ).toBeNull();
  });

  it('nudge_prefers_next_clue', () => {
    const targets: Target[] = [
      { id: 'shelf', found: false },
      { id: 'clue:note', found: false },
      { id: 'cat', found: false },
    ];

    expect(pickNudge(freshProgress(), 30_000, targets)).toBe('clue:note');

    const afterFirst = markClue(freshProgress(), 'clue:note');
    expect(pickNudge(afterFirst, 30_000, targets)).toBe('shelf');
  });

  it('nudge_falls_back_to_anything_unfound', () => {
    const targets: Target[] = [
      { id: 'tea', found: true },
      { id: 'cat', found: false },
      { id: 'door', found: false },
    ];

    expect(pickNudge(freshProgress(), 45_000, targets)).toBe('cat');
  });
});
