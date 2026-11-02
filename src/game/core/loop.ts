export type LoopOptions = {
  step: (ms: number) => void;
  render: () => void;
  stepMs?: number;
  maxFrameMs?: number;
  raf?: typeof requestAnimationFrame;
  caf?: typeof cancelAnimationFrame;
};

export type Loop = {
  start(): void;
  stop(): void;
};

/**
 * A fixed-step game loop. Elapsed time is capped per frame so a background
 * tab or a stalled frame can never fast-forward the simulation.
 */
export function createLoop(opts: LoopOptions): Loop {
  const stepMs = opts.stepMs ?? 1000 / 60;
  const maxFrameMs = opts.maxFrameMs ?? 100;
  const raf = opts.raf ?? requestAnimationFrame;
  const caf = opts.caf ?? cancelAnimationFrame;

  let running = false;
  let frameId: number | null = null;
  let last: number | null = null;
  let accumulator = 0;

  const frame = (time: number): void => {
    if (!running) return;
    frameId = null;

    if (last === null) {
      last = time;
    } else {
      const elapsed = Math.min(time - last, maxFrameMs);
      last = time;
      accumulator += Math.max(0, elapsed);

      while (accumulator >= stepMs) {
        opts.step(stepMs);
        accumulator -= stepMs;
      }
    }

    opts.render();
    if (running) frameId = raf(frame);
  };

  return {
    start(): void {
      if (running) return;
      running = true;
      last = null;
      accumulator = 0;
      frameId = raf(frame);
    },
    stop(): void {
      running = false;
      if (frameId !== null) {
        caf(frameId);
        frameId = null;
      }
    },
  };
}
