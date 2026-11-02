import { PALETTES, SPRITES } from '@/game/art';
import { FRAME, FRAME_PICTURE, framePictureLuminance } from '@/game/art/sprites/archive';
import { RAMP_GLYPHS } from '@/game/art/sprites/archiveGlyphs';
import { copy } from '@/game/content/copy';
import { drawSprite } from '@/game/render/sprite';
import { TILE } from '@/game/world/grid';
import { asciifyCell } from './logic/asciify';
import { tryExhibit } from './exhibit';
import { createLantern, projectFor, type ArchiveExhibit, type At } from './archiveKit';

const COLORS = PALETTES['cozy-crt'];
const PROJECT_ID = 'ascii-art-tui';
/** Picture pixels per character: each ASCII glyph is three pixels square. */
const CELL = 3;
/** How far from the lantern's centre a cell still turns into letters, in world pixels. */
export const ASCII_REACH = 15;

const PICTURE = framePictureLuminance();
const COLS = FRAME_PICTURE.w / CELL;
const ROWS = FRAME_PICTURE.h / CELL;

export type AsciiCell = { x: number; y: number; ch: string };

/**
 * The cells of the picture the lantern is lighting, turned into characters.
 * Only these convert; the rest of the cat stays a picture. `origin` is where
 * the picture's top-left sits in the world.
 */
export function litAsciiCells(
  origin: At,
  lantern: { x: number; y: number },
): AsciiCell[] {
  const cells: AsciiCell[] = [];
  for (let cy = 0; cy < ROWS; cy += 1) {
    for (let cx = 0; cx < COLS; cx += 1) {
      const x = origin.x + cx * CELL;
      const y = origin.y + cy * CELL;
      const dx = x + CELL / 2 - lantern.x;
      const dy = y + CELL / 2 - lantern.y;
      if (dx * dx + dy * dy > ASCII_REACH * ASCII_REACH) continue;
      cells.push({ x, y, ch: asciifyCell(PICTURE, cx * CELL, cy * CELL, CELL) });
    }
  }
  return cells;
}

/**
 * A framed picture of the cat on the wall. The lantern turns whatever it
 * lights into ASCII characters, and only that: lantern position comes from the
 * shared lighting rule, so a keyboard visitor's lantern works just like a mouse.
 */
export function createAsciiArt(at: At): ArchiveExhibit {
  const project = projectFor(PROJECT_ID);
  const lantern = createLantern();
  const origin = { x: at.x + FRAME_PICTURE.x, y: at.y + FRAME_PICTURE.y };

  return {
    id: PROJECT_ID,
    projectId: PROJECT_ID,
    rect: { x: at.x, y: at.y, w: FRAME.w, h: FRAME.h },
    stand: { x: Math.floor((at.x + FRAME.w / 2) / TILE), y: 6 },
    footY: 48,
    label: copy.archive.ascii.label,

    update() {
      // The picture never moves; only the light does.
    },

    draw(g) {
      drawSprite(g, SPRITES.archFrame, at.x, at.y);
    },

    glow(g, ctx) {
      for (const cell of litAsciiCells(origin, lantern(ctx))) {
        g.fillStyle = COLORS.a;
        g.fillRect(cell.x, cell.y, CELL, CELL);
        g.fillStyle = COLORS.t;
        RAMP_GLYPHS[cell.ch].forEach((row, gy) => {
          for (let gx = 0; gx < row.length; gx += 1) {
            if (row[gx] === '#') g.fillRect(cell.x + gx, cell.y + gy, 1, 1);
          }
        });
      }
    },

    async use(api) {
      await api.store.say([...copy.archive.ascii.lines]);
      await tryExhibit(api, project.id);
    },
  };
}
