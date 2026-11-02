import { describe, expect, it } from 'vitest';
import { computeCamera, type Camera } from './camera';

function expectInBounds(
  camera: Camera,
  viewW: number,
  viewH: number,
  worldW: number,
  worldH: number,
): void {
  const minX = Math.min(0, worldW - viewW);
  const maxX = Math.max(0, worldW - viewW);
  const minY = Math.min(0, worldH - viewH);
  const maxY = Math.max(0, worldH - viewH);

  expect(camera.x).toBeGreaterThanOrEqual(minX);
  expect(camera.x).toBeLessThanOrEqual(maxX);
  expect(camera.y).toBeGreaterThanOrEqual(minY);
  expect(camera.y).toBeLessThanOrEqual(maxY);
}

describe('computeCamera', () => {
  it('centers_on_target', () => {
    expect(computeCamera({ x: 200, y: 140 }, 320, 180, 640, 360)).toEqual({
      x: 40,
      y: 50,
    });
  });

  it('clamps_to_world_edges', () => {
    expect(computeCamera({ x: 0, y: 0 }, 320, 180, 640, 360)).toEqual({
      x: 0,
      y: 0,
    });
    expect(computeCamera({ x: 640, y: 360 }, 320, 180, 640, 360)).toEqual({
      x: 320,
      y: 180,
    });
  });

  it('centers_world_when_view_is_larger', () => {
    expect(computeCamera({ x: 100, y: 100 }, 400, 200, 320, 180)).toEqual({
      x: -40,
      y: -10,
    });
  });

  it('result_is_integer', () => {
    const camera = computeCamera({ x: 200.4, y: 140.8 }, 321, 181, 640, 360);

    expect(Number.isInteger(camera.x)).toBe(true);
    expect(Number.isInteger(camera.y)).toBe(true);
  });

  it('stays_in_bounds_after_view_size_change', () => {
    const target = { x: 320, y: 180 };
    const landscape = computeCamera(target, 342, 192, 640, 360);
    const portrait = computeCamera(target, 195, 422, 640, 360);

    expectInBounds(landscape, 342, 192, 640, 360);
    expectInBounds(portrait, 195, 422, 640, 360);
    expect(Number.isInteger(landscape.x)).toBe(true);
    expect(Number.isInteger(landscape.y)).toBe(true);
    expect(Number.isInteger(portrait.x)).toBe(true);
    expect(Number.isInteger(portrait.y)).toBe(true);
  });
});
