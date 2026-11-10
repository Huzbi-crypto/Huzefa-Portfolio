import { ACTIVE_PALETTE, SPRITES } from '@/game/art';
import { POSTER, POSTER_EYES, SHELF } from '@/game/art/sprites/archive';
import { chalkPixels } from '@/game/art/sprites/darkGlyphs';
import { copy } from '@/game/content/copy';
import { createAsciiArt } from '@/game/exhibits/asciiArt';
import { createCreativeCoding } from '@/game/exhibits/creativeCoding';
import { createReadCookies } from '@/game/exhibits/readCookies';
import { createRenderer3d } from '@/game/exhibits/renderer3d';
import { createTermExp } from '@/game/exhibits/termExp';
import type { ArchiveExhibit } from '@/game/exhibits/archiveKit';
import type { Light } from '@/game/render/lighting';
import { drawSprite } from '@/game/render/sprite';
import type { GameStore } from '@/game/state/store';
import { TILE } from '@/game/world/grid';
import {
  createDarkSpace,
  type SpaceDef,
  type SpaceProp,
} from './space';
import type { GameApi, Scene } from './types';

const WORLD_W = 384;
const WORLD_H = 208;
const WALL_BOTTOM = 48; // rows 0..5 are wall, floor starts at y = 48

const COLORS = ACTIVE_PALETTE;

/** Where everything stands, in world pixels (the top-left of each sprite). */
const AT = {
  exit: { x: 16, y: 8 },
  term: { x: 56, y: 92 },
  cookies: { x: 152, y: 72 },
  frame: { x: 232, y: 8 },
  dust: { x: 232, y: 96 },
  vector: { x: 304, y: 88 },
  chalkBack: { x: 44, y: 24 },
  chalkShh: { x: 206, y: 26 },
  chalkArchive: { x: 292, y: 22 },
  boxesWest: { x: 20, y: 152 },
  boxesEast: { x: 336, y: 160 },
  clueArchive: { x: 64, y: 146 },
} as const;

/**
 * The poster in the far corner. It hangs there and does nothing: it never
 * moves, never follows, and never does more than look cross.
 */
export const MONSTER_POSTER = {
  at: { x: 344, y: 6 },
  rect: { x: 344, y: 6, w: POSTER.w, h: POSTER.h },
  stand: { x: 44, y: 6 },
} as const;

const SHELVES: readonly { name: string; x: number }[] = [
  { name: 'archShelf0', x: 64 },
  { name: 'archShelf1', x: 112 },
  { name: 'archShelf2', x: 160 },
];

function sprite(name: string) {
  const found = SPRITES[name];
  if (!found) throw new Error(`Missing sprite: ${name}`);
  return found;
}

// --- the poster --------------------------------------------------------------

/** The slow blink: eyes shut for a moment every few seconds, open when motion is off. */
function eyesOpen(t: number, reducedMotion: boolean): boolean {
  return reducedMotion || t % 5200 > 160;
}

/** The scrap folded small in a file box: the Archive's step on the trail. */
async function readClue(api: GameApi): Promise<void> {
  if (api.store.seenEndingLine() !== null) {
    await api.store.say([...copy.clues.archive.after]);
    return;
  }
  const first = !api.store.hasClue('clue:archive');
  api.store.markClue('clue:archive');
  await api.store.say([
    ...(first ? copy.clues.archive.lines : copy.clues.archive.again),
  ]);
}

async function lookAtPoster(api: GameApi): Promise<void> {
  const seen = api.store.count('archive-monster');
  api.store.increment('archive-monster');
  api.store.award('silly:monster-poster');
  const lines =
    api.store.seenEndingLine() !== null
      ? copy.archive.monster.after
      : seen === 0
        ? copy.archive.monster.lines
        : copy.archive.monster.again;
  await api.store.say([...lines]);
}

// --- the space -----------------------------------------------------------------

function buildProps(): SpaceProp[] {
  const { at } = MONSTER_POSTER;
  return [
    {
      id: 'monster-poster',
      footY: WALL_BOTTOM,
      glow: (g, ctx) => {
        // Two red eyes that glow whether or not the lantern is near.
        if (!eyesOpen(ctx.t, ctx.reducedMotion)) return;
        for (const eye of POSTER_EYES) {
          g.fillStyle = COLORS.k;
          g.fillRect(at.x + eye.x, at.y + eye.y, eye.w, eye.h);
          g.fillStyle = COLORS.l;
          g.fillRect(at.x + eye.x + 1, at.y + eye.y, eye.w - 2, 2);
          g.fillStyle = COLORS.C;
          g.fillRect(at.x + eye.x + 1, at.y + eye.y, 1, 1);
          g.fillStyle = COLORS.a;
          g.fillRect(at.x + eye.x + 2, at.y + eye.y + 1, 1, 3);
        }
      },
      interact: {
        rect: { ...MONSTER_POSTER.rect },
        hitRects: [
          { x: at.x + 1, y: at.y + 1, w: POSTER.w - 2, h: POSTER.h - 2 },
        ],
        stand: { ...MONSTER_POSTER.stand },
        label: copy.archive.monster.label,
        use: lookAtPoster,
      },
    },
    {
      id: 'clue:archive',
      footY: AT.clueArchive.y + 10,
      draw: (g) => drawSprite(g, sprite('clueScrap'), AT.clueArchive.x, AT.clueArchive.y),
      interact: {
        rect: { x: AT.clueArchive.x, y: AT.clueArchive.y, w: 12, h: 10 },
        hitRects: [{ x: AT.clueArchive.x, y: AT.clueArchive.y, w: 12, h: 10 }],
        stand: { x: 9, y: 18 },
        label: copy.clues.archive.label,
        use: readClue,
      },
    },
    {
      id: 'boxes-west',
      footY: AT.boxesWest.y + 24,
      draw: (g) => drawSprite(g, sprite('archBoxStack'), AT.boxesWest.x, AT.boxesWest.y),
    },
    {
      id: 'boxes-east',
      footY: AT.boxesEast.y + 24,
      draw: (g) => drawSprite(g, sprite('archBoxStack'), AT.boxesEast.x, AT.boxesEast.y),
    },
  ];
}

