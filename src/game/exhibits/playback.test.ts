import { describe, expect, it } from 'vitest';
import { createPlayback } from './playback';

describe('exhibit playback', () => {
  it('finishes_after_its_duration', async () => {
    const play = createPlayback();
    const done = play.start(1000, false);
    expect(play.active).toBe(true);
    play.update(400);
    expect(play.progress).toBeCloseTo(0.4);
    play.update(700);
    expect(play.active).toBe(false);
    expect(play.progress).toBe(1);
    await expect(done).resolves.toBe(true);
  });

  it('reduced_motion_finishes_at_once_without_any_update', async () => {
    const play = createPlayback();
    await expect(play.start(5000, true)).resolves.toBe(true);
    expect(play.active).toBe(false);
    expect(play.progress).toBe(1);
  });

  it('a_second_start_supersedes_the_first_so_nothing_is_left_hanging', async () => {
    const play = createPlayback();
    const first = play.start(1000, false);
    const second = play.start(1000, false);
    await expect(first).resolves.toBe(false);
    play.update(2000);
    await expect(second).resolves.toBe(true);
  });

  it('cancelling_settles_false_and_stops_the_beat', async () => {
    const play = createPlayback();
    const done = play.start(1000, false);
    play.cancel();
    await expect(done).resolves.toBe(false);
    expect(play.active).toBe(false);
    play.update(2000);
    expect(play.progress).toBe(0);
  });

  it('bad_or_huge_ms_never_breaks_progress', () => {
    const play = createPlayback();
    void play.start(1000, false);
    play.update(Number.NaN);
    expect(play.progress).toBe(0);
    play.update(-50);
    expect(play.progress).toBe(0);
    play.update(Number.POSITIVE_INFINITY);
    expect(Number.isFinite(play.progress)).toBe(true);
    expect(play.progress).toBeLessThanOrEqual(1);
  });

  it('idle_progress_is_zero_before_any_start', () => {
    const play = createPlayback();
    expect(play.active).toBe(false);
    expect(play.progress).toBe(0);
    play.update(100);
    expect(play.progress).toBe(0);
  });
});
