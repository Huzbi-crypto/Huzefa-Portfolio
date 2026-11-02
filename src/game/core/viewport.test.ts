import { describe, expect, it } from 'vitest';
import { computeViewport } from './viewport';

describe('computeViewport', () => {
  it('scales 1920x1080 to the largest whole factor that fits', () => {
    expect(computeViewport(1920, 1080)).toEqual({
      scale: 6,
      viewW: 320,
      viewH: 180,
    });
  });

  it('scales 1366x768 to the largest whole factor that fits', () => {
    expect(computeViewport(1366, 768)).toEqual({
      scale: 4,
      viewW: 342,
      viewH: 192,
    });
  });

  it('scales a phone in portrait at a whole factor', () => {
    expect(computeViewport(390, 844)).toEqual({
      scale: 2,
      viewW: 195,
      viewH: 422,
    });
  });

  it('never scales below 2', () => {
    expect(computeViewport(200, 200).scale).toBe(2);
  });
});