function drawChalk(g: CanvasRenderingContext2D, text: string, x: number, y: number): void {
  g.fillStyle = COLORS.q;
  for (const p of chalkPixels(text).points) {
    // Chalk skips a pixel here and there.
    if (((p.x + x) * 7 + (p.y + y) * 13) % 5 === 0) continue;
    g.fillRect(x + p.x, y + p.y, 1, 1);
  }
}

function drawShell(g: CanvasRenderingContext2D): void {
  for (let y = 0; y < WORLD_H; y += 16) {
    for (let x = 0; x < WORLD_W; x += 16) {
      let name: string;
      if (y < 32) name = 'darkWall';
      else if (y === 32) name = 'darkWallBase';
      else name = ((x / 16) * 5 + (y / 16) * 3) % 7 === 0 ? 'darkFloorAlt' : 'darkFloor';
      drawSprite(g, sprite(name), x, y);
    }
  }
  g.fillStyle = COLORS.a;
  g.fillRect(0, WALL_BOTTOM, TILE, WORLD_H - WALL_BOTTOM);
  g.fillRect(WORLD_W - TILE, WALL_BOTTOM, TILE, WORLD_H - WALL_BOTTOM);
  g.fillRect(0, WORLD_H - TILE, WORLD_W, TILE);
}

function drawBackdrop(g: CanvasRenderingContext2D): void {
  drawShell(g);

  drawSprite(g, sprite('darkArch'), AT.exit.x, AT.exit.y);
  for (const shelf of SHELVES) drawSprite(g, sprite(shelf.name), shelf.x, WALL_BOTTOM - SHELF.h);
  drawSprite(g, sprite('archPoster'), MONSTER_POSTER.at.x, MONSTER_POSTER.at.y);

  drawChalk(g, copy.archive.chalk[0], AT.chalkArchive.x, AT.chalkArchive.y);
  drawChalk(g, copy.archive.chalk[1], AT.chalkShh.x, AT.chalkShh.y);
  drawChalk(g, copy.archive.chalk[2], AT.chalkBack.x, AT.chalkBack.y);
}

function buildExhibits(): ArchiveExhibit[] {
  return [
    createTermExp(AT.term),
    createReadCookies(AT.cookies),
    createAsciiArt(AT.frame),
    createCreativeCoding(AT.dust),
    createRenderer3d(AT.vector),
  ];
}

function buildSpaceDef(): SpaceDef {
  const exhibits = buildExhibits();
  const lights: Light[] = exhibits.flatMap((exhibit) => (exhibit.light ? [exhibit.light] : []));

  return {
    id: 'archive',
    worldW: WORLD_W,
    worldH: WORLD_H,
    solids: [
      { x: 0, y: 0, w: WORLD_W, h: WALL_BOTTOM },
      // The feet of every big thing the visitor has to walk round.
      ...exhibits.map((exhibit) => ({
        x: exhibit.rect.x,
        y: exhibit.footY - 16,
        w: exhibit.rect.w,
        h: 16,
      })),
      { x: AT.boxesWest.x, y: AT.boxesWest.y + 8, w: 24, h: 16 },
      { x: AT.boxesEast.x, y: AT.boxesEast.y + 8, w: 24, h: 16 },
    ],
    spawn: { x: 4, y: 7 },
    entries: { fromHall: { x: 4, y: 7 } },
    exits: [
      {
        id: 'back-to-hall',
        rect: { x: AT.exit.x, y: AT.exit.y, w: 24, h: 40 },
        stand: { x: 4, y: 6 },
        label: copy.archive.exit.label,
        to: 'dark',
        entry: 'fromArchive',
        lines: copy.archive.exit.lines,
        goLabel: copy.archive.exit.backLabel,
        stayLabel: copy.archive.exit.stayLabel,
        stayReply: copy.archive.exit.stayReply,
      },
    ],
    props: buildProps(),
    exhibits,
    lights,
    drawBackdrop,
  };
}

export function createArchive(store: GameStore): Scene {
  return createDarkSpace(buildSpaceDef(), store);
}
