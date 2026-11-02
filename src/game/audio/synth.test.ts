import { afterEach, describe, expect, it, vi } from 'vitest';
import { FakeAudioContext } from './fakeAudio';
import { SFX_NAMES, createSynth } from './synth';
import { TUNES } from './tunes';

afterEach(() => {
  vi.useRealTimers();
});

describe('synth', () => {
  it('each_effect_makes_a_sound', () => {
    const ctx = new FakeAudioContext();
    const synth = createSynth(ctx);

    for (const name of SFX_NAMES) synth.playSfx(name);

    expect(ctx.oscillators.length).toBeGreaterThanOrEqual(SFX_NAMES.length);
    for (const oscillator of ctx.oscillators) {
      expect(oscillator.startedAt).toHaveLength(1);
      expect(['square', 'triangle']).toContain(oscillator.type);
    }
    synth.dispose();
  });

  it('music_schedules_notes_and_repeats', () => {
    vi.useFakeTimers();
    const ctx = new FakeAudioContext();
    const synth = createSynth(ctx);

    synth.playMusic(TUNES.room);
    const firstLoop = ctx.oscillators.length;
    expect(firstLoop).toBe(TUNES.room.notes.length);

    vi.advanceTimersByTime(12000);
    expect(ctx.oscillators.length).toBeGreaterThan(firstLoop);

    synth.dispose();
  });

  it('stopping_music_stops_its_notes', () => {
    const ctx = new FakeAudioContext();
    const synth = createSynth(ctx);
    synth.playMusic(TUNES.dark);
    const notes = [...ctx.oscillators];

    synth.stopMusic();

    expect(notes.length).toBeGreaterThan(0);
    for (const note of notes) expect(note.stoppedAt.length).toBeGreaterThan(0);
    synth.dispose();
  });

  it('dispose_silences_everything_and_closes_the_context', () => {
    const ctx = new FakeAudioContext();
    const synth = createSynth(ctx);
    synth.playMusic(TUNES.ending);
    synth.playSfx('star');

    synth.dispose();

    expect(ctx.closeCalls).toBe(1);
    expect(ctx.state).toBe('closed');
  });
});
