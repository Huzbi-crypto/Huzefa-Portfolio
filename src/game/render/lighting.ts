import type { Input } from '../core/input';

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
export const LIGHT_STEPS = [
  0.06, 0.13, 0.22, 0.34, 0.48, 0.64, 0.81, 1,
] as const;

const BAYER_4 = [
  0, 8, 2, 10,
  12, 4, 14, 6,
  3, 11, 1, 9,
  15, 7, 13, 5,
] as const;

const BAYER_THRESHOLDS = new Float64Array(16);
for (let i = 0; i < BAYER_4.length; i += 1) {
  BAYER_THRESHOLDS[i] = (BAYER_4[i] + 0.5) / 16;
}

const WARM_TINT = { r: 1, g: 0.9, b: 0.72 } as const;
const COOL_TINT = { r: 0.72, g: 0.86, b: 1 } as const;

let lightXs = new Float64Array(8);
let lightYs = new Float64Array(8);
let lightRadiiSq = new Float64Array(8);
let lightInvRadiiSq = new Float64Array(8);
let lightWarms = new Uint8Array(8);

/**
 * Copy the current lights into reusable typed arrays. This only allocates
 * when the number of lights grows past the cache, never on a steady frame.
 */
function prepareLights(lights: Light[]): void {
  const count = lights.length;

  if (count > lightXs.length) {
    let size = lightXs.length;
    while (size < count) size *= 2;
    lightXs = new Float64Array(size);
    lightYs = new Float64Array(size);
    lightRadiiSq = new Float64Array(size);
    lightInvRadiiSq = new Float64Array(size);
    lightWarms = new Uint8Array(size);
  }

  for (let i = 0; i < count; i += 1) {
    const light = lights[i];
    const radiusSq = light.radius * light.radius;
    lightXs[i] = light.x;
    lightYs[i] = light.y;
    lightRadiiSq[i] = radiusSq;
    lightInvRadiiSq[i] = radiusSq > 0 ? 1 / radiusSq : 0;
    lightWarms[i] = light.tint === 'warm' ? 1 : 0;
  }
}

function levelIndex(level: number, x: number, y: number): number {
  const last = LIGHT_STEPS.length - 1;
  const scaled = level * last;
  const base = scaled | 0;
  if (base >= last) return last;

  const threshold = BAYER_THRESHOLDS[((y & 3) << 2) | (x & 3)];
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

/**
 * Multiply an image by the quantised light levels, writing into `dst`.
 * `tint` is a hard choice per cell (the stronger light wins it) so
 * neighbouring pixels never blend into a smooth colour gradient. The
 * continuous light field is sampled once per 4 by 4 dither cell; the Bayer
 * matrix supplies the per-pixel steps inside that cell. Nothing is allocated
 * per frame.
 */
export function applyLighting(
  src: ImageData,
  dst: ImageData,
  lights: Light[],
): void {
  if (src.width !== dst.width || src.height !== dst.height) {
    throw new Error('Lighting source and destination must be the same size');
  }

  const { width, height } = src;
  const srcData = src.data;
  const dstData = dst.data;
  const lightCount = lights.length;

  prepareLights(lights);

  for (let cellY = 0; cellY < height; cellY += 4) {
    const yEnd = Math.min(cellY + 4, height);
    const sampleY = cellY + (yEnd - cellY) / 2;

    for (let cellX = 0; cellX < width; cellX += 4) {
      const xEnd = Math.min(cellX + 4, width);
      const sampleX = cellX + (xEnd - cellX) / 2;

      let warm = 0;
      let cool = 0;

      for (let i = 0; i < lightCount; i += 1) {
        const dx = sampleX - lightXs[i];
        const dy = sampleY - lightYs[i];
        const distSq = dx * dx + dy * dy;
        if (distSq >= lightRadiiSq[i]) continue;

        const contribution = 1 - distSq * lightInvRadiiSq[i];
        if (lightWarms[i] === 1) warm += contribution;
        else cool += contribution;
      }

      const total = warm + cool;
      const level = total > 1 ? 1 : total;

      let red = 1;
      let green = 1;
      let blue = 1;
      if (warm >= cool && warm > 0) {
        red = WARM_TINT.r;
        green = WARM_TINT.g;
        blue = WARM_TINT.b;
      } else if (cool > 0) {
        red = COOL_TINT.r;
        green = COOL_TINT.g;
        blue = COOL_TINT.b;
      }

      for (let y = cellY; y < yEnd; y += 1) {
        for (let x = cellX; x < xEnd; x += 1) {
          const step = LIGHT_STEPS[levelIndex(level, x, y)];
          const offset = (y * width + x) * 4;

          dstData[offset] = srcData[offset] * step * red;
          dstData[offset + 1] = srcData[offset + 1] * step * green;
          dstData[offset + 2] = srcData[offset + 2] * step * blue;
          dstData[offset + 3] = srcData[offset + 3];
        }
      }
    }
  }
}

/**
 * Where the lantern sits for the current input device. Mouse and touch follow
 * the pointer or last drag; keyboard (and a mouse that has left the canvas)
 * keep the light on the player. Existing objects are returned as-is so the
 * game loop does not allocate a new position every frame.
 */
export function lanternPosition(
  mode: Input['mode'],
  pointer: { x: number; y: number } | null,
  player: { x: number; y: number },
  lastDrag: { x: number; y: number } | null,
): { x: number; y: number } {
  if (mode === 'mouse' && pointer !== null) return pointer;
  if (mode === 'touch' && lastDrag !== null) return lastDrag;
  return player;
}
