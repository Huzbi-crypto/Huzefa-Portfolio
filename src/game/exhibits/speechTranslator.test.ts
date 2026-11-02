import { describe, expect, it } from 'vitest';
import { barsAlong, stringPoint } from './speechTranslator';

const a = { x: 10, y: 100 };
const b = { x: 110, y: 100 };

describe('speech-translator string', () => {
  it('is_tied_at_both_cans_and_sags_between_them', () => {
    expect(stringPoint(a, b, 8, 0)).toEqual(a);
    expect(stringPoint(a, b, 8, 1)).toEqual(b);
    expect(stringPoint(a, b, 8, 0.5).y).toBe(108);
    expect(stringPoint(a, b, 8, 0.25).y).toBeGreaterThan(100);
    expect(stringPoint(a, b, 8, 0.25).y).toBeLessThan(108);
  });

  it('points_are_whole_pixels', () => {
    for (let t = 0; t <= 1; t += 0.07) {
      const p = stringPoint(a, b, 7, t);
      expect(Number.isInteger(p.x) && Number.isInteger(p.y)).toBe(true);
    }
  });
});

describe('speech-translator sound bars', () => {
  it('nothing_is_on_the_string_before_or_after_the_trip', () => {
    expect(barsAlong(6, 0, 100, 4)).toEqual([]);
    expect(barsAlong(6, 1, 100, 4)).toEqual([]);
  });

  it('the_first_bar_leads_and_every_bar_stays_on_the_string', () => {
    const mid = barsAlong(6, 0.5, 100, 4);
    expect(mid.length).toBeGreaterThan(0);
    for (const bar of mid) expect(bar.along).toBeGreaterThanOrEqual(0);
    for (const bar of mid) expect(bar.along).toBeLessThanOrEqual(100);
    const sorted = [...mid].sort((p, q) => q.along - p.along);
    expect(sorted[0].index).toBe(Math.min(...mid.map((bar) => bar.index)));
  });

  it('bars_keep_their_order_and_spacing', () => {
    const mid = barsAlong(5, 0.5, 100, 6);
    for (let i = 1; i < mid.length; i += 1) {
      expect(mid[i - 1].along - mid[i].along).toBe(6);
    }
  });
});
