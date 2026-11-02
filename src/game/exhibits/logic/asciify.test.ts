import { describe, expect, it } from 'vitest';
import { RAMP, asciifyCell, luminanceToChar } from './asciify';
import type { PixelGrid } from './types';

function grid(w: number, h: number, paint: (x: number, y: number) => number): PixelGrid {
  const pixels: number[] = [];
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) pixels.push(paint(x, y));
  }
  return { w, h, pixels };
}

describe('luminanceToChar', () => {
  it('dark_maps_to_space', () => {
    expect(luminanceToChar(0)).toBe(' ');
    expect(luminanceToChar(-3)).toBe(' ');
    expect(luminanceToChar(Number.NaN)).toBe(' ');
  });

  it('bright_maps_to_dense_char', () => {
    expect(luminanceToChar(1)).toBe('@');
    expect(RAMP.indexOf(luminanceToChar(0.9))).toBeGreaterThanOrEqual(
      RAMP.length - 2,
    );
    expect(RAMP.indexOf(luminanceToChar(0.6))).toBeGreaterThan(
      RAMP.indexOf(luminanceToChar(0.2)),
    );
  });
});

describe('asciifyCell', () => {
  it('out_of_range_clamps', () => {
    const picture = grid(2, 2, (x, y) => (x === 1 && y === 1 ? 0 : 1));

    expect(asciifyCell(picture, -10, -10, 1)).toBe(luminanceToChar(1));
    expect(asciifyCell(picture, 99, 99, 1)).toBe(luminanceToChar(0));
    expect(asciifyCell(picture, -10, -10, 1)).toBe(asciifyCell(picture, 0, 0, 1));
    expect(asciifyCell(picture, 99, 99, 1)).toBe(asciifyCell(picture, 1, 1, 1));
    expect(asciifyCell(picture, 0, 0, 2)).toBe(luminanceToChar(0.75));
  });

  it('a_cell_reads_its_whole_block', () => {
    const half = grid(2, 1, (x) => (x === 0 ? 1 : 0));
    const full = grid(2, 1, () => 1);

    expect(asciifyCell(half, 0, 0, 2)).toBe(luminanceToChar(0.5));
    expect(asciifyCell(full, 0, 0, 2)).toBe(luminanceToChar(1));
    expect(asciifyCell(half, 0, 0, 1)).toBe(luminanceToChar(1));
  });

  it('an_empty_picture_is_blank', () => {
    expect(asciifyCell({ w: 0, h: 0, pixels: [] }, 0, 0, 1)).toBe(' ');
  });
});
