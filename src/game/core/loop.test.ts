import { describe, expect, it } from 'vitest';
import { createLoop } from './loop';

type FakeRaf = {
  raf: typeof requestAnimationFrame;
  caf: typeof cancelAnimationFrame;
  fire: (time: number) => void;
  pending: () => boolean;
};

function createFakeRaf(): FakeRaf {
  let next: FrameRequestCallback | null = null;
  let nextId = 0;

  return {
    raf: ((callback: FrameRequestCallback) => {
      next = callback;
      nextId += 1;
      return nextId;
    }) as typeof requestAnimationFrame,
    caf: (() => {
      next = null;
    }) as typeof cancelAnimationFrame,
    fire: (time: number) => {
      const callback = next;
      next = null;
      callback?.(time);
    },
    pending: () => next !== null,
  };
}

describe('createLoop', () => {
  it('loop_clamps_long_gap', () => {
    const fake = createFakeRaf();
    let steps = 0;

    const loop = createLoop({
      step: () => {
        steps += 1;
      },
      render: () => {},
      raf: fake.raf,
      caf: fake.caf,
    });

    loop.start();
    fake.fire(1000);
    fake.fire(6000);

    expect(steps).toBeLessThanOrEqual(6);
  });

  it('loop_stop_cancels', () => {
    const fake = createFakeRaf();
    let steps = 0;

    const loop = createLoop({
      step: () => {
        steps += 1;
      },
      render: () => {},
      raf: fake.raf,
      caf: fake.caf,
    });

    loop.start();
    fake.fire(1000);
    const before = steps;
    loop.stop();
    fake.fire(2000);

    expect(fake.pending()).toBe(false);
    expect(steps).toBe(before);
  });
});
