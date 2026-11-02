import { describe, expect, it } from 'vitest';
import { FLAWS, PORTRAITS } from './logic/diffusion';
import { applyFlaw, portraitGrid, PORTRAIT_SIZE, toneKey } from './aiAnime';

describe('ai-anime portraits', () => {
  it('every_portrait_is_a_square_picture_with_real_contrast', () => {
    for (const id of PORTRAITS) {
      const grid = portraitGrid(id);
      expect([grid.w, grid.h], id).toEqual([PORTRAIT_SIZE, PORTRAIT_SIZE]);
      expect(grid.pixels).toHaveLength(PORTRAIT_SIZE * PORTRAIT_SIZE);
      const tones = new Set(grid.pixels.map(toneKey));
      expect(tones.size, id).toBeGreaterThanOrEqual(3);
      const ink = grid.pixels.filter((v) => toneKey(v) === 'a').length / grid.pixels.length;
      expect(ink, id).toBeGreaterThan(0.04);
      expect(ink, id).toBeLessThan(0.4);
    }
  });

  it('the_three_portraits_are_different_pictures', () => {
    const [a, b, c] = PORTRAITS.map((id) => portraitGrid(id).pixels.join());
    expect(new Set([a, b, c]).size).toBe(3);
  });

  it('every_flaw_visibly_changes_every_portrait', () => {
    for (const id of PORTRAITS) {
      const base = portraitGrid(id);
      for (const flaw of FLAWS) {
        const flawed = applyFlaw(base, flaw);
        const changed = flawed.pixels.filter((v, i) => v !== base.pixels[i]).length;
        expect(changed, `${id} with ${flaw}`).toBeGreaterThanOrEqual(6);
      }
    }
  });

  it('flaws_leave_the_original_grid_alone', () => {
    const base = portraitGrid(PORTRAITS[0]);
    const before = [...base.pixels];
    applyFlaw(base, FLAWS[0]);
    expect(base.pixels).toEqual(before);
  });

  it('tones_map_to_four_palette_keys_and_clamp', () => {
    const keys = new Set([0, 0.3, 0.6, 0.9, -5, 9, Number.NaN].map(toneKey));
    expect(keys.size).toBe(4);
    for (const key of keys) expect(key).toHaveLength(1);
  });
});
