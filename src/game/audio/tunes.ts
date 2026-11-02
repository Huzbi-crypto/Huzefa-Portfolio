import type { SceneId } from '@/game/scene/types';

/** The two chip voices this game owns: a bright square and a soft triangle. */
export type Wave = 'square' | 'triangle';

/** Each place has one tune. The dark spaces share theirs. */
export type TuneName = 'room' | 'dark' | 'ending';

export type TuneNote = {
  /** Position in the loop, counting eighth notes from zero. */
  step: number;
  /** Length in eighth notes. */
  len: number;
  /** Scientific pitch name, such as `A4` or `F#3`. */
  note: string;
  wave: Wave;
  /** Relative loudness; the melody defaults louder than the bass. */
  gain?: number;
};

export type Tune = {
  name: TuneName;
  /** Beats per minute. One step is an eighth note. */
  bpm: number;
  /** Total length of the loop in eighth notes. */
  steps: number;
  notes: readonly TuneNote[];
};

const SEMITONES: Record<string, number> = {
  C: 0,
  'C#': 1,
  Db: 1,
  D: 2,
  'D#': 3,
  Eb: 3,
  E: 4,
  F: 5,
  'F#': 6,
  Gb: 6,
  G: 7,
  'G#': 8,
  Ab: 8,
  A: 9,
  'A#': 10,
  Bb: 10,
  B: 11,
};

/** Equal-tempered pitch, with A4 at 440 Hz. */
export function noteFrequency(note: string): number {
  const match = /^([A-G](?:#|b)?)(-?\d+)$/.exec(note);
  const semitone = match ? SEMITONES[match[1]] : undefined;
  if (!match || semitone === undefined) throw new Error(`Unknown note: ${note}`);

  const midi = (Number(match[2]) + 1) * 12 + semitone;
  return 440 * 2 ** ((midi - 69) / 12);
}

/**
 * Original tunes written for this game. They are deliberately short loops:
 * a warm room melody, something sparse for the dark, and a lullaby for the end.
 * Every note lives here so Huzbi can hum along or edit the tune in one place.
 */
export const TUNES: Record<TuneName, Tune> = {
  room: {
    name: 'room',
    bpm: 92,
    steps: 32,
    notes: [
      // A small tune you might hum while making tea at 2 AM.
      { step: 0, len: 2, note: 'E4', wave: 'square' },
      { step: 2, len: 2, note: 'G4', wave: 'square' },
      { step: 4, len: 1, note: 'A4', wave: 'square' },
      { step: 5, len: 1, note: 'G4', wave: 'square' },
      { step: 6, len: 2, note: 'E4', wave: 'square' },
      { step: 8, len: 2, note: 'D4', wave: 'square' },
      { step: 10, len: 2, note: 'E4', wave: 'square' },
      { step: 12, len: 4, note: 'G4', wave: 'square' },
      { step: 16, len: 2, note: 'A4', wave: 'square' },
      { step: 18, len: 2, note: 'G4', wave: 'square' },
      { step: 20, len: 2, note: 'E4', wave: 'square' },
      { step: 22, len: 2, note: 'D4', wave: 'square' },
      { step: 24, len: 2, note: 'C4', wave: 'square' },
      { step: 26, len: 2, note: 'D4', wave: 'square' },
      { step: 28, len: 4, note: 'E4', wave: 'square' },

      { step: 0, len: 4, note: 'C3', wave: 'triangle', gain: 0.11 },
      { step: 4, len: 4, note: 'G3', wave: 'triangle', gain: 0.11 },
      { step: 8, len: 4, note: 'A2', wave: 'triangle', gain: 0.11 },
      { step: 12, len: 4, note: 'E3', wave: 'triangle', gain: 0.11 },
      { step: 16, len: 4, note: 'F2', wave: 'triangle', gain: 0.11 },
      { step: 20, len: 4, note: 'C3', wave: 'triangle', gain: 0.11 },
      { step: 24, len: 4, note: 'G3', wave: 'triangle', gain: 0.11 },
      { step: 28, len: 4, note: 'C3', wave: 'triangle', gain: 0.11 },
    ],
  },

  dark: {
    name: 'dark',
    bpm: 60,
    steps: 32,
    notes: [
      // Long gaps on purpose. The dark should not fill every silence.
      { step: 2, len: 2, note: 'A4', wave: 'triangle', gain: 0.08 },
      { step: 7, len: 1, note: 'C5', wave: 'triangle', gain: 0.06 },
      { step: 14, len: 2, note: 'B4', wave: 'triangle', gain: 0.07 },
      { step: 20, len: 2, note: 'E4', wave: 'triangle', gain: 0.07 },
      { step: 27, len: 2, note: 'A4', wave: 'triangle', gain: 0.06 },

      { step: 0, len: 8, note: 'A2', wave: 'triangle', gain: 0.09 },
      { step: 8, len: 8, note: 'E3', wave: 'triangle', gain: 0.07 },
      { step: 16, len: 8, note: 'F2', wave: 'triangle', gain: 0.09 },
      { step: 24, len: 8, note: 'E3', wave: 'triangle', gain: 0.07 },
    ],
  },

  ending: {
    name: 'ending',
    bpm: 66,
    steps: 24,
    notes: [
      // A lazy lullaby, for someone asleep under a manga.
      { step: 0, len: 3, note: 'F4', wave: 'square', gain: 0.12 },
      { step: 3, len: 1, note: 'A4', wave: 'square', gain: 0.1 },
      { step: 4, len: 4, note: 'C5', wave: 'square', gain: 0.12 },
      { step: 8, len: 2, note: 'A4', wave: 'square', gain: 0.1 },
      { step: 10, len: 2, note: 'F4', wave: 'square', gain: 0.1 },
      { step: 12, len: 3, note: 'G4', wave: 'square', gain: 0.11 },
      { step: 15, len: 1, note: 'E4', wave: 'square', gain: 0.1 },
      { step: 16, len: 4, note: 'D4', wave: 'square', gain: 0.11 },
      { step: 20, len: 4, note: 'C4', wave: 'square', gain: 0.1 },

      { step: 0, len: 6, note: 'F2', wave: 'triangle', gain: 0.09 },
      { step: 6, len: 6, note: 'C3', wave: 'triangle', gain: 0.08 },
      { step: 12, len: 6, note: 'D3', wave: 'triangle', gain: 0.08 },
      { step: 18, len: 6, note: 'Bb2', wave: 'triangle', gain: 0.09 },
    ],
  },
};

/** The room is cozy, the dark spaces are quiet, and the nap room is the ending. */
export function tuneForScene(id: SceneId): Tune {
  if (id === 'room') return TUNES.room;
  if (id === 'nap') return TUNES.ending;
  return TUNES.dark;
}
