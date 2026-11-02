import { clamp01, hashPixel, type PixelGrid } from './types';

/**
 * Portrait and mistake ids for the rickety machine. The exhibit maps these to
 * Huzbi's copy; the logic only decides which one a seed rolls.
 */
export const PORTRAITS = ['portrait-grin', 'portrait-owl', 'portrait-cat'] as const;
export const FLAWS = [
  'six-fingers',
  'three-eyes',
  'crooked-smile',
  'extra-ear',
  'backwards-hand',
] as const;

/**
 * Resolve a dithered portrait out of seeded noise. Every pixel has its own
 * threshold, so more progress only ever reveals more of the target; at 0 the
 * picture is pure noise, at 1 it is exactly the target.
 */
export function resolveImage(
  target: PixelGrid,
  noiseSeed: number,
  progress: number,
): PixelGrid {
  const p = clamp01(progress);
  const pixels = new Array<number>(target.pixels.length);

  for (let y = 0; y < target.h; y += 1) {
    for (let x = 0; x < target.w; x += 1) {
      const index = y * target.w + x;
      // A threshold in (0, 1]: nothing shows at 0, everything at 1.
      const threshold = (hashPixel(noiseSeed, x, y) % 1000 + 1) / 1000;
      pixels[index] =
        p >= threshold
          ? target.pixels[index]
          : (hashPixel(noiseSeed ^ 0x5f3759df, x, y) % 1000) / 1000;
    }
  }

  return { w: target.w, h: target.h, pixels };
}

/** Deterministically choose a portrait and the thing the machine got wrong. */
export function pickRoll(seed: number): { target: string; flaw: string } {
  const hash = hashPixel(seed, 17, 29);
  return {
    target: PORTRAITS[hash % PORTRAITS.length],
    flaw: FLAWS[(hash >>> 8) % FLAWS.length],
  };
}
