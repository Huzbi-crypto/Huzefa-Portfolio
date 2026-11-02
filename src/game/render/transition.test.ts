import { describe, expect, it } from 'vitest';
import { doorSwingFrame, IRIS_BLOCK, irisMask, irisRuns } from './transition';

const W = 342;
const H = 192;

function covered(progress: number, cx = W / 2, cy = H / 2): number {
  const mask = irisMask(progress, cx, cy, W, H);
  let n = 0;
  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) if (mask(x, y)) n += 1;
  }
  return n;
}

describe('irisMask', () => {
  it('iris_fully_open_and_fully_closed', () => {
    expect(covered(0)).toBe(0);
    expect(covered(1)).toBe(W * H);
  });

  it('fully_closed_covers_even_when_the_centre_is_off_screen', () => {
    expect(covered(1, -50, 400)).toBe(W * H);
    expect(covered(0, -50, 400)).toBe(0);
  });

  it('closing_only_ever_covers_more', () => {
    let last = -1;
    for (let p = 0; p <= 1.0001; p += 0.1) {
      const n = covered(Math.min(p, 1));
      expect(n).toBeGreaterThanOrEqual(last);
      last = n;
    }
  });

  it('the_centre_is_the_last_thing_to_close', () => {
    const mask = irisMask(0.9, W / 2, H / 2, W, H);
    expect(mask(W / 2, H / 2)).toBe(false);
    expect(mask(0, 0)).toBe(true);
  });

  it('progress_outside_zero_to_one_is_clamped', () => {
    expect(covered(-3)).toBe(0);
    expect(covered(7)).toBe(W * H);
  });
});

describe('irisRuns', () => {
  it('has_hard_pixel_steps_not_a_smooth_edge', () => {
    const runs = irisRuns(0.5, W / 2, H / 2, W, H);
    expect(runs.length).toBeGreaterThan(0);
    for (const r of runs) {
      expect(r.x % IRIS_BLOCK).toBe(0);
      expect(r.y % IRIS_BLOCK).toBe(0);
      expect(Number.isInteger(r.w)).toBe(true);
    }
  });

  it('runs_cover_the_whole_view_when_closed_and_nothing_when_open', () => {
    const area = (p: number) =>
      irisRuns(p, W / 2, H / 2, W, H).reduce((sum, r) => sum + r.w * r.h, 0);
    expect(area(0)).toBe(0);
    expect(area(1)).toBeGreaterThanOrEqual(W * H);
  });
});

describe('doorSwingFrame', () => {
  it('opens_in_order_closed_then_ajar_then_the_open_door_shows', () => {
    expect(doorSwingFrame(0)).toBe('doorClosed');
    expect(doorSwingFrame(0.45)).toBe('darkDoorAjar');
    expect(doorSwingFrame(0.9)).toBeNull();
    expect(doorSwingFrame(1)).toBeNull();
  });
});
