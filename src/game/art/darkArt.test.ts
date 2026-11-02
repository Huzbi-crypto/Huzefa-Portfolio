import { describe, expect, it } from 'vitest';
import { SPRITES } from './index';
import { CHALK_GLYPHS, chalkPixels } from './sprites/darkGlyphs';

const NAMES = [
  'darkFloor', 'darkFloorAlt', 'darkWall', 'darkWallBase',
  'darkExit', 'darkExitGlow', 'darkDoorAjar',
  'darkMonitor', 'darkEyeCenter', 'darkEyeLeft', 'darkEyeRight', 'darkEyeBlink',
  'darkNote0', 'darkNote1', 'darkRouter', 'darkArch',
];

describe('dark art', () => {
  it('has_every_dark_sprite', () => {
    for (const name of NAMES) expect(SPRITES[name], name).toBeDefined();
  });

  it('tiles_are_16_by_16', () => {
    for (const name of ['darkFloor', 'darkFloorAlt', 'darkWall', 'darkWallBase']) {
      expect([SPRITES[name].w, SPRITES[name].h], name).toEqual([16, 16]);
    }
  });

  it('the_door_from_this_side_matches_the_room_door_size', () => {
    expect([SPRITES.darkExit.w, SPRITES.darkExit.h]).toEqual([
      SPRITES.doorClosed.w,
      SPRITES.doorClosed.h,
    ]);
    expect([SPRITES.darkDoorAjar.w, SPRITES.darkDoorAjar.h]).toEqual([
      SPRITES.doorClosed.w,
      SPRITES.doorClosed.h,
    ]);
  });

  it('eye_frames_share_one_size_that_fits_the_monitor_screen', () => {
    const frames = ['darkEyeCenter', 'darkEyeLeft', 'darkEyeRight', 'darkEyeBlink'];
    const first = SPRITES[frames[0]];
    for (const f of frames) expect([SPRITES[f].w, SPRITES[f].h], f).toEqual([first.w, first.h]);
    expect(first.w).toBeLessThan(SPRITES.darkMonitor.w);
    expect(first.h).toBeLessThan(SPRITES.darkMonitor.h);
  });

  it('the_pupil_really_moves_between_frames', () => {
    const differs = (a: string, b: string) =>
      SPRITES[a].pixels.some((p, i) => p !== SPRITES[b].pixels[i]);
    expect(differs('darkEyeCenter', 'darkEyeLeft')).toBe(true);
    expect(differs('darkEyeCenter', 'darkEyeRight')).toBe(true);
    expect(differs('darkEyeCenter', 'darkEyeBlink')).toBe(true);
  });
});

describe('chalk font', () => {
  it('every_glyph_is_3_wide_and_5_tall', () => {
    for (const [ch, rows] of Object.entries(CHALK_GLYPHS)) {
      expect(rows, ch).toHaveLength(5);
      for (const row of rows) expect(row, ch).toHaveLength(3);
    }
  });

  it('covers_every_letter_the_copy_uses', async () => {
    const { copy } = await import('@/game/content/copy');
    for (const line of copy.dark.chalk) {
      for (const ch of line) {
        if (ch !== ' ') expect(CHALK_GLYPHS[ch], `${line}: ${ch}`).toBeDefined();
      }
    }
  });

  it('chalkPixels_lays_text_out_on_a_grid_with_a_gap_between_letters', () => {
    const px = chalkPixels('II');
    expect(px.w).toBe(7); // 3 + 1 gap + 3
    expect(px.h).toBe(5);
    expect(px.points.length).toBeGreaterThan(0);
    for (const p of px.points) {
      expect(Number.isInteger(p.x) && Number.isInteger(p.y)).toBe(true);
    }
  });
});
