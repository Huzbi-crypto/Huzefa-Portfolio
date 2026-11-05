import { decodeSprite, type Sprite } from '../render/sprite';
import { ACTIVE_PALETTE, PALETTES, setActiveTheme } from './palette';
import { ARCHIVE_SPRITE_GRIDS } from './sprites/archive';
import { CAT_GRIDS } from './sprites/cat';
import { DARK_PROP_GRIDS } from './sprites/darkProps';
import { DARK_TILE_GRIDS } from './sprites/darkTiles';
import { DOOR_GRIDS } from './sprites/door';
import { ENDING_SPRITE_GRIDS } from './sprites/ending';
import { FURNITURE_GRIDS } from './sprites/furniture';
import { SHELF_GRIDS } from './sprites/shelf';
import { TILE_GRIDS } from './sprites/tiles';
import { VISITOR_GRIDS } from './sprites/visitor';
import { WORKSHOP_GRIDS } from './sprites/workshop';

export { ACTIVE_PALETTE, PALETTES };

/**
 * Every sprite as a palette-indexed character grid, flat by name.
 * Naming: `visitor-<up|down|left|right>-<0|1|2>`, `cat-*`, `shelfSpine0..5`,
 * `doorClosed`, `doorOpen`, tiles `floor` `floorAlt` `floorUnderWall` `wall` `wallBase`.
 */
export const SPRITE_GRIDS: Record<string, string[]> = {
  ...VISITOR_GRIDS,
  ...CAT_GRIDS,
  ...TILE_GRIDS,
  ...FURNITURE_GRIDS,
  ...SHELF_GRIDS,
  ...DOOR_GRIDS,
  ...DARK_TILE_GRIDS,
  ...DARK_PROP_GRIDS,
  ...ARCHIVE_SPRITE_GRIDS,
  ...WORKSHOP_GRIDS,
  ...ENDING_SPRITE_GRIDS,
};

/** Animation sequences: frame sprite names in play order. Frames share a size. */
export const ANIMS: Record<string, string[]> = {
  'visitor-down': ['visitor-down-1', 'visitor-down-0', 'visitor-down-2', 'visitor-down-0'],
  'visitor-up': ['visitor-up-1', 'visitor-up-0', 'visitor-up-2', 'visitor-up-0'],
  'visitor-left': ['visitor-left-1', 'visitor-left-0', 'visitor-left-2', 'visitor-left-0'],
  'visitor-right': ['visitor-right-1', 'visitor-right-0', 'visitor-right-2', 'visitor-right-0'],
  'cat-walk': ['cat-walk-0', 'cat-walk-1', 'cat-walk-0', 'cat-walk-3'],
  'cat-sit': ['cat-sitting', 'cat-sitting-1'],
  crt: ['crt', 'crt-1'],
};

/** Decode every grid against one theme's palette. */
export function spritesFor(theme: keyof typeof PALETTES): Record<string, Sprite> {
  const palette = PALETTES[theme];
  const out: Record<string, Sprite> = {};
  for (const [name, rows] of Object.entries(SPRITE_GRIDS)) {
    out[name] = decodeSprite(rows, palette);
  }
  return out;
}

/**
 * The live sprite set. Reassigned by `setGameTheme`, and every scene reads it
 * at draw time, so the canvas repaints in the new palette on the next frame.
 */
export let SPRITES: Record<string, Sprite> = spritesFor('cozy-crt');

/** Switch the game's palette and re-decode every sprite for it. */
export function setGameTheme(theme: keyof typeof PALETTES): void {
  setActiveTheme(theme);
  SPRITES = spritesFor(theme);
}

/**
 * The visitor's sprite for this moment. Walking cycles the three step frames;
 * standing still shows frame 0, except for a short idle beat every few seconds
 * (a hand to the headphones, or the tuft bobbing). Reduced motion never beats.
 */
const WALK_FRAME_MS = 150; // nine 60fps repaints per frame, so the loop never stutters

export function visitorSpriteName(
  facing: string,
  moving: boolean,
  walkMs: number,
  t: number,
  reducedMotion: boolean,
): string {
  if (moving) {
    const frames = ANIMS[`visitor-${facing}`];
    return frames[Math.floor(walkMs / WALK_FRAME_MS) % frames.length];
  }
  const beat = !reducedMotion && t % 7000 > 6300;
  return beat ? `visitor-${facing}-idle` : `visitor-${facing}-0`;
}
