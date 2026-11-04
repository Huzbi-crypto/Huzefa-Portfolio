import snapshot from '@/data/github-snapshot.json';
import { PALETTES, SPRITES } from '@/game/art';
import {
  digitPixels,
  PLAQUE_ROWS,
  TABLE_GLASS,
} from '@/game/art/sprites/ending';
import { copy } from '@/game/content/copy';
import { allStarIds } from '@/game/content/stars';
import type { Light } from '@/game/render/lighting';
import { drawSprite } from '@/game/render/sprite';
import type { GameStore } from '@/game/state/store';
import { endingUnlocked, nextClue } from '@/game/state/story';
import { TILE, type Tile } from '@/game/world/grid';
import { createDarkSpace, type SpaceDef, type SpaceProp } from './space';
import type { GameApi, Scene } from './types';

const WORLD_W = 384;
const WORLD_H = 224;
/** The sky runs down to here; below it is the painted dome wall, then boards. */
const SKY_BOTTOM = 56;
const WALL_BOTTOM = 72;

const COLORS = PALETTES['cozy-crt'];

/** Where everything stands, in world pixels (the top-left of each sprite). */
const AT = {
  exit: { x: 20, y: 24 },
  table: { x: 136, y: 96 },
  telescope: { x: 280, y: 72 },
  plaque: { x: 80, y: 84 },
  napDoor: { x: 340, y: 24 },
  charts: { x: 28, y: 76 },
  stool: { x: 256, y: 120 },
  scrap: { x: 28, y: 156 },
} as const;

/** The glass of the star table, where the repo stars are allowed to sit. */
export const MAP_BOUNDS = { x: 148, y: 108, w: 88, h: 26 } as const;

/** The night above the dome. */
const SKY_BOUNDS = { x: 16, y: 6, w: 352, h: 40 } as const;
const SKY_GLASS = { cx: 192, cy: 26, rx: 168, ry: 18 } as const;
const MAP_GLASS = {
  cx: TABLE_GLASS.cx + AT.table.x,
  cy: TABLE_GLASS.cy + AT.table.y,
  rx: TABLE_GLASS.rx - 4,
  ry: TABLE_GLASS.ry - 2,
} as const;

export type ConstellationStar = {
  name: string;
  stars: number;
  language: string | null;
  x: number;
  y: number;
};

export type SkyStar = { id: string; x: number; y: number; lit: boolean };

type Point = { x: number; y: number };

function sprite(name: string) {
  const found = SPRITES[name];
  if (!found) throw new Error(`Missing sprite: ${name}`);
  return found;
}

/** A stable hash, so every visit draws the same sky. */
function hashText(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 0x5bd1e995);
  hash ^= hash >>> 15;
  return hash >>> 0;
}

/** Every whole pixel inside an ellipse, in reading order. */
function insideEllipse(
  bounds: { x: number; y: number; w: number; h: number },
  glass: { cx: number; cy: number; rx: number; ry: number },
): Point[] {
  const points: Point[] = [];
  for (let y = bounds.y; y < bounds.y + bounds.h; y += 1) {
    for (let x = bounds.x; x < bounds.x + bounds.w; x += 1) {
      const dx = (x - glass.cx) / glass.rx;
      const dy = (y - glass.cy) / glass.ry;
      if (dx * dx + dy * dy <= 1) points.push({ x, y });
    }
  }
  return points;
}

/**
 * Put one name on one pixel, deterministically and without collisions. The
 * hash scatters them; the probe makes the scatter unique.
 */
function scatter(
  keys: readonly string[],
  bounds: { x: number; y: number; w: number; h: number },
  glass: { cx: number; cy: number; rx: number; ry: number },
): Point[] {
  const pool = insideEllipse(bounds, glass);
  if (pool.length < keys.length) throw new Error('The sky is too small for its stars');

  const used = new Set<number>();
  return keys.map((key) => {
    const start = hashText(key) % pool.length;
    for (let step = 0; step < pool.length; step += 1) {
      const point = pool[(start + step) % pool.length];
      const index = point.y * bounds.w + point.x;
      if (used.has(index)) continue;
      used.add(index);
      return point;
    }
    throw new Error(`No room in the sky for ${key}`);
  });
}

