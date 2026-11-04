import { ACTIVE_PALETTE, SPRITES } from '@/game/art';
import { AI_BULB, AI_CANVAS } from '@/game/art/sprites/workshop';
import { copy } from '@/game/content/copy';
import { projectStarId } from '@/game/content/stars';
import type { Light } from '@/game/render/lighting';
import { drawSprite } from '@/game/render/sprite';
import type { GameApi, SceneCtx } from '@/game/scene/types';
import type { Tile } from '@/game/world/grid';
import { tryExhibit } from './exhibit';
import { pickRoll, resolveImage } from './logic/diffusion';
import { clamp01, type PixelGrid } from './logic/types';
import { createPlayback } from './playback';
import type { Exhibit } from './types';

export const PORTRAIT_SIZE = 24;

const INK = 0.1;
const SHADE = 0.4;
const SKIN = 0.6;
const PAPER = 0.9;

/** Four tones, mapped to a warm sepia run of the palette: ink, brown, tan, cream. */
const TONES = ['a', 'f', 'q', 'p'] as const;
type Tone = (typeof TONES)[number];

export function toneKey(v: number): Tone {
  const t = clamp01(v);
  if (t < 0.25) return TONES[0];
  if (t < 0.5) return TONES[1];
  if (t < 0.75) return TONES[2];
  return TONES[3];
}

// --- drawing a portrait into a grayscale grid ------------------------------

function blank(): number[] {
  return new Array<number>(PORTRAIT_SIZE * PORTRAIT_SIZE).fill(PAPER);
}

function set(g: number[], x: number, y: number, v: number): void {
  if (x < 0 || y < 0 || x >= PORTRAIT_SIZE || y >= PORTRAIT_SIZE) return;
  g[y * PORTRAIT_SIZE + x] = v;
}

function fill(g: number[], x: number, y: number, w: number, h: number, v: number): void {
  for (let j = y; j < y + h; j += 1) for (let i = x; i < x + w; i += 1) set(g, i, j, v);
}

function box(g: number[], x: number, y: number, w: number, h: number, edge: number, inner: number): void {
  fill(g, x, y, w, h, edge);
  fill(g, x + 1, y + 1, w - 2, h - 2, inner);
}

function disc(g: number[], cx: number, cy: number, r: number, v: number): void {
  for (let y = 0; y < PORTRAIT_SIZE; y += 1) {
    for (let x = 0; x < PORTRAIT_SIZE; x += 1) {
      if (Math.hypot(x + 0.5 - cx, y + 0.5 - cy) <= r) set(g, x, y, v);
    }
  }
}

function ring(g: number[], cx: number, cy: number, r: number, v: number): void {
  for (let y = 0; y < PORTRAIT_SIZE; y += 1) {
    for (let x = 0; x < PORTRAIT_SIZE; x += 1) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      if (d <= r && d > r - 1.1) set(g, x, y, v);
    }
  }
}

function line(g: number[], x0: number, y0: number, x1: number, y1: number, v: number): void {
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  let x = x0;
  let y = y0;
  for (;;) {
    set(g, x, y, v);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }
}

type Pt = [number, number];

