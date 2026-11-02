import { clamp01, type PixelGrid } from './types';

/** Dark to bright. The lantern only converts the cells it actually lights. */
export const RAMP = ' .:-=+*#%@';

export function luminanceToChar(l: number): string {
  const step = Math.min(
    RAMP.length - 1,
    Math.floor(clamp01(l) * (RAMP.length - 1)),
  );
  return RAMP[step];
}

/**
 * Average one square cell of the picture into a single character. Coordinates
 * outside the picture clamp to the nearest edge, so a lantern sweeping past the
 * frame never reads off the end.
 */
export function asciifyCell(
  pixels: PixelGrid,
  x: number,
  y: number,
  cell: number,
): string {
  if (pixels.w <= 0 || pixels.h <= 0) return luminanceToChar(0);

  const size = Math.max(
    1,
    Math.floor(Number.isFinite(cell) ? cell : 1),
  );
  let total = 0;

  for (let dy = 0; dy < size; dy += 1) {
    const sy = Math.min(
      pixels.h - 1,
      Math.max(0, Math.floor(y) + dy),
    );
    for (let dx = 0; dx < size; dx += 1) {
      const sx = Math.min(
        pixels.w - 1,
        Math.max(0, Math.floor(x) + dx),
      );
      total += clamp01(pixels.pixels[sy * pixels.w + sx]);
    }
  }

  return luminanceToChar(total / (size * size));
}
