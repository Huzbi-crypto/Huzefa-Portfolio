import { describe, expect, it } from 'vitest';
import type { SceneId } from '@/game/scene/types';
import { TUNES, noteFrequency, tuneForScene } from './tunes';

const SCENES: SceneId[] = ['room', 'dark', 'workshop', 'archive', 'observatory', 'nap'];

function signature(tune: { notes: readonly { step: number; len: number; note: string; wave: string }[] }): string {
  return tune.notes.map((n) => `${n.step}:${n.len}:${n.note}:${n.wave}`).join('|');
}

describe('tunes', () => {
  it('every_scene_has_a_tune', () => {
    for (const scene of SCENES) {
      const tune = tuneForScene(scene);
      expect(tune.notes.length).toBeGreaterThan(0);
      expect(tune.steps).toBeGreaterThan(0);
    }

    expect(tuneForScene('room').name).toBe('room');
    expect(tuneForScene('dark').name).toBe('dark');
    expect(tuneForScene('workshop').name).toBe('dark');
    expect(tuneForScene('archive').name).toBe('dark');
    expect(tuneForScene('observatory').name).toBe('dark');
    expect(tuneForScene('nap').name).toBe('ending');
  });

  it('every_tune_loops_cleanly', () => {
    for (const tune of Object.values(TUNES)) {
      expect(tune.bpm).toBeGreaterThan(0);
      for (const note of tune.notes) {
        expect(note.step).toBeGreaterThanOrEqual(0);
        expect(note.len).toBeGreaterThan(0);
        expect(note.step + note.len).toBeLessThanOrEqual(tune.steps);
        expect(noteFrequency(note.note)).toBeGreaterThan(0);
      }
    }
  });

  it('tunes_are_distinct', () => {
    const seen = new Set(Object.values(TUNES).map(signature));
    expect(seen.size).toBe(Object.values(TUNES).length);
  });

  it('note_frequencies_use_concert_pitch', () => {
    expect(noteFrequency('A4')).toBeCloseTo(440, 5);
    expect(noteFrequency('A3')).toBeCloseTo(220, 5);
    expect(noteFrequency('C4')).toBeCloseTo(261.63, 1);
    expect(noteFrequency('C5')).toBeCloseTo(523.25, 1);
  });
});
