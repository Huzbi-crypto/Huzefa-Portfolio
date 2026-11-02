import { describe, expect, it } from 'vitest';
import {
  TILE,
  findPath,
  parseCollision,
  type Tile,
  type TileMap,
} from './grid';

function expectValidPath(map: TileMap, from: Tile, path: Tile[]): void {
  expect(path.length).toBeGreaterThan(0);

  let previous = from;
  for (const step of path) {
    expect(step.x).toBeGreaterThanOrEqual(0);
    expect(step.y).toBeGreaterThanOrEqual(0);
    expect(step.x).toBeLessThan(map.w);
    expect(step.y).toBeLessThan(map.h);
    expect(map.solid[step.y * map.w + step.x]).toBe(0);
    expect(Math.abs(step.x - previous.x) + Math.abs(step.y - previous.y)).toBe(
      1,
    );
    previous = step;
  }
}

describe('grid', () => {
  it('uses eight-pixel tiles', () => {
    expect(TILE).toBe(8);
  });

  it('parse_collision_reads_walls', () => {
    const map = parseCollision(['.#', '..']);

    expect(map.w).toBe(2);
    expect(map.h).toBe(2);
    expect(Array.from(map.solid)).toEqual([0, 1, 0, 0]);
  });

  it('path_around_wall', () => {
    const map = parseCollision([
      '#########',
      '#.#####.#',
      '#.#####.#',
      '#.......#',
      '#########',
    ]);

    const from = { x: 1, y: 1 };
    const to = { x: 7, y: 1 };
    const path = findPath(map, from, to);

    expectValidPath(map, from, path);
    expect(path.at(-1)).toEqual(to);
    // The direct route is six steps; going around the wall costs ten.
    expect(path).toHaveLength(10);
  });

  it('path_to_self_is_empty', () => {
    const map = parseCollision(['.....', '.....', '.....']);

    expect(findPath(map, { x: 2, y: 1 }, { x: 2, y: 1 })).toEqual([]);
  });

  it('path_to_solid_tile_goes_to_nearest_reachable', () => {
    const map = parseCollision([
      '#########',
      '#.......#',
      '#...##..#',
      '#.......#',
      '#########',
    ]);

    const from = { x: 1, y: 1 };
    const to = { x: 5, y: 2 };
    const path = findPath(map, from, to);

    expectValidPath(map, from, path);
    const end = path.at(-1)!;
    expect(map.solid[end.y * map.w + end.x]).toBe(0);
    expect(Math.abs(end.x - to.x) + Math.abs(end.y - to.y)).toBe(1);
  });

  it('path_to_enclosed_area_goes_to_nearest_reachable_and_returns', () => {
    const map = parseCollision([
      '#########',
      '#.......#',
      '#.#####.#',
      '#.#...#.#',
      '#.#####.#',
      '#.......#',
      '#########',
    ]);

    const from = { x: 1, y: 1 };
    const to = { x: 4, y: 3 };
    const path = findPath(map, from, to);

    expectValidPath(map, from, path);
    // The nearest reachable tile outside the sealed room.
    expect(path.at(-1)).toEqual({ x: 4, y: 1 });
  });

  it('out_of_bounds_target_is_clamped', () => {
    const map = parseCollision(['.....', '.....', '.....', '.....', '.....']);

    const from = { x: 1, y: 1 };
    const path = findPath(map, from, { x: 99, y: -7 });

    expectValidPath(map, from, path);
    expect(path.at(-1)).toEqual({ x: 4, y: 0 });
  });
});
