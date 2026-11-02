import { describe, expect, it } from 'vitest';
import {
  LIGHT_STEPS,
  applyLighting,
  lightLevel,
  type Light,
} from './lighting';

function light(overrides: Partial<Light> = {}): Light {
  return {
    x: 0,
    y: 0,
    radius: 20,
    tint: 'warm',
    ...overrides,
  };
}

function imageData(
  width: number,
  height: number,
  paint: (x: number, y: number) => [number, number, number, number],
): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const [r, g, b, a] = paint(x, y);
      const offset = (y * width + x) * 4;
      data[offset] = r;
      data[offset + 1] = g;
      data[offset + 2] = b;
      data[offset + 3] = a;
    }
  }

  return { width, height, data, colorSpace: 'srgb' };
}

describe('lightLevel', () => {
  it('center_is_full_level', () => {
    expect(lightLevel([light({ x: 50, y: 40 })], 50, 40)).toBe(1);
  });

  it('far_is_near_black_but_never_exactly_zero', () => {
    const level = lightLevel([light()], 500, 500);
    expect(level).toBeGreaterThan(0);
    expect(level).toBeLessThan(0.2);
  });

  it('only_values_from_steps', () => {
    const lights = [
      light({ x: 4, y: 4 }),
      light({ x: 18, y: 18, tint: 'cool' }),
    ];

    for (let y = 0; y < 24; y += 1) {
      for (let x = 0; x < 24; x += 1) {
        expect(LIGHT_STEPS).toContain(lightLevel(lights, x, y));
      }
    }
  });

  it('second_light_adds', () => {
    const first = light({ x: 0, y: 10 });
    const second = light({ x: 20, y: 10, tint: 'cool' });

    const one = lightLevel([first], 10, 10);
    const two = lightLevel([first, second], 10, 10);

    expect(one).toBeLessThan(1);
    expect(two).toBeGreaterThan(one);
  });
});

describe('applyLighting', () => {
  it('no_gradient_in_output', () => {
    const width = 16;
    const height = 16;
    const sourceColors: Array<[number, number, number, number]> = [
      [255, 255, 255, 255],
      [160, 96, 48, 255],
    ];
    const src = imageData(width, height, (x, y) => sourceColors[(x + y) % 2]);
    const dst = imageData(width, height, () => [0, 0, 0, 0]);
    const lights = [
      light({ x: 2, y: 2, radius: 30 }),
      light({ x: 14, y: 14, radius: 30 }),
    ];

    applyLighting(src, dst, lights);

    const distinctSource = new Set<number>();
    const distinctOutput = new Set<number>();

    for (let i = 0; i < src.data.length; i += 4) {
      distinctSource.add(
        (src.data[i] << 16) | (src.data[i + 1] << 8) | src.data[i + 2],
      );
      distinctOutput.add(
        (dst.data[i] << 16) | (dst.data[i + 1] << 8) | dst.data[i + 2],
      );
    }

    expect(distinctOutput.size).toBeLessThanOrEqual(
      distinctSource.size * LIGHT_STEPS.length,
    );

    for (let i = 0; i < src.data.length; i += 1) {
      if (i % 4 === 3) {
        expect(dst.data[i]).toBe(src.data[i]);
      } else {
        expect(dst.data[i]).toBeLessThanOrEqual(src.data[i]);
      }
    }
  });

  it('averages_under_4ms_over_100_runs', () => {
    const width = 342;
    const height = 192;
    const src = imageData(width, height, (x, y) => [
      (x * 7) & 255,
      (y * 5) & 255,
      128,
      255,
    ]);
    const dst = imageData(width, height, () => [0, 0, 0, 0]);
    const lights = [
      light({ x: 80, y: 96, radius: 140 }),
      light({ x: 260, y: 96, radius: 110, tint: 'cool' }),
    ];

    for (let i = 0; i < 25; i += 1) applyLighting(src, dst, lights);

    const start = performance.now();
    for (let i = 0; i < 100; i += 1) applyLighting(src, dst, lights);
    const average = (performance.now() - start) / 100;

    expect(average).toBeLessThan(4);
  });
});
