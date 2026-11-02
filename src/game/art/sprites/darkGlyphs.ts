/**
 * A tiny 3 by 5 chalk alphabet for the scrawls on the dark world's walls.
 * Each glyph is five rows of three cells; `#` is chalk. Original drawing.
 */
export const CHALK_GLYPHS: Record<string, string[]> = {
  A: ['.#.', '#.#', '###', '#.#', '#.#'],
  B: ['##.', '#.#', '##.', '#.#', '##.'],
  C: ['.##', '#..', '#..', '#..', '.##'],
  D: ['##.', '#.#', '#.#', '#.#', '##.'],
  E: ['###', '#..', '##.', '#..', '###'],
  F: ['###', '#..', '##.', '#..', '#..'],
  G: ['.##', '#..', '#.#', '#.#', '.##'],
  H: ['#.#', '#.#', '###', '#.#', '#.#'],
  I: ['###', '.#.', '.#.', '.#.', '###'],
  J: ['..#', '..#', '..#', '#.#', '.#.'],
  K: ['#.#', '#.#', '##.', '#.#', '#.#'],
  L: ['#..', '#..', '#..', '#..', '###'],
  M: ['#.#', '###', '###', '#.#', '#.#'],
  N: ['##.', '#.#', '#.#', '#.#', '#.#'],
  O: ['###', '#.#', '#.#', '#.#', '###'],
  P: ['##.', '#.#', '##.', '#..', '#..'],
  Q: ['###', '#.#', '#.#', '###', '..#'],
  R: ['##.', '#.#', '##.', '#.#', '#.#'],
  S: ['.##', '#..', '.#.', '..#', '##.'],
  T: ['###', '.#.', '.#.', '.#.', '.#.'],
  U: ['#.#', '#.#', '#.#', '#.#', '###'],
  V: ['#.#', '#.#', '#.#', '#.#', '.#.'],
  W: ['#.#', '#.#', '###', '###', '#.#'],
  X: ['#.#', '#.#', '.#.', '#.#', '#.#'],
  Y: ['#.#', '#.#', '.#.', '.#.', '.#.'],
  Z: ['###', '..#', '.#.', '#..', '###'],
  '2': ['##.', '..#', '.#.', '#..', '###'],
  '>': ['#..', '.#.', '..#', '.#.', '#..'],
  '.': ['...', '...', '...', '...', '.#.'],
  '!': ['.#.', '.#.', '.#.', '...', '.#.'],
};

export const CHALK_GAP = 1;

/** Where every chalk pixel of `text` goes, with the width and height of the line. */
export function chalkPixels(text: string): {
  w: number;
  h: number;
  points: { x: number; y: number }[];
} {
  const points: { x: number; y: number }[] = [];
  let cursor = 0;
  for (const ch of text.toUpperCase()) {
    const glyph = CHALK_GLYPHS[ch];
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
