/**
 * A small grayscale image laid out row by row. Values run from 0 (ink) to 1
 * (bright), so pure logic can resolve, light and ASCII-fy a picture without a
 * canvas or a palette.
 */
export type PixelGrid = { w: number; h: number; pixels: number[] };

/** A cheap, deterministic 32-bit hash of a seed and a pixel coordinate. */
export function hashPixel(seed: number, x: number, y: number): number {
  let h = (seed | 0) ^ 0x9e3779b9;
  h = Math.imul(h ^ Math.imul(x | 0, 0x45d9f3b), 0x45d9f3b);
  h = Math.imul(h ^ Math.imul(y | 0, 0x27d4eb2d), 0x27d4eb2d);
  h ^= h >>> 15;
  h = Math.imul(h, 0x2c1b3c6d);
  h ^= h >>> 12;
  return h >>> 0;
}

export function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}
