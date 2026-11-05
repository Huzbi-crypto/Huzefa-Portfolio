import { describe, expect, it } from 'vitest';
import { ANIMS, PALETTES, SPRITE_GRIDS } from './index';

const DIRS = ['down', 'up', 'left', 'right'] as const;
const names = (): string[] =>
  DIRS.flatMap((d) => ['0', '1', '2', 'idle'].map((f) => `visitor-${d}-${f}`));
const grid = (name: string): string[] => SPRITE_GRIDS[name];
const filled = (c: string): boolean => c !== '.';

/** Count 8-connected groups of filled pixels. */
function components(rows: string[]): number {
  const seen = new Set<string>();
  let count = 0;
  rows.forEach((row, y) =>
    [...row].forEach((c, x) => {
      if (!filled(c) || seen.has(`${x},${y}`)) return;
      count += 1;
      const stack: [number, number][] = [[x, y]];
      seen.add(`${x},${y}`);
      while (stack.length) {
        const [cx, cy] = stack.pop() as [number, number];
        for (let dy = -1; dy <= 1; dy += 1) {
          for (let dx = -1; dx <= 1; dx += 1) {
            const nx = cx + dx;
            const ny = cy + dy;
            if (!rows[ny]?.[nx] || !filled(rows[ny][nx]) || seen.has(`${nx},${ny}`)) continue;
            seen.add(`${nx},${ny}`);
            stack.push([nx, ny]);
          }
        }
      }
    }),
  );
  return count;
}

const top = (rows: string[]): number => rows.findIndex((r) => [...r].some(filled));
const mirrorRow = (row: string): string => [...row].reverse().join('');

describe('player sprite structure', () => {
  it('is_16_by_24_with_palette_keys_only_in_every_frame', () => {
    const keys = new Set(Object.keys(PALETTES['cozy-crt']));
    for (const n of names()) {
      expect(grid(n), n).toHaveLength(24);
      for (const row of grid(n)) {
        expect(row, n).toHaveLength(16);
        for (const c of row) if (c !== '.') expect(keys.has(c), `${n} key ${c}`).toBe(true);
      }
    }
  });

  it('is_one_connected_shape_with_no_stray_pixels', () => {
    for (const n of names()) expect(components(grid(n)), n).toBe(1);
  });

  it('has_a_compact_head_over_a_clear_torso_and_legs', () => {
    for (const n of names()) {
      const rows = grid(n);
      expect(top(rows), n).toBeLessThanOrEqual(1);
      // the chin row is solid ink, the torso starts right under it
      expect(rows[8].replace(/\./g, '').length, `${n} chin`).toBeGreaterThanOrEqual(7);
      expect(rows[9].replace(/\./g, '').length, `${n} collar`).toBeGreaterThanOrEqual(4);
      // the head is under 40% of the figure
      expect(8 / 24, n).toBeLessThan(0.4);
    }
  });

  it('front_and_back_arms_match_in_width_left_and_right', () => {
    for (const d of ['down', 'up']) {
      for (const f of ['0', '1', '2', 'idle']) {
        const rows = grid(`visitor-${d}-${f}`);
        for (let y = 9; y <= 14; y += 1) {
          const left = rows[y].slice(1, 5);
          const right = rows[y].slice(11, 15);
          // one-pixel hand lifts are the only allowed difference, and only below the sleeve
          expect(left.replace(/\./g, '').length, `${d}-${f} row ${y}`).toBe(
            right.replace(/\./g, '').length,
          );
        }
      }
    }
  });

  it('front_arms_are_exact_mirrors_when_standing_apart_from_the_pin', () => {
    for (const d of ['down', 'up']) {
      const rows = grid(`visitor-${d}-0`);
      for (let y = 9; y <= 16; y += 1) {
        expect(mirrorRow(rows[y].slice(11, 15)), `${d} row ${y}`).toBe(rows[y].slice(1, 5));
      }
    }
  });

  it('keeps_a_gap_pixel_between_the_two_front_legs_and_two_shoes', () => {
    for (const d of ['down', 'up']) {
      const rows = grid(`visitor-${d}-0`);
      for (let y = 16; y <= 21; y += 1) {
        expect(rows[y].slice(4, 12), `${d} row ${y}`).toBe('aBBaaBBa');
      }
      expect((rows[22].match(/C/g) ?? []).length, `${d} shoes`).toBe(6);
    }
  });

  it('keeps_the_identity_hoodie_headphones_tuft_and_cat_pin', () => {
    const all = (n: string): string => grid(n).join('');
    expect(all('visitor-down-0')).toContain('r'); // cat pin
    expect(all('visitor-down-0')).toContain('E'); // headphone cups
    expect(all('visitor-right-0')).toContain('r');
    expect(all('visitor-down-0')).toContain('x'); // hoodie
    expect(grid('visitor-down-0')[0]).toContain('a'); // hair tuft above the hair
    expect(grid('visitor-up-0')[0]).toContain('a');
  });

});

