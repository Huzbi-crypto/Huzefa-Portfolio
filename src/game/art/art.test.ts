import { describe, expect, it } from 'vitest';
import { decodeSprite } from '../render/sprite';
import { ANIMS, PALETTES, SPRITE_GRIDS, SPRITES } from './index';

const THEMES = Object.keys(PALETTES) as (keyof typeof PALETTES)[];

describe('palette', () => {
  it('palette_has_at_most_32_colors', () => {
    for (const theme of THEMES) {
      const colors = new Set(Object.values(PALETTES[theme]));
      expect(colors.size, theme).toBeLessThanOrEqual(32);
      expect(Object.keys(PALETTES[theme]).length, theme).toBeLessThanOrEqual(32);
    }
  });

  it('all_themes_share_keys', () => {
    const keys = Object.keys(PALETTES['cozy-crt']).sort();
    for (const theme of THEMES) {
      expect(Object.keys(PALETTES[theme]).sort(), theme).toEqual(keys);
    }
  });

  it('palette_keys_are_single_characters_and_never_dot', () => {
    for (const key of Object.keys(PALETTES['cozy-crt'])) {
      expect(key).toHaveLength(1);
      expect(key).not.toBe('.');
    }
  });
});

describe('sprites', () => {
  it('all_sprites_decode', () => {
    for (const [name, rows] of Object.entries(SPRITE_GRIDS)) {
      expect(() => decodeSprite(rows, PALETTES['cozy-crt']), name).not.toThrow();
      expect(SPRITES[name], name).toBeDefined();
    }
  });

  it('every_color_comes_from_palette', () => {
    const palette = new Set(Object.values(PALETTES['cozy-crt']));
    for (const [name, sprite] of Object.entries(SPRITES)) {
      for (const px of sprite.pixels) {
        if (px !== null) expect(palette.has(px), name).toBe(true);
      }
    }
  });

  it('includes_every_planned_sprite', () => {
    const required = [
      'desk', 'crt', 'tea', 'note', 'sofa', 'rug', 'window', 'lamp',
      'doorClosed', 'doorOpen', 'floor', 'floorAlt', 'wall', 'wallBase',
      'shelf', 'shelfSpine0', 'shelfSpine1', 'shelfSpine2', 'shelfSpine3',
      'cat-sleeping', 'cat-sitting', 'cat-walk-0',
    ];
    for (const name of required) expect(SPRITES[name], name).toBeDefined();
  });

  it('visitor_has_three_walk_frames_in_each_direction', () => {
    for (const dir of ['up', 'down', 'left', 'right']) {
      const frames = ANIMS[`visitor-${dir}`];
      expect(frames, dir).toBeDefined();
      expect(new Set(frames).size).toBeGreaterThanOrEqual(3);
    }
  });

  it('anim_frames_share_one_size', () => {
    for (const [anim, frames] of Object.entries(ANIMS)) {
      const first = SPRITES[frames[0]];
      for (const f of frames) {
        expect(SPRITES[f], `${anim}/${f}`).toBeDefined();
        expect([SPRITES[f].w, SPRITES[f].h], `${anim}/${f}`).toEqual([first.w, first.h]);
      }
    }
  });

  it('visitor_is_about_16_by_24', () => {
    const s = SPRITES['visitor-down-0'];
    expect([s.w, s.h]).toEqual([16, 24]);
  });

  it('every_sprite_has_visible_pixels', () => {
    for (const [name, sprite] of Object.entries(SPRITES)) {
      expect(sprite.pixels.some((p) => p !== null), name).toBe(true);
    }
  });

  it('floor_tiles_read_as_calm_boards', () => {
    for (const name of ['floor', 'floorAlt']) {
      const px = SPRITES[name].pixels;
      const counts = new Map<string | null, number>();
      for (const p of px) counts.set(p, (counts.get(p) ?? 0) + 1);
      const top = Math.max(...counts.values());
      expect(counts.size, name).toBeLessThanOrEqual(3);
      expect(top / px.length, name).toBeGreaterThanOrEqual(0.7);
    }
  });
});
