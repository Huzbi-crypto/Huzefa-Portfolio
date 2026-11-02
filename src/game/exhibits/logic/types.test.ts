import { describe, expect, it } from 'vitest';
import { clamp01, hashPixel } from './types';

describe('hashPixel', () => {
  it('is_deterministic_and_unsigned', () => {
    for (let seed = 0; seed < 20; seed += 1) {
      for (let x = 0; x < 4; x += 1) {
        for (let y = 0; y < 4; y += 1) {
          const hash = hashPixel(seed, x, y);
          expect(hash).toBe(hashPixel(seed, x, y));
          expect(Number.isInteger(hash)).toBe(true);
          expect(hash).toBeGreaterThanOrEqual(0);
          expect(hash).toBeLessThanOrEqual(0xffffffff);
        }
      }
    }

    expect(hashPixel(1, 2, 3)).not.toBe(hashPixel(1, 3, 2));
    expect(hashPixel(1, 2, 3)).not.toBe(hashPixel(2, 2, 3));
  });
});

describe('clamp01', () => {
  it('clamps_to_the_unit_interval', () => {
    expect(clamp01(-2)).toBe(0);
    expect(clamp01(0)).toBe(0);
    expect(clamp01(0.5)).toBe(0.5);
    expect(clamp01(1)).toBe(1);
    expect(clamp01(4)).toBe(1);
    expect(clamp01(Number.NaN)).toBe(0);
    expect(clamp01(Number.POSITIVE_INFINITY)).toBe(0);
  });
});
