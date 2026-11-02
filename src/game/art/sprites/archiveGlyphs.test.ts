import { describe, expect, it } from 'vitest';
import { copy } from '@/game/content/copy';
import { RAMP } from '@/game/exhibits/logic/asciify';
import { RAMP_GLYPHS, SCREEN_GLYPHS, screenTextPixels } from './archiveGlyphs';

describe('archive glyphs', () => {
  it('every_screen_letter_has_a_glyph', () => {
    const { screenIdle, screenReply, screenUnknown } = copy.archive.term;
    for (const text of [screenIdle, screenUnknown, ...Object.values(screenReply)]) {
      for (const ch of text.toUpperCase()) {
        expect(SCREEN_GLYPHS[ch], `letter ${ch} in ${text}`).toBeDefined();
      }
    }
  });

  it('every_ramp_character_has_a_three_by_three_picture', () => {
    for (const ch of RAMP) {
      const glyph = RAMP_GLYPHS[ch];
      expect(glyph, `char "${ch}"`).toBeDefined();
      expect(glyph).toHaveLength(3);
      for (const row of glyph) expect(row).toHaveLength(3);
    }
  });

  it('heavier_ramp_characters_light_more_pixels', () => {
    const lit = (ch: string) => RAMP_GLYPHS[ch].join('').split('#').length - 1;
    const counts = [...RAMP].map(lit);
    for (let i = 1; i < counts.length; i += 1) {
      expect(counts[i], `step ${i}`).toBeGreaterThanOrEqual(counts[i - 1]);
    }
  });

  it('unknown_letters_are_skipped_not_thrown', () => {
    expect(() => screenTextPixels('a~b')).not.toThrow();
    expect(screenTextPixels('a~b').w).toBe(11);
  });
});
