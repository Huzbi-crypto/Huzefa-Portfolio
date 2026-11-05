import { describe, expect, it } from 'vitest';
import { decodeSprite } from '../render/sprite';
import { ANIMS, PALETTES, SPRITE_GRIDS, SPRITES, visitorSpriteName } from './index';

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

  it('visitor_carries_no_paper_prop_in_any_frame', () => {
    const paper = new Set(['p', 'q']);
    for (const [name, rows] of Object.entries(SPRITE_GRIDS)) {
      if (!name.startsWith('visitor-')) continue;
      const hasPaper = rows.some((row) => [...row].some((c) => paper.has(c)));
      expect(hasPaper, name).toBe(false);
    }
  });

  it('visitor_side_profile_has_a_subtle_nose_instead_of_a_beak', () => {
    const rows = SPRITE_GRIDS['visitor-right-0'];
    const rightEdge = (y: number): number =>
      Math.max(...[...rows[y]].map((c, x) => (c === '.' ? -1 : x)));
    // The forehead, eye, nose and mouth rows share one face plane: nothing pokes out.
    const edges = [5, 6, 7, 8, 9].map(rightEdge);
    expect(new Set(edges).size, `profile edges ${edges.join(',')}`).toBe(1);
    // A one-pixel shadow at the face edge keeps the nose readable.
    expect(rows[8][12], 'nose shadow').toBe('w');
  });

  it('visitor_has_an_idle_beat_in_every_direction_and_a_walk_that_moves', () => {
    for (const dir of ['up', 'down', 'left', 'right']) {
      const idle = SPRITES[`visitor-${dir}-idle`];
      expect([idle.w, idle.h], dir).toEqual([16, 24]);
      expect(idle.pixels).not.toEqual(SPRITES[`visitor-${dir}-0`].pixels);
      expect(SPRITES[`visitor-${dir}-1`].pixels).not.toEqual(SPRITES[`visitor-${dir}-2`].pixels);
    }
  });

  it('visitor_sprite_name_beats_only_when_standing_and_motion_is_allowed', () => {
    expect(visitorSpriteName('down', false, 0, 6500, false)).toBe('visitor-down-idle');
    expect(visitorSpriteName('down', false, 0, 6500, true)).toBe('visitor-down-0');
    expect(visitorSpriteName('down', false, 0, 100, false)).toBe('visitor-down-0');
    expect(visitorSpriteName('left', true, 150, 6500, false)).toBe('visitor-left-0');
  });

  it('visitor_walk_holds_each_frame_for_150ms_so_60fps_never_stutters', () => {
    const at = (ms: number): string => visitorSpriteName('down', true, ms, 0, false);
    expect([0, 149, 150, 299, 300, 449, 450, 599, 600].map(at)).toEqual([
      'visitor-down-1', 'visitor-down-1',
      'visitor-down-0', 'visitor-down-0',
      'visitor-down-2', 'visitor-down-2',
      'visitor-down-0', 'visitor-down-0',
      'visitor-down-1',
    ]);
  });

  it('visitor_shoulders_and_sleeves_stay_planted_between_walk_frames', () => {
    for (const dir of ['down', 'up', 'left', 'right']) {
      const frames = ANIMS[`visitor-${dir}`];
      const side = dir === 'left' || dir === 'right';
      const band = side ? [12, 13, 14, 15, 16] : [12, 13, 14];
      const baseline = band.map((y) => SPRITE_GRIDS[frames[0]][y]);
      for (const name of frames.slice(1)) {
        expect(band.map((y) => SPRITE_GRIDS[name][y]), `${dir}/${name}`).toEqual(baseline);
      }
    }
  });

  it('visitor_shoes_stay_attached_to_the_legs_in_every_frame', () => {
    for (const [name, rows] of Object.entries(SPRITE_GRIDS)) {
      if (!name.startsWith('visitor-')) continue;
      for (let y = 20; y < 24; y += 1) {
        [...rows[y]].forEach((c, x) => {
          if (c === 'C') expect(rows[y - 1][x], `${name} shoe at ${x},${y}`).not.toBe('.');
        });
      }
    }
  });

  it('visitor_idle_beat_blinks_and_bobs_without_moving_the_body', () => {
    expect(SPRITE_GRIDS['visitor-down-idle'][7][6]).toBe('w');
    expect(SPRITE_GRIDS['visitor-down-idle'][7][9]).toBe('w');
    expect(SPRITE_GRIDS['visitor-right-idle'][7][11]).toBe('w');
    expect(SPRITE_GRIDS['visitor-down-idle'].slice(8)).toEqual(SPRITE_GRIDS['visitor-down-0'].slice(8));
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
