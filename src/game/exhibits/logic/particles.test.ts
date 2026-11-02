import { describe, expect, it } from 'vitest';
import { createField, stepField, type Field } from './particles';

function averageDistance(f: Field, at: { x: number; y: number }): number {
  let total = 0;
  for (let i = 0; i < f.n; i += 1) {
    total += Math.hypot(f.x[i] - at.x, f.y[i] - at.y);
  }
  return total / f.n;
}

function expectInBounds(f: Field): void {
  for (let i = 0; i < f.n; i += 1) {
    expect(Number.isFinite(f.x[i])).toBe(true);
    expect(Number.isFinite(f.y[i])).toBe(true);
    expect(Number.isFinite(f.vx[i])).toBe(true);
    expect(Number.isFinite(f.vy[i])).toBe(true);
    expect(f.x[i]).toBeGreaterThanOrEqual(0);
    expect(f.x[i]).toBeLessThanOrEqual(f.w);
    expect(f.y[i]).toBeGreaterThanOrEqual(0);
    expect(f.y[i]).toBeLessThanOrEqual(f.h);
  }
}

describe('createField', () => {
  it('is_seeded_and_deterministic', () => {
    const first = createField(24, 100, 80, 4);
    const again = createField(24, 100, 80, 4);
    const other = createField(24, 100, 80, 5);

    expect(Array.from(first.x)).toEqual(Array.from(again.x));
    expect(Array.from(first.x)).not.toEqual(Array.from(other.x));
    expect(first.x).toHaveLength(24);
    expectInBounds(first);
  });
});

describe('stepField', () => {
  it('pulled_toward_attractor', () => {
    const f = createField(64, 200, 120, 3);
    const center = { x: 100, y: 60 };
    const before = averageDistance(f, center);

    for (let i = 0; i < 60; i += 1) stepField(f, 16, center);

    expect(averageDistance(f, center)).toBeLessThan(before * 0.9);
  });

  it('stays_in_bounds', () => {
    const f = createField(120, 80, 60, 5);

    for (let i = 0; i < 500; i += 1) {
      stepField(f, 100, { x: -20, y: -20 });
    }

    expectInBounds(f);
  });

  it('null_attractor_drifts', () => {
    const f = createField(32, 100, 100, 9);
    const before = Array.from(f.x);

    stepField(f, 500, null);

    const moved = f.x.reduce(
      (total, x, index) => total + Math.abs(x - before[index]),
      0,
    );
    expect(moved).toBeGreaterThan(1);
    expectInBounds(f);
  });

  it('huge_ms_stays_finite', () => {
    const f = createField(64, 120, 90, 11);

    stepField(f, 1_000_000_000, { x: 60, y: 45 });

    expectInBounds(f);
  });

  it('no_allocation_per_step', () => {
    const f = createField(16, 80, 80, 2);
    const x = f.x;
    const y = f.y;
    const vx = f.vx;
    const vy = f.vy;

    const result = stepField(f, 16, { x: 40, y: 40 });

    expect(result).toBeUndefined();
    expect(f.x).toBe(x);
    expect(f.y).toBe(y);
    expect(f.vx).toBe(vx);
    expect(f.vy).toBe(vy);
  });

  it('200_particles_under_1ms_on_average', () => {
    const f = createField(200, 320, 180, 12);
    const attractor = { x: 160, y: 90 };

    for (let i = 0; i < 20; i += 1) stepField(f, 16, attractor);

    const start = performance.now();
    for (let i = 0; i < 200; i += 1) stepField(f, 16, attractor);
    const average = (performance.now() - start) / 200;

    expect(average).toBeLessThan(1);
  });
});
