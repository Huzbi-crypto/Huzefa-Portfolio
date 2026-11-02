import type {
  AudioContextLike,
  AudioParamLike,
  GainLike,
  OscillatorLike,
} from './synth';

/**
 * A tiny Web Audio stand-in for unit tests. It records every node and every
 * scheduled value, so tests can assert on the sound without making any.
 * Nothing in the app imports this file.
 */

export type ParamEvent = {
  kind: 'set' | 'linear' | 'exponential' | 'cancel';
  value: number;
  time: number;
};

export class FakeParam implements AudioParamLike {
  value = 0;
  events: ParamEvent[] = [];

  setValueAtTime(value: number, time: number): void {
    this.value = value;
    this.events.push({ kind: 'set', value, time });
  }

  linearRampToValueAtTime(value: number, time: number): void {
    this.value = value;
    this.events.push({ kind: 'linear', value, time });
  }

  exponentialRampToValueAtTime(value: number, time: number): void {
    if (value <= 0) throw new Error('exponential ramps need a positive target');
    this.value = value;
    this.events.push({ kind: 'exponential', value, time });
  }

  cancelScheduledValues(time: number): void {
    this.events.push({ kind: 'cancel', value: 0, time });
  }
}

export class FakeNode {
  targets: FakeNode[] = [];

  connect(node: FakeNode): FakeNode {
    this.targets.push(node);
    return node;
  }

  disconnect(): void {
    this.targets = [];
  }
}

export class FakeGain extends FakeNode implements GainLike {
  gain = new FakeParam();
}

export class FakeOscillator extends FakeNode implements OscillatorLike {
  type: OscillatorType = 'square';
  frequency = new FakeParam();
  startedAt: number[] = [];
  stoppedAt: number[] = [];

  start(when = 0): void {
    this.startedAt.push(when);
  }

  stop(when = 0): void {
    this.stoppedAt.push(when);
  }
}

export type FakeContextOptions = {
  state?: AudioContextState;
  /** When false, resume() leaves the context suspended, like a blocked gesture. */
  canResume?: boolean;
};

export class FakeAudioContext implements AudioContextLike {
  state: AudioContextState;
  destination = new FakeNode();
  oscillators: FakeOscillator[] = [];
  gains: FakeGain[] = [];
  currentTime = 0;
  resumeCalls = 0;
  suspendCalls = 0;
  closeCalls = 0;
  private canResume: boolean;

  constructor(opts: FakeContextOptions = {}) {
    this.state = opts.state ?? 'running';
    this.canResume = opts.canResume ?? true;
  }

  createGain(): FakeGain {
    const gain = new FakeGain();
    this.gains.push(gain);
    return gain;
  }

  createOscillator(): FakeOscillator {
    const oscillator = new FakeOscillator();
    this.oscillators.push(oscillator);
    return oscillator;
  }

  resume(): Promise<void> {
    this.resumeCalls += 1;
    if (this.canResume) this.state = 'running';
    return Promise.resolve();
  }

  suspend(): Promise<void> {
    this.suspendCalls += 1;
    this.state = 'suspended';
    return Promise.resolve();
  }

  close(): Promise<void> {
    this.closeCalls += 1;
    this.state = 'closed';
    return Promise.resolve();
  }
}