let constellationCache: ConstellationStar[] | null = null;

/**
 * The real repositories, read from the saved GitHub snapshot at build time.
 * Brighter stars are repos more people have starred; the language comes from
 * the repo itself, and the positions never move between visits.
 */
export function constellationStars(): ConstellationStar[] {
  if (constellationCache) return constellationCache;

  const repos = snapshot.repositories;
  const points = scatter(
    repos.map((repo) => repo.name),
    MAP_BOUNDS,
    MAP_GLASS,
  );
  constellationCache = repos.map((repo, index) => ({
    name: repo.name,
    stars: repo.stargazers_count,
    language: repo.language,
    x: points[index].x,
    y: points[index].y,
  }));
  return constellationCache;
}

let skyLayoutCache: { id: string; x: number; y: number }[] | null = null;

function skyLayout(): { id: string; x: number; y: number }[] {
  if (skyLayoutCache) return skyLayoutCache;

  const ids = allStarIds();
  const points = scatter(ids, SKY_BOUNDS, SKY_GLASS);
  skyLayoutCache = ids.map((id, index) => ({ id, x: points[index].x, y: points[index].y }));
  return skyLayoutCache;
}

/** One slot in the sky for every star in the game, lit once it is found. */
export function skyStars(found: readonly string[]): SkyStar[] {
  const lit = new Set(found);
  return skyLayout().map((star) => ({ ...star, lit: lit.has(star.id) }));
}

// --- talking to the room -----------------------------------------------------

async function readSky(api: GameApi): Promise<void> {
  const { found, total } = api.store.getState();
  await api.store.say([...copy.observatory.sky.lines(found.length, total)]);
}

async function readMap(api: GameApi): Promise<void> {
  const repos = snapshot.repositories;
  const brightest = [...repos].sort((a, b) => b.stargazers_count - a.stargazers_count)[0];
  await api.store.say([
    ...copy.observatory.map.intro,
    copy.observatory.map.count(repos.length),
    copy.observatory.map.brightest(brightest.name, brightest.stargazers_count),
  ]);
}

async function readPlaque(api: GameApi): Promise<void> {
  const { stats } = snapshot;
  const top = stats.topLanguages[0]?.language ?? 'code';
  await api.store.say([
    copy.observatory.stats.intro,
    copy.observatory.stats.numbers(
      stats.totalRepos,
      stats.totalStarsReceived,
      stats.totalFollowers,
      stats.snapshotDate,
    ),
    copy.observatory.stats.note,
    copy.observatory.stats.languages(top),
  ]);
}

async function lookThroughTelescope(api: GameApi): Promise<void> {
  const first = !api.store.hasClue('clue:observatory');
  api.store.markClue('clue:observatory');
  await api.store.say([
    ...(first ? copy.clues.observatory.lines : copy.clues.observatory.again),
  ]);
}

async function tryNapDoor(api: GameApi): Promise<void> {
  const progress = api.store.getProgress();

  if (!endingUnlocked(progress)) {
    const next = nextClue(progress);
    const hint = next ? copy.observatory.napDoor.hints[next] : null;
    await api.store.say([
      ...copy.observatory.napDoor.shut,
      ...(hint ? [hint] : []),
    ]);
    return;
  }

  const choice = await api.store.say([...copy.observatory.napDoor.open], [
    { id: 'go', label: copy.observatory.napDoor.goLabel },
    { id: 'stay', label: copy.observatory.napDoor.stayLabel },
  ]);

  if (choice === 'go') {
    api.goTo('nap', 'fromObservatory');
    return;
  }
  if (choice === 'stay') {
    await api.store.say([...copy.observatory.napDoor.stayReply]);
  }
}

// --- drawing -----------------------------------------------------------------

