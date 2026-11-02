import { describe, expect, it } from 'vitest';
import { LIGHT_STEPS, lightLevel, type Light } from './lighting';

function light(overrides: Partial<Light> = {}): Light {
  return {
    x: 0,
    y: 0,
    radius: 20,
    tint: 'warm',
    ...overrides,
  };
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
