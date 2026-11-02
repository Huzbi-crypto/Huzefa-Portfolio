/**
 * A timed beat an exhibit plays while the visitor watches: a lever pull, a
 * note travelling, a line riding the belt. The exhibit's update advances it
 * and the interaction awaits it. A restart settles the older beat with `false`
 * so a stale interaction never carries on and double-opens a panel.
 */
export type Playback = {
  /** Resolves true when the beat finishes, false when a newer one replaced it. */
  start(durationMs: number, reducedMotion: boolean): Promise<boolean>;
  update(ms: number): void;
  readonly active: boolean;
  /** 0 before any start, rising to 1 when finished. */
  readonly progress: number;
  /** Milliseconds into the current beat. */
  readonly elapsed: number;
};

export function createPlayback(): Playback {
  let duration = 0;
  let elapsed = 0;
  let active = false;
  let settle: ((finished: boolean) => void) | null = null;

  const finish = (finished: boolean): void => {
    const done = settle;
    settle = null;
    active = false;
    done?.(finished);
  };

  return {
    start(durationMs, reducedMotion) {
      finish(false);
      duration = Math.max(1, Number.isFinite(durationMs) ? durationMs : 1);
      if (reducedMotion) {
        elapsed = duration;
        return Promise.resolve(true);
      }
      elapsed = 0;
      active = true;
      return new Promise<boolean>((resolve) => {
        settle = resolve;
      });
    },
    update(ms) {
      if (!active) return;
      if (Number.isNaN(ms) || ms <= 0) return;
      elapsed = Math.min(duration, elapsed + ms);
      if (elapsed >= duration) finish(true);
    },
    get active() {
      return active;
    },
    get progress() {
      return duration === 0 ? 0 : elapsed / duration;
    },
    get elapsed() {
      return elapsed;
    },
  };
}
