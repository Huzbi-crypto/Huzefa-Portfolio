import { CHALK_GAP, CHALK_GLYPHS } from './darkGlyphs';

/**
 * Letters for the Archive's tiny screens: the hall's chalk alphabet plus the
 * few marks a terminal needs. Each glyph is three cells wide, `#` is lit.
 */
export const SCREEN_GLYPHS: Record<string, string[]> = {
  ...CHALK_GLYPHS,
  '?': ['##.', '..#', '.#.', '...', '.#.'],
  _: ['...', '...', '...', '...', '###'],
  '-': ['...', '...', '###', '...', '...'],
  ':': ['...', '.#.', '...', '.#.', '...'],
  ' ': ['...', '...', '...', '...', '...'],
};

/**
 * Pixels for a line of screen text, the width and a height of five. Letters
 * the alphabet lacks are left blank, so a stray character never throws.
 */
export function screenTextPixels(text: string): {
  w: number;
  h: number;
  points: { x: number; y: number }[];
} {
  const points: { x: number; y: number }[] = [];
  let cursor = 0;
  for (const ch of text.toUpperCase()) {
    const glyph = SCREEN_GLYPHS[ch];
    if (glyph) {
      glyph.forEach((row, y) => {
        for (let x = 0; x < row.length; x += 1) {
          if (row[x] === '#') points.push({ x: cursor + x, y });
        }
      });
    }
    cursor += 3 + CHALK_GAP;
  }
  return { w: Math.max(0, cursor - CHALK_GAP), h: 5, points };
}

/**
 * The ASCII ramp from the logic module, one 3 by 3 picture per character,
 * lightest to heaviest, so a lit cell of the framed cat really reads as the
 * character it was turned into.
 */
export const RAMP_GLYPHS: Record<string, string[]> = {
  ' ': ['...', '...', '...'],
  '.': ['...', '...', '.#.'],
  ':': ['.#.', '...', '.#.'],
  '-': ['...', '###', '...'],
  '=': ['.#.', '#.#', '.#.'],
  '+': ['.#.', '###', '.#.'],
  '*': ['#.#', '###', '.#.'],
  '#': ['###', '.#.', '###'],
  '%': ['###', '#.#', '###'],
  '@': ['###', '###', '###'],
};
