import { describe, expect, it } from 'vitest';
import { decodeSprite } from './sprite';

const PALETTE = {
  a: '#111111',
  b: '#eeeeee',
  c: '#00ff00',
};

describe('decodeSprite', () => {
  it('decodes_rows', () => {
    expect(decodeSprite(['ab', 'ba'], PALETTE)).toEqual({
      w: 2,
      h: 2,
      pixels: ['#111111', '#eeeeee', '#eeeeee', '#111111'],
    });
  });

  it('dot_is_transparent', () => {
    expect(decodeSprite(['a.', '.b'], PALETTE).pixels).toEqual([
      '#111111',
      null,
      null,
      '#eeeeee',
    ]);
  });

  it('throws_on_uneven_rows', () => {
    expect(() => decodeSprite(['ab', 'abc'], PALETTE)).toThrow();
  });

  it('throws_on_unknown_character', () => {
    expect(() => decodeSprite(['ax'], PALETTE)).toThrow();
  });
});
