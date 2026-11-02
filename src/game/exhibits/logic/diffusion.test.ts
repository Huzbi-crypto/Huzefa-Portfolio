import { describe, expect, it } from 'vitest';
import { pickRoll, resolveImage } from './diffusion';
import type { PixelGrid } from './types';

function grid(w: number, h: number, paint: (x: number, y: number) => number): PixelGrid {
  const pixels: number[] = [];
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) pixels.push(paint(x, y));
  }
  return { w, h, pixels };
}

function matches(a: PixelGrid, b: PixelGrid): number {
  let count = 0;
  for (let i = 0; i < a.pixels.length; i += 1) {
    if (a.pixels[i] === b.pixels[i]) count += 1;
  }
  return count;
}

describe('resolveImage', () => {
  const target = grid(16, 16, (x, y) => ((x + y) % 4) / 3);

  it('progress_0_is_noise', () => {
    const first = resolveImage(target, 7, 0);
    const again = resolveImage(target, 7, 0);

    expect(first.pixels).toEqual(again.pixels);
    expect(first.pixels).not.toEqual(target.pixels);
    expect(resolveImage(target, 8, 0).pixels).not.toEqual(first.pixels);
  });

  it('progress_1_equals_target', () => {
    expect(resolveImage(target, 7, 1)).toEqual(target);
  });

  it('more_progress_matches_more_pixels', () => {
    const counts = [0, 0.25, 0.5, 0.75, 1].map((progress) =>
      matches(resolveImage(target, 7, progress), target),
    );

    for (let i = 1; i < counts.length; i += 1) {
      expect(counts[i]).toBeGreaterThanOrEqual(counts[i - 1]);
    }
    expect(counts[1]).toBeGreaterThan(counts[0]);
    expect(counts[counts.length - 1]).toBe(target.pixels.length);
  });

  it('clamps_progress_outside_zero_to_one', () => {
    expect(resolveImage(target, 7, -1)).toEqual(resolveImage(target, 7, 0));
    expect(resolveImage(target, 7, 2)).toEqual(target);
  });
});

describe('pickRoll', () => {
  it('every_roll_has_a_flaw', () => {
    const flaws = new Set<string>();
    const targets = new Set<string>();

    for (let seed = 0; seed < 100; seed += 1) {
      const roll = pickRoll(seed);

      expect(roll.target.length).toBeGreaterThan(0);
      expect(roll.flaw.length).toBeGreaterThan(0);
      expect(roll).toEqual(pickRoll(seed));
      flaws.add(roll.flaw);
      targets.add(roll.target);
    }

    expect(flaws.size).toBeGreaterThan(1);
    expect(targets.size).toBeGreaterThan(1);
  });
});