/** A hard-edged moon: cream disc, one dark bite, no blur. */
function drawMoon(g: CanvasRenderingContext2D, cx: number, cy: number, radius: number): void {
  for (let y = -radius; y <= radius; y += 1) {
    const span = Math.round(Math.sqrt(Math.max(0, radius * radius - y * y)));
    g.fillStyle = COLORS.q;
    g.fillRect(cx - span, cy + y, span * 2 + 1, 1);
  }
  for (let y = -radius + 1; y <= radius - 1; y += 1) {
    const span = Math.round(Math.sqrt(Math.max(0, (radius - 1) * (radius - 1) - y * y)));
    g.fillStyle = COLORS.p;
    g.fillRect(cx - span, cy + y, span * 2 + 1, 1);
  }
  // The bite that makes it a moon rather than a lamp.
  for (let y = -radius; y <= radius; y += 1) {
    const span = Math.round(Math.sqrt(Math.max(0, (radius - 3) * (radius - 3) - y * y)));
    g.fillStyle = COLORS.D;
    g.fillRect(cx - span + 5, cy + y, span * 2 + 1, 1);
  }
  g.fillStyle = COLORS.C;
  g.fillRect(cx - radius + 1, cy - 2, 1, 1);
}

function drawSky(g: CanvasRenderingContext2D, store: GameStore): void {
  // The sky makes its own light, so it is painted after the lantern pass.
  g.fillStyle = COLORS.D;
  g.fillRect(0, 0, WORLD_W, SKY_BOTTOM);

  drawMoon(g, 192, 16, 7);

  // The faint ones are where stars will go: part of the sky from the start.
  skyStars([]).forEach((star, index) => {
    g.fillStyle = index % 3 === 0 ? COLORS.A : COLORS.c;
    g.fillRect(star.x, star.y, 1, 1);
    if (index % 11 === 0) {
      g.fillStyle = COLORS.c;
      g.fillRect(star.x - 1, star.y, 1, 1);
      g.fillRect(star.x + 1, star.y, 1, 1);
    }
  });

  for (const star of skyStars(store.getState().found)) {
    if (!star.lit) continue;
    g.fillStyle = COLORS.C;
    g.fillRect(star.x, star.y, 1, 1);
    g.fillStyle = COLORS.s;
    g.fillRect(star.x - 1, star.y, 1, 1);
    g.fillRect(star.x + 1, star.y, 1, 1);
    g.fillRect(star.x, star.y - 1, 1, 1);
    g.fillRect(star.x, star.y + 1, 1, 1);
  }

  // A brass line where the sky meets the dome.
  g.fillStyle = COLORS.h;
  g.fillRect(0, SKY_BOTTOM - 2, WORLD_W, 1);
  g.fillStyle = COLORS.g;
  g.fillRect(0, SKY_BOTTOM - 1, WORLD_W, 1);
}

function drawStarMap(g: CanvasRenderingContext2D): void {
  drawSprite(g, sprite('obsTable'), AT.table.x, AT.table.y);
}

/** The glass map glows: every real repo as a star, brighter when it has more. */
function drawConstellation(g: CanvasRenderingContext2D): void {
  for (const star of constellationStars()) {
    const bright = star.stars > 0;
    g.fillStyle = bright ? COLORS.C : COLORS.q;
    g.fillRect(star.x, star.y, 1, 1);
    if (!bright) continue;
    g.fillStyle = COLORS.s;
    g.fillRect(star.x - 1, star.y, 1, 1);
    g.fillRect(star.x + 1, star.y, 1, 1);
    g.fillRect(star.x, star.y - 1, 1, 1);
    g.fillRect(star.x, star.y + 1, 1, 1);
  }
}

/** A compass rose worn into the slate, so the big floor has somewhere to look. */
function drawFloorRose(g: CanvasRenderingContext2D): void {
  const ring = (rx: number, ry: number, color: string): void => {
    for (let step = 0; step < 240; step += 1) {
      const angle = (step / 240) * Math.PI * 2;
      const x = Math.round(MAP_GLASS.cx + Math.cos(angle) * rx);
      const y = Math.round(MAP_GLASS.cy + 54 + Math.sin(angle) * ry);
      g.fillStyle = color;
      g.fillRect(x, y, 1, 1);
    }
  };
  ring(58, 15, COLORS.d);
  ring(42, 11, COLORS.c);
  ring(18, 5, COLORS.d);
}