function tri(g: number[], a: Pt, b: Pt, c: Pt, v: number): void {
  const area = (p: Pt, q: Pt, r: Pt): number =>
    (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
  const total = area(a, b, c);
  if (total === 0) return;
  for (let y = 0; y < PORTRAIT_SIZE; y += 1) {
    for (let x = 0; x < PORTRAIT_SIZE; x += 1) {
      const p: Pt = [x + 0.5, y + 0.5];
      const w0 = area(b, c, p) / total;
      const w1 = area(c, a, p) / total;
      const w2 = area(a, b, p) / total;
      if (w0 >= 0 && w1 >= 0 && w2 >= 0) set(g, x, y, v);
    }
  }
}

function grin(): number[] {
  const g = blank();
  disc(g, 12, 13, 9.5, SKIN);
  // Hair: a dark cap with a few spikes standing up.
  for (let y = 0; y < 7; y += 1) {
    for (let x = 0; x < PORTRAIT_SIZE; x += 1) {
      if (Math.hypot(x + 0.5 - 12, y + 0.5 - 13) <= 9.5) set(g, x, y, INK);
    }
  }
  for (const [x, top] of [[7, 3], [9, 1], [12, 0], [15, 1], [17, 3]] as const) fill(g, x, top, 2, 4, INK);
  ring(g, 12, 13, 9.5, INK);
  // A fringe that stops short, then the eyes.
  fill(g, 7, 7, 4, 1, INK);
  fill(g, 13, 7, 4, 1, INK);
  fill(g, 8, 10, 3, 4, INK);
  fill(g, 14, 10, 3, 4, INK);
  set(g, 8, 10, PAPER);
  set(g, 14, 10, PAPER);
  set(g, 9, 11, PAPER);
  set(g, 15, 11, PAPER);
  // Cheeks and the grin.
  fill(g, 5, 15, 2, 1, SHADE);
  fill(g, 17, 15, 2, 1, SHADE);
  fill(g, 7, 16, 10, 1, INK);
  fill(g, 8, 17, 8, 2, PAPER);
  fill(g, 8, 19, 8, 1, INK);
  set(g, 7, 17, INK);
  set(g, 16, 17, INK);
  for (const x of [10, 12, 14]) set(g, x, 17, SHADE);
  return g;
}

function owl(): number[] {
  const g = blank();
  tri(g, [3, 1], [11, 6], [3, 9], INK);
  tri(g, [21, 1], [13, 6], [21, 9], INK);
  disc(g, 12, 13, 9.5, SKIN);
  ring(g, 12, 13, 9.5, INK);
  // Brows, then two enormous eyes.
  line(g, 3, 6, 8, 8, INK);
  line(g, 21, 6, 16, 8, INK);
  for (const cx of [8, 16]) {
    disc(g, cx, 12, 4.2, INK);
    disc(g, cx, 12, 3.2, PAPER);
    fill(g, cx - 1, 11, 2, 3, INK);
    set(g, cx - 1, 11, PAPER);
  }
  // Beak and a patch of chest feathers.
  tri(g, [10, 14], [14, 14], [12, 18.5], SHADE);
  line(g, 10, 14, 12, 18, INK);
  line(g, 14, 14, 12, 18, INK);
  for (const [x, y] of [[7, 20], [8, 21], [9, 20], [14, 21], [15, 22], [16, 21], [11, 22]] as const) set(g, x, y, SHADE);
  return g;
}

function cat(): number[] {
  const g = blank();
  tri(g, [3, 1], [11, 7], [3, 11], INK);
  tri(g, [21, 1], [13, 7], [21, 11], INK);
  tri(g, [4.5, 4], [9, 8], [4.5, 10], SHADE);
  tri(g, [19.5, 4], [15, 8], [19.5, 10], SHADE);
  disc(g, 12, 14, 8.8, SKIN);
  ring(g, 12, 14, 8.8, INK);
  // Eyes with slit pupils, a nose, a small mouth.
  for (const x of [7, 15]) {
    fill(g, x, 12, 3, 3, PAPER);
    fill(g, x + 1, 12, 1, 3, INK);
  }
  tri(g, [10.5, 16], [13.5, 16], [12, 17.5], SHADE);
  set(g, 12, 18, INK);
  line(g, 10, 19, 12, 18, INK);
  line(g, 14, 19, 12, 18, INK);
  // Whiskers.
  line(g, 0, 15, 5, 16, INK);
  line(g, 0, 19, 5, 17, INK);
  line(g, 23, 15, 18, 16, INK);
  line(g, 23, 19, 18, 17, INK);
  return g;
}

const BUILDERS: Record<string, () => number[]> = {
  'portrait-grin': grin,
  'portrait-owl': owl,
  'portrait-cat': cat,
};

/** The picture the machine means to make. Unknown ids fall back to the grin. */
export function portraitGrid(id: string): PixelGrid {
  return { w: PORTRAIT_SIZE, h: PORTRAIT_SIZE, pixels: (BUILDERS[id] ?? grin)() };
}


/**
 * A row of one-pixel fingers standing on a palm edge, outlined in ink, each
 * `lengths[i]` long. `dir` is -1 for fingers pointing up and 1 for down.
 */
function fingers(g: number[], x0: number, edge: number, dir: 1 | -1, lengths: number[]): void {
  const reach = (i: number): number => lengths[Math.min(lengths.length - 1, Math.max(0, i))];
  for (let c = 0; c <= lengths.length; c += 1) {
    const length = Math.min(reach(c - 1), reach(c));
    const x = x0 - 1 + c * 2;
    for (let k = 1; k <= length; k += 1) set(g, x, edge + dir * k, INK);
  }
  lengths.forEach((length, i) => {
    const x = x0 + i * 2;
    for (let k = 1; k <= length; k += 1) set(g, x, edge + dir * k, PAPER);
    set(g, x, edge + dir * (length + 1), INK);
  });
  // Fingertips: close the outline over the gaps either side.
  for (let c = 0; c <= lengths.length; c += 1) {
    const length = Math.min(reach(c - 1), reach(c));
    set(g, x0 - 1 + c * 2, edge + dir * (length + 1), INK);
  }
}

/** What the machine gets wrong. Never mutates the grid it is given. */
export function applyFlaw(grid: PixelGrid, flaw: string): PixelGrid {
  const g = [...grid.pixels];
  switch (flaw) {
    case 'six-fingers':
      // A hand held up in the corner, one finger too many.
      box(g, 10, 19, 13, 5, INK, PAPER);
      fingers(g, 11, 19, -1, [4, 5, 6, 6, 5, 4]);
      break;
    case 'backwards-hand':
      // Fingers hanging down from the top, thumb on the wrong side.
      box(g, 11, 0, 9, 4, INK, PAPER);
      fingers(g, 12, 3, 1, [4, 5, 5, 4]);
      fill(g, 8, 1, 4, 3, INK);
      fill(g, 9, 2, 2, 1, PAPER);
      break;
    case 'three-eyes':
      box(g, 9, 2, 7, 6, INK, PAPER);
      fill(g, 11, 3, 3, 3, INK);
      set(g, 11, 3, PAPER);
      break;
    case 'crooked-smile':
      fill(g, 6, 16, 13, 6, SKIN);
      line(g, 7, 21, 17, 16, INK);
      line(g, 7, 20, 16, 16, INK);
      break;
    case 'extra-ear':
      tri(g, [8, 6], [16, 6], [12, -1], INK);
      tri(g, [10, 5.5], [14, 5.5], [12, 1.5], SHADE);
      break;
    default:
      break;
  }
  return { w: grid.w, h: grid.h, pixels: g };
}

// --- the exhibit -----------------------------------------------------------

type Point = { x: number; y: number };

const SIZE = { w: 60, h: 72 } as const;
const PULL_MS = 2600;
const STEPS = 14;
const COUNTER = 'workshop-ai-pulls';
const C = ACTIVE_PALETTE;

/** Seeds are searched once so the very first pull is the six-fingers joke. */
function seedFor(flaw: string): number {
  for (let seed = 1; seed < 5000; seed += 1) if (pickRoll(seed).flaw === flaw) return seed;
  return 1;
}
const FIRST_SEED = seedFor('six-fingers');

type Roll = { noiseSeed: number; target: PixelGrid; portrait: string; flaw: string };

function sprite(name: string) {
  const found = SPRITES[name];
  if (!found) throw new Error(`Missing sprite: ${name}`);
  return found;
}

export function createAiAnime(at: Point, stand: Tile): { exhibit: Exhibit; light: Light } {
  const play = createPlayback();
  let reduced = false;
  let roll: Roll | null = null;
  const cache = { key: '', grid: null as PixelGrid | null };

  const light: Light = {
    x: at.x + AI_CANVAS.x + AI_CANVAS.w / 2,
    y: at.y + AI_CANVAS.y + AI_CANVAS.h / 2,
    radius: 28,
    tint: 'cool',
  };

  /** What is on the canvas right now, rebuilt only when it changes. */
  function picture(ctx: SceneCtx): PixelGrid {
    if (!roll) {
      const seed = reduced ? 11 : Math.floor(ctx.t / 420);
      const key = `idle:${seed}`;
      if (cache.key !== key || !cache.grid) {
        const blankTarget: PixelGrid = { w: PORTRAIT_SIZE, h: PORTRAIT_SIZE, pixels: blank() };
        cache.grid = resolveImage(blankTarget, seed, 0);
        cache.key = key;
      }
      return cache.grid;
    }
    const eased = play.active ? clamp01((play.progress - 0.12) / 0.78) : 1;
    const step = Math.floor(eased * STEPS);
    const key = `roll:${roll.noiseSeed}:${step}`;
    if (cache.key !== key || !cache.grid) {
      cache.grid = resolveImage(roll.target, roll.noiseSeed, step / STEPS);
      cache.key = key;
    }
    return cache.grid;
  }

  function shake(ctx: SceneCtx): number {
    if (!play.active || ctx.reducedMotion) return 0;
    return [0, 1, 0, -1][Math.floor(play.elapsed / 70) % 4];
  }

  const exhibit: Exhibit = {
    id: 'ai-anime',
    projectId: 'ai-anime',
    rect: { x: at.x, y: at.y, w: SIZE.w, h: SIZE.h },
    stand,
    footY: at.y + SIZE.h,
    label: copy.workshop.aiAnime.label,

    update(ms, ctx) {
      reduced = ctx.reducedMotion;
      play.update(ms);
      light.radius = play.active ? 34 + (Math.floor(play.elapsed / 120) % 2) * 2 : 28;
    },

    draw(g, ctx) {
      const dx = shake(ctx);
      drawSprite(g, sprite('workshopMachine'), at.x + dx, at.y);
      const turning = play.active && !ctx.reducedMotion && Math.floor(play.elapsed / 110) % 2 === 1;
      drawSprite(g, sprite(turning ? 'workshopGear1' : 'workshopGear0'), at.x + 17 + dx, at.y + 45);
      drawSprite(g, sprite(turning ? 'workshopGear0' : 'workshopGear1'), at.x + 29 + dx, at.y + 45);
      drawSprite(g, sprite(play.active ? 'workshopLeverDown' : 'workshopLeverUp'), at.x + 46 + dx, at.y + 22);
    },

    glow(g, ctx) {
      const dx = shake(ctx);
      const grid = picture(ctx);
      const x0 = at.x + AI_CANVAS.x + dx;
      const y0 = at.y + AI_CANVAS.y;
      // Merge runs of the same tone so a frame is a handful of rectangles, not hundreds.
      for (let y = 0; y < grid.h; y += 1) {
        let runStart = 0;
        let runKey: Tone = toneKey(grid.pixels[y * grid.w]);
        for (let x = 1; x <= grid.w; x += 1) {
          const next: Tone | null = x < grid.w ? toneKey(grid.pixels[y * grid.w + x]) : null;
          if (next === runKey) continue;
          g.fillStyle = C[runKey];
          g.fillRect(x0 + runStart, y0 + y, x - runStart, 1);
          runStart = x;
          if (next) runKey = next;
        }
      }
      // The bulb on top, brighter while the machine works.
      g.fillStyle = play.active ? C.s : C.r;
      g.fillRect(at.x + AI_BULB.x - 1 + dx, at.y + AI_BULB.y - 1, 3, 3);
      if (play.active || (!ctx.reducedMotion && Math.floor(ctx.t / 900) % 3 === 0)) {
        g.fillStyle = C.s;
        g.fillRect(at.x + AI_BULB.x + dx, at.y + AI_BULB.y - 1, 1, 1);
      }
      // Steam from the bent pipe, only when it is working.
      if (play.active && !ctx.reducedMotion) {
        g.fillStyle = C.C;
        for (let i = 0; i < 4; i += 1) {
          const rise = (Math.floor(play.elapsed / 90) + i * 3) % 12;
          g.fillRect(at.x + 12 + (i % 2) * 2 + dx, at.y + 8 - rise, 1, 1);
        }
      }
    },

    async use(api: GameApi) {
      const pulls = api.store.count(COUNTER);
      api.store.increment(COUNTER);
      const seed = FIRST_SEED + pulls * 7919;
      const drawn = pickRoll(seed);
      roll = {
        noiseSeed: seed * 31 + 1,
        target: applyFlaw(portraitGrid(drawn.target), drawn.flaw),
        portrait: drawn.target,
        flaw: drawn.flaw,
      };
      // Trying it is enough for the star; the show is a bonus.
      api.store.award(projectStarId('ai-anime'));
      const finished = await play.start(PULL_MS, reduced);
      if (!finished) return;

      const text = copy.workshop.aiAnime;
      await api.store.say([
        pulls === 0 ? text.pulled : text.again,
        text.portraits[roll.portrait as keyof typeof text.portraits],
        text.flaws[roll.flaw as keyof typeof text.flaws],
        text.verdict,
      ]);
      await tryExhibit(api, 'ai-anime');
    },
  };

  return { exhibit, light };
}
