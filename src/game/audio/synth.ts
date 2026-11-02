import { noteFrequency, type Tune, type TuneNote } from './tunes';

export type SfxName = 'step' | 'star' | 'door' | 'blip' | 'open' | 'close';

export const SFX_NAMES: readonly SfxName[] = [
  'step',
  'star',
  'door',
  'blip',
  'open',
  'close',
];

/** The slice of the Web Audio API this game actually uses. */
export type AudioParamLike = {
  value: number;
  setValueAtTime(value: number, startTime: number): void;
  linearRampToValueAtTime(value: number, endTime: number): void;
  exponentialRampToValueAtTime(value: number, endTime: number): void;
  cancelScheduledValues(startTime: number): void;
};

export type AudioNodeLike = {
  connect(node: AudioNodeLike): unknown;
  disconnect(): void;
};

export type GainLike = AudioNodeLike & {
  gain: AudioParamLike;
};

export type OscillatorLike = AudioNodeLike & {
  type: OscillatorType;
  frequency: AudioParamLike;
  start(when?: number): void;
  stop(when?: number): void;
};

export type AudioContextLike = {
  currentTime: number;
  state: AudioContextState;
  destination: AudioNodeLike;
  createGain(): GainLike;
  createOscillator(): OscillatorLike;
  resume(): Promise<void>;
  suspend(): Promise<void>;
  close?(): Promise<void>;
};

export type Synth = {
  /** A one-shot chiptune effect. */
  playSfx(name: SfxName): void;
  /** Start a tune from its beginning, looping until stopped. */
  playMusic(tune: Tune): void;
  stopMusic(): void;
  dispose(): void;
};

type SfxStep = {
  /** Seconds after the effect starts. */
  at: number;
  /** Pitch as a note name, or a raw frequency for sweeps. */
  note: string;
  len: number;
  wave: 'square' | 'triangle';
  gain: number;
  /** Optional slide from this note to `note`. */
  from?: string;
};

const MASTER_GAIN = 0.7;
const MUSIC_GAIN = 0.5;
const ATTACK = 0.008;
const FADE_SECONDS = 0.12;
/** How far ahead of the clock notes are scheduled. */
const LOOKAHEAD = 0.05;

/** Original effects: small, dry, and never loud enough to startle. */
const SFX: Record<SfxName, readonly SfxStep[]> = {
  step: [{ at: 0, note: 'C3', len: 0.045, wave: 'triangle', gain: 0.05 }],
  star: [
    { at: 0, note: 'E5', len: 0.07, wave: 'square', gain: 0.11 },
    { at: 0.07, note: 'A5', len: 0.09, wave: 'square', gain: 0.1 },
    { at: 0.15, note: 'C6', len: 0.16, wave: 'triangle', gain: 0.09 },
  ],
  door: [
    { at: 0, note: 'G3', len: 0.16, wave: 'triangle', gain: 0.09, from: 'D4' },
    { at: 0.12, note: 'C3', len: 0.22, wave: 'triangle', gain: 0.08, from: 'G3' },
  ],
  blip: [{ at: 0, note: 'E5', len: 0.035, wave: 'square', gain: 0.045 }],
  open: [
    { at: 0, note: 'C5', len: 0.06, wave: 'square', gain: 0.07 },
    { at: 0.06, note: 'G5', len: 0.09, wave: 'square', gain: 0.06 },
  ],
  close: [
    { at: 0, note: 'G5', len: 0.06, wave: 'square', gain: 0.06 },
    { at: 0.06, note: 'C5', len: 0.09, wave: 'square', gain: 0.07 },
  ],
};

function secondsPerStep(tune: Tune): number {
  // One step is an eighth note, and there are two eighths per beat.
  return 30 / tune.bpm;
}

export function tuneLengthSeconds(tune: Tune): number {
  return tune.steps * secondsPerStep(tune);
}