function drawDigits(
  g: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
): void {
  g.fillStyle = COLORS.C;
  for (const [dx, dy] of digitPixels(text).points) {
    g.fillRect(x + dx, y + dy, 1, 1);
  }
}

function drawPlaqueDigits(g: CanvasRenderingContext2D): void {
  const { stats } = snapshot;
  const rows = [
    String(stats.totalRepos),
    String(stats.totalStarsReceived),
    String(stats.totalFollowers),
  ];
  rows.forEach((text, index) => {
    drawDigits(
      g,
      text,
      AT.plaque.x + PLAQUE_ROWS.x,
      AT.plaque.y + PLAQUE_ROWS.y[index],
    );
  });
  drawDigits(
    g,
    stats.snapshotDate,
    AT.plaque.x + PLAQUE_ROWS.date.x,
    AT.plaque.y + PLAQUE_ROWS.date.y,
  );
}

function drawNapDoor(g: CanvasRenderingContext2D, store: GameStore): void {
  drawSprite(g, sprite('obsNapDoor'), AT.napDoor.x, AT.napDoor.y);
  if (!endingUnlocked(store.getProgress())) return;

  drawSprite(g, sprite('obsNapDoorGlow'), AT.napDoor.x + 2, AT.napDoor.y + 42);
}

function drawBackdrop(g: CanvasRenderingContext2D): void {
  // The sky itself is painted in the glow pass, but keep the ink underneath.
  g.fillStyle = COLORS.D;
  g.fillRect(0, 0, WORLD_W, SKY_BOTTOM);

  // The dome wall under it.
  for (let x = 0; x < WORLD_W; x += 16) {
    drawSprite(g, sprite('obsWall'), x, SKY_BOTTOM);
  }

  // The slate floor, laid in big squares.
  for (let y = WALL_BOTTOM; y < WORLD_H; y += 16) {
    for (let x = 0; x < WORLD_W; x += 16) {
      const alt = ((x / 16) * 5 + (y / 16) * 3) % 7 === 0;
      drawSprite(g, sprite(alt ? 'obsFloorAlt' : 'obsFloor'), x, y);
    }
  }

  drawFloorRose(g);

  // The way back down, and the light that leaks up it.
  drawSprite(g, sprite('darkArch'), AT.exit.x, AT.exit.y);
  drawSprite(g, sprite('darkExitSpill'), AT.exit.x, WALL_BOTTOM + 8);

  // The same inky border every dark space ends with.
  g.fillStyle = COLORS.a;
  g.fillRect(0, WALL_BOTTOM, TILE, WORLD_H - WALL_BOTTOM);
  g.fillRect(WORLD_W - TILE, WALL_BOTTOM, TILE, WORLD_H - WALL_BOTTOM);
  g.fillRect(0, WORLD_H - TILE, WORLD_W, TILE);
}

const LIGHTS: Light[] = [
  { x: AT.table.x + 56, y: AT.table.y + 28, radius: 30, tint: 'cool' },
  { x: AT.telescope.x + 22, y: AT.telescope.y + 18, radius: 24, tint: 'cool' },
  { x: AT.napDoor.x + 14, y: AT.napDoor.y + 48, radius: 20, tint: 'warm' },
  { x: AT.plaque.x + 30, y: AT.plaque.y + 22, radius: 30, tint: 'warm' },
  { x: AT.exit.x + 12, y: AT.exit.y + 30, radius: 30, tint: 'warm' },
];

