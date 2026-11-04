import { describe, expect, it } from 'vitest';
import { PALETTES } from './palette';

const THEMES = Object.keys(PALETTES) as (keyof typeof PALETTES)[];

describe('themes', () => {
  it('each_theme_has_all_keys_and_at_most_32_colors', () => {
    const keySet = new Set(Object.keys(PALETTES['cozy-crt']));

    for (const theme of THEMES) {
      const palette = PALETTES[theme];
      expect(Object.keys(palette).sort(), theme).toEqual([...keySet].sort());

      const colors = new Set(Object.values(palette).map((color) => color.toLowerCase()));
      expect(colors.size, theme).toBeLessThanOrEqual(32);
      expect(colors.size, `${theme} should use distinct colours`).toBe(
        Object.keys(palette).length,
      );
    }
  });

  it('warm_apartment_is_its_own_palette', () => {
    const cozy = PALETTES['cozy-crt'];
    const warm = PALETTES['warm-apartment'];
    for (const key of Object.keys(cozy)) {
      expect(warm[key], `warm-apartment ${key}`).not.toBe(cozy[key]);
    }
  });

  it('moonlit_terminal_is_its_own_palette', () => {
    const cozy = PALETTES['cozy-crt'];
    const moonlit = PALETTES['moonlit-terminal'];
    for (const key of Object.keys(cozy)) {
      expect(moonlit[key], `moonlit-terminal ${key}`).not.toBe(cozy[key]);
    }
  });
});