describe('player side profile', () => {
  const right = (f: string): string[] => grid(`visitor-right-${f}`);

  it('has_a_flat_face_plane_one_nose_shadow_and_a_mouth', () => {
    const rows = right('0');
    // forehead, eye, nose and mouth rows all end on the same column
    const edge = (y: number): number => rows[y].lastIndexOf('a');
    expect([4, 5, 6, 7].map(edge)).toEqual([13, 13, 13, 13]);
    expect([4, 5, 6, 7].map((y) => rows[y][12])).toEqual(['v', 'v', 'w', 'v']);
    // exactly one eye and one mouth pixel on the face
    expect(rows[5][11]).toBe('a');
    expect(rows[7][11]).toBe('w');
    expect(rows.slice(4, 8).join('').match(/w/g)).toHaveLength(2);
  });

  it('shows_one_arm_and_two_distinct_legs_with_shoes_in_every_frame', () => {
    for (const f of ['0', '1', '2', 'idle']) {
      const rows = right(f);
      // the lighter far leg and the darker near leg both appear
      const legs = rows.slice(16, 21).join('');
      expect(legs, f).toContain('A');
      expect(legs, f).toContain('B');
      // two shoes, one white run per leg
      expect((rows[22].match(/C+/g) ?? []).length + (rows[21].match(/C+/g) ?? []).length, f)
        .toBeGreaterThanOrEqual(2);
      // one sleeve column pair on the torso (x then z), not two arms
      expect(rows[12].match(/xz/g) ?? [], f).toHaveLength(1);
    }
  });

  it('keeps_the_torso_a_solid_body_under_the_head', () => {
    const rows = right('0');
    for (let y = 9; y <= 15; y += 1) {
      const row = rows[y];
      expect(row.indexOf('a'), `row ${y}`).toBeLessThan(6);
      expect(row.lastIndexOf('a'), `row ${y}`).toBeGreaterThan(9);
    }
  });

  it('left_is_the_mirror_of_right', () => {
    for (const f of ['0', '1', '2', 'idle']) {
      expect(grid(`visitor-left-${f}`)).toEqual(right(f).map(mirrorRow));
    }
  });
});

describe('player animation', () => {
  it('legs_step_clearly_between_walk_frames', () => {
    for (const d of DIRS) {
      const [a, b, c] = ANIMS[`visitor-${d}`].slice(0, 3).map(grid);
      const legs = (rows: string[]): string => rows.slice(16).join('|');
      expect(legs(a)).not.toBe(legs(b));
      expect(legs(b)).not.toBe(legs(c));
      expect(legs(a)).not.toBe(legs(c));
    }
  });

  it('head_and_torso_do_not_distort_between_walk_frames', () => {
    for (const d of ['down', 'up']) {
      const [a, b, c] = ANIMS[`visitor-${d}`].slice(0, 3).map(grid);
      for (const rows of [b, c]) {
        expect(rows.slice(0, 10), d).toEqual(a.slice(0, 10));
        // the hoodie body between the arms is identical too
        for (let y = 9; y <= 15; y += 1) {
          expect(rows[y].slice(4, 12), `${d} row ${y}`).toBe(a[y].slice(4, 12));
        }
      }
    }
    for (const d of ['left', 'right']) {
      const [a, b, c] = ANIMS[`visitor-${d}`].slice(0, 3).map(grid);
      for (const rows of [b, c]) expect(rows.slice(0, 15), d).toEqual(a.slice(0, 15));
    }
  });

  it('idle_beat_is_a_blink_and_a_tuft_bob_only', () => {
    for (const d of DIRS) {
      const idle = grid(`visitor-${d}-idle`);
      const base = grid(`visitor-${d}-0`);
      const changed: [number, number][] = [];
      idle.forEach((row, y) => [...row].forEach((c, x) => c !== base[y][x] && changed.push([x, y])));
      expect(changed.length, d).toBeLessThanOrEqual(4);
      for (const [, y] of changed) expect(y, d).toBeLessThanOrEqual(5);
    }
  });
});
