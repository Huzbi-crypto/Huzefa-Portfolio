export type Light = {
  x: number;
  y: number;
  radius: number;
  tint: 'warm' | 'cool';
};

/**
 * Hard light levels, from near-black to full brightness. Quantising to these
 * keeps the dark world inside the palette instead of drawing a smooth
 * gradient.
 */
export const LIGHT_STEPS = [0.06, 0.13, 0.22, 0.34, 0.48, 0.64, 0.81, 1] as const;

const BAYER_4 = [
  0, 8, 2, 10,
  12, 4, 14, 6,
  3, 11, 1, 9,
  15, 7, 13, 5,
] as const;

function levelIndex(level: number, x: number, y: number): number {
  const last = LIGHT_STEPS.length - 1;
  const scaled = level * last;
  const base = Math.floor(scaled);
  if (base >= last) return last;

  const threshold = (BAYER_4[((y & 3) << 2) | (x & 3)] + 0.5) / 16;
  return scaled - base > threshold ? base + 1 : base;
}

/**
 * Illumination at one world pixel. Contributions from every light add
 * together, then the result is quantised with a 4 by 4 Bayer matrix so the
 * falloff reads as ordered dithering rather than a gradient.
 */
export function lightLevel(lights: Light[], x: number, y: number): number {
  let total = 0;

  for (let i = 0; i < lights.length; i += 1) {
    const light = lights[i];
    const dx = x - light.x;
    const dy = y - light.y;
    const distSq = dx * dx + dy * dy;
    const radiusSq = light.radius * light.radius;
    if (distSq >= radiusSq) continue;

    total += 1 - distSq / radiusSq;
  }

  const level = total > 1 ? 1 : total;
  return LIGHT_STEPS[levelIndex(level, x, y)];
}