export function createSynth(ctx: AudioContextLike): Synth {
  let master: GainLike | null = ctx.createGain();
  master.gain.setValueAtTime(MASTER_GAIN, ctx.currentTime);
  master.connect(ctx.destination);

  let musicGain: GainLike | null = null;
  let notes: OscillatorLike[] = [];
  let loopTimer: ReturnType<typeof setTimeout> | null = null;
  let playing: Tune | null = null;
  let disposed = false;

  function voice(
    target: AudioNodeLike,
    wave: 'square' | 'triangle',
    frequency: number,
    when: number,
    length: number,
    gain: number,
  ): void {
    const oscillator = ctx.createOscillator();
    const envelope = ctx.createGain();

    oscillator.type = wave;
    oscillator.frequency.setValueAtTime(frequency, when);
    envelope.gain.setValueAtTime(0.0001, Math.max(0, when - 0.001));
    envelope.gain.linearRampToValueAtTime(gain, when + ATTACK);
    envelope.gain.linearRampToValueAtTime(0.0001, when + length);

    oscillator.connect(envelope);
    envelope.connect(target);
    oscillator.start(when);
    oscillator.stop(when + length + 0.03);
    notes.push(oscillator);
  }

  function scheduleLoop(tune: Tune): void {
    if (!musicGain) return;
    const stepSeconds = secondsPerStep(tune);
    const start = ctx.currentTime + LOOKAHEAD;

    for (const note of tune.notes) {
      scheduleTuneNote(note, musicGain, start + note.step * stepSeconds, stepSeconds);
    }

    // Schedule the next loop a little before this one runs out.
    const waitMs = Math.max(50, (tuneLengthSeconds(tune) - FADE_SECONDS) * 1000);
    loopTimer = setTimeout(() => {
      loopTimer = null;
      if (!disposed && playing === tune) scheduleLoop(tune);
    }, waitMs);
  }

  function scheduleTuneNote(
    note: TuneNote,
    target: AudioNodeLike,
    when: number,
    stepSeconds: number,
  ): void {
    voice(
      target,
      note.wave,
      noteFrequency(note.note),
      when,
      note.len * stepSeconds,
      note.gain ?? 0.12,
    );
  }

  function silenceMusic(immediate: boolean): void {
    if (loopTimer !== null) {
      clearTimeout(loopTimer);
      loopTimer = null;
    }
    playing = null;

    const now = ctx.currentTime;
    if (musicGain) {
      try {
        musicGain.gain.cancelScheduledValues(now);
        musicGain.gain.setValueAtTime(musicGain.gain.value, now);
        musicGain.gain.linearRampToValueAtTime(0.0001, now + (immediate ? 0.01 : FADE_SECONDS));
      } catch {
        // A context that is already closed has nothing to fade.
      }
    }

    const stopAt = now + (immediate ? 0.01 : FADE_SECONDS);
    for (const note of notes) {
      try {
        note.stop(stopAt);
      } catch {
        // Already stopped by its own scheduled end.
      }
    }
    notes = [];
    musicGain = null;
  }

  return {
    playSfx(name) {
      if (disposed) return;
      const effect = SFX[name];
      const now = ctx.currentTime + 0.01;
      for (const step of effect) {
        const when = now + step.at;
        if (step.from) {
          const oscillator = ctx.createOscillator();
          const envelope = ctx.createGain();
          oscillator.type = step.wave;
          oscillator.frequency.setValueAtTime(noteFrequency(step.from), when);
          oscillator.frequency.linearRampToValueAtTime(noteFrequency(step.note), when + step.len);
          envelope.gain.setValueAtTime(0.0001, when);
          envelope.gain.linearRampToValueAtTime(step.gain, when + ATTACK);
          envelope.gain.linearRampToValueAtTime(0.0001, when + step.len);
          oscillator.connect(envelope);
          if (master) envelope.connect(master);
          oscillator.start(when);
          oscillator.stop(when + step.len + 0.03);
          notes.push(oscillator);
        } else {
          voice(master ?? ctx.destination, step.wave, noteFrequency(step.note), when, step.len, step.gain);
        }
      }
    },

    playMusic(tune) {
      if (disposed) return;
      silenceMusic(false);
      if (!master) return;

      musicGain = ctx.createGain();
      musicGain.gain.setValueAtTime(MUSIC_GAIN, ctx.currentTime);
      musicGain.connect(master);
      playing = tune;
      scheduleLoop(tune);
    },

    stopMusic() {
      if (disposed) return;
      silenceMusic(false);
    },

    dispose() {
      if (disposed) return;
      disposed = true;
      silenceMusic(true);
      master = null;
      try {
        void ctx.close?.().catch(() => undefined);
      } catch {
        // Closing a context is best effort.
      }
    },
  };
}