function buildProps(store: GameStore): SpaceProp[] {
  return [
    {
      id: 'sky',
      footY: 0,
      glow: (g) => drawSky(g, store),
      interact: {
        rect: { x: 144, y: 4, w: 150, h: 70 },
        stand: { x: 27, y: 10 },
        label: copy.observatory.sky.label,
        use: readSky,
      },
    },
    {
      id: 'star-map',
      footY: AT.table.y + 62,
      draw: drawStarMap,
      glow: drawConstellation,
      interact: {
        rect: { x: AT.table.x, y: AT.table.y, w: 112, h: 62 },
        stand: { x: 23, y: 20 },
        label: copy.observatory.map.label,
        use: readMap,
      },
    },
    {
      id: 'stats-plaque',
      footY: AT.plaque.y + 44,
      draw: (g) => drawSprite(g, sprite('obsPlaque'), AT.plaque.x, AT.plaque.y),
      glow: drawPlaqueDigits,
      interact: {
        rect: { x: AT.plaque.x, y: AT.plaque.y, w: 60, h: 44 },
        stand: { x: 14, y: 15 },
        label: copy.observatory.stats.label,
        use: readPlaque,
      },
    },
    {
      id: 'clue:observatory',
      footY: AT.telescope.y + 64,
      draw: (g) => drawSprite(g, sprite('obsTelescope'), AT.telescope.x, AT.telescope.y),
      interact: {
        rect: { x: AT.telescope.x, y: AT.telescope.y, w: 44, h: 64 },
        stand: { x: 33, y: 17 },
        label: copy.clues.observatory.label,
        use: lookThroughTelescope,
      },
    },
    {
      id: 'nap-door',
      footY: AT.napDoor.y + 48,
      draw: (g) => drawNapDoor(g, store),
      interact: {
        rect: { x: AT.napDoor.x, y: AT.napDoor.y, w: 28, h: 48 },
        stand: { x: 41, y: 9 },
        label: copy.observatory.napDoor.label,
        use: tryNapDoor,
      },
    },
    {
      id: 'exit-glow',
      footY: AT.exit.y + 40,
      glow: (g) =>
        drawSprite(g, sprite('darkExitGlow'), AT.exit.x + 4, AT.exit.y + 3),
    },
    {
      id: 'charts',
      footY: 108,
      draw: (g) => drawSprite(g, sprite('obsCharts'), AT.charts.x, AT.charts.y),
    },
    {
      id: 'stool',
      footY: AT.stool.y + 16,
      draw: (g) => drawSprite(g, sprite('obsStool'), AT.stool.x, AT.stool.y),
    },
    {
      id: 'scrap',
      footY: AT.scrap.y + 10,
      draw: (g) => drawSprite(g, sprite('clueScrap'), AT.scrap.x, AT.scrap.y),
    },
  ];
}

function buildSpaceDef(store: GameStore): SpaceDef {
  return {
    id: 'observatory',
    worldW: WORLD_W,
    worldH: WORLD_H,
    solids: [
      { x: 0, y: 0, w: WORLD_W, h: WALL_BOTTOM },
      // The table's foot and the telescope's tripod.
      { x: AT.table.x + 16, y: AT.table.y + 52, w: 80, h: 10 },
      { x: AT.telescope.x + 16, y: AT.telescope.y + 56, w: 28, h: 8 },
    ],
    spawn: { x: 3, y: 9 },
    entries: {
      fromHall: { x: 3, y: 9 },
      fromNap: { x: 41, y: 9 },
    },
    exits: [
      {
        id: 'exit',
        rect: { x: AT.exit.x, y: AT.exit.y, w: 24, h: 40 },
        stand: { x: 3, y: 9 },
        label: copy.observatory.exit.label,
        to: 'dark',
        entry: 'fromObservatory',
        lines: copy.observatory.exit.lines,
        goLabel: copy.observatory.exit.backLabel,
        stayLabel: copy.observatory.exit.stayLabel,
        stayReply: copy.observatory.exit.stayReply,
      },
    ],
    props: buildProps(store),
    exhibits: [],
    lights: LIGHTS,
    drawBackdrop,
  };
}

export function createObservatory(store: GameStore): Scene {
  return createDarkSpace(buildSpaceDef(store), store);
}

/** The telescope's stand, for tests and nudges that need to name it. */
export const OBSERVATORY_STAND: Tile = { x: 33, y: 17 };
