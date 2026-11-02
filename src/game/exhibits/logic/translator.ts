import { hashPixel } from './types';

export type Translation = {
  /** One bar per character spoken, so the string visibly carries the words. */
  bars: number[];
  /** The phrase after its trip down the string. Never the same words back. */
  output: string;
};

const LETTERS = 'abcdefghijklmnopqrstuvwxyz';

/**
 * Send a phrase down the tin-can string. Bars are seeded per character and the
 * words come out shifted: deterministic for a seed, but never unchanged, because
 * something is always lost in translation.
 */
export function translate(phrase: string, seed: number): Translation {
  const bars = Array.from(
    { length: Math.max(1, phrase.length) },
    (_, index) => 1 + (hashPixel(seed, index, 1) % 7),
  );

  const shift = 1 + (hashPixel(seed, 3, 5) % 25);
  let changed = false;

  const output = phrase.replace(/[a-z]/gi, (character) => {
    const lower = character.toLowerCase();
    const shifted = LETTERS[(LETTERS.indexOf(lower) + shift) % LETTERS.length];
    changed = true;
    return character === lower ? shifted : shifted.toUpperCase();
  });

  return { bars, output: changed ? output : `${output}?` };
}
