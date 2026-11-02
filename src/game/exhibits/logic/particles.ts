/**
 * The drifting particle field in the Creative Coding exhibit. It uses typed
 * arrays and mutates in place so a frame never allocates; the lantern is just
 * an attractor, and with no attractor the dust keeps drifting on its own.
 */

export type Field = {
  n: number;
  w: number;
  h: number;
  x: Float32Array;
  y: Float32Array;
  vx: Float32Array;
  vy: Float32Array;
};

export type Attractor = { x: number; y: number };

const DRIFT = 30;
const ACCEL = 160;
/** The biggest slice of time a single step simulates, so a stalled tab never explodes. */
const MAX_MS = 100;

function mulberry32(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createField(n: number, w: number, h: number, seed: number): Field {
  const count = Math.max(0, Math.floor(Number.isFinite(n) ? n : 0));
  const width = Math.max(1, w);
  const height = Math.max(1, h);
  const random = mulberry32(seed);

  const x = new Float32Array(count);
  const y = new Float32Array(count);
  const vx = new Float32Array(count);
  const vy = new Float32Array(count);

  for (let i = 0; i < count; i += 1) {
    x[i] = random() * width;
    y[i] = random() * height;
    vx[i] = (random() * 2 - 1) * DRIFT;
    vy[i] = (random() * 2 - 1) * DRIFT;
  }

  return { n: count, w: width, h: height, x, y, vx, vy };
}

export function stepField(
  f: Field,
  ms: number,
  attractor: Attractor | null,
): void {
  const safeMs = Number.isFinite(ms) ? ms : 0;
  const dt = Math.max(0, Math.min(safeMs, MAX_MS)) / 1000;
  if (dt === 0) return;

  const damping = Math.pow(0.985, dt * 60);

  for (let i = 0; i < f.n; i += 1) {
    let vx = f.vx[i];
    let vy = f.vy[i];

    if (attractor) {
      const dx = attractor.x - f.x[i];
      const dy = attractor.y - f.y[i];
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > 0.0001) {
        vx += (dx / distance) * ACCEL * dt;
        vy += (dy / distance) * ACCEL * dt;
      }
    }

    vx *= damping;
    vy *= damping;

    let x = f.x[i] + vx * dt;
    let y = f.y[i] + vy * dt;

    if (x < 0) {
      x = 0;
      vx = Math.abs(vx) * 0.5;
    } else if (x > f.w) {
      x = f.w;
      vx = -Math.abs(vx) * 0.5;
    }

    if (y < 0) {
      y = 0;
      vy = Math.abs(vy) * 0.5;
    } else if (y > f.h) {
      y = f.h;
      vy = -Math.abs(vy) * 0.5;
    }

    f.x[i] = x;
    f.y[i] = y;
    f.vx[i] = vx;
    f.vy[i] = vy;
  }
}
