import { describe, expect, it } from 'vitest';
import { translate } from './translator';

describe('translate', () => {
  it('bars_track_phrase_length', () => {
    expect(translate('', 1).bars).toHaveLength(1);
    expect(translate('hi', 1).bars).toHaveLength(2);
    expect(translate('hello there', 1).bars).toHaveLength(11);
    expect(
      translate('hello there', 1).bars.every((bar) => bar > 0 && bar <= 8),
    ).toBe(true);
  });

  it('output_always_differs_from_input', () => {
    const phrases = ['hello', 'a', '', 'x y z', '123', '...', 'HELLO', 'Huzbi'];

    for (let seed = 0; seed < 50; seed += 1) {
      for (const phrase of phrases) {
        const { output } = translate(phrase, seed);
        expect(output).not.toBe(phrase);
        expect(output.length).toBeGreaterThan(0);
      }
    }
  });

  it('same_seed_same_output', () => {
    for (const seed of [0, 7, 12345]) {
      expect(translate('hello there', seed)).toEqual(translate('hello there', seed));
    }
  });
});
