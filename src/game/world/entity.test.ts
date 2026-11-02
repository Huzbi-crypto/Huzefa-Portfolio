import { describe, expect, it } from 'vitest';
import {
  createEntity,
  drawPos,
  stepEntity,
  type Entity,
} from './entity';
import { TILE, parseCollision, type TileMap } from './grid';

function openMap(w = 20, h = 20): TileMap {
  return parseCollision(Array.from({ length: h }, () => '.'.repeat(w)));
}

function entityAtTile(tileX: number, tileY: number): Entity {
  return createEntity(tileX * TILE + TILE / 2, tileY * TILE + TILE / 2);
}

function feetRight(e: Entity): number {
  return e.x + e.w / 2;
}

describe('entity', () => {
  it('create_entity_has_ten_by_six_feet', () => {
    const e = createEntity(12, 12);

    expect(e).toMatchObject({
      x: 12,
      y: 12,
      w: 10,
      h: 6,
      facing: 'down',
      moving: false,
      path: [],
    });
  });

  it('moves_at_60px_per_second', () => {
    const e = createEntity(40, 40);

    stepEntity(e, { x: 1, y: 0 }, openMap(), 1000);

    expect(e.x).toBeCloseTo(100, 5);
    expect(e.y).toBeCloseTo(40, 5);
    expect(e.moving).toBe(true);
    expect(e.facing).toBe('right');
  });

  it('diagonal_is_normalized', () => {
    const e = createEntity(40, 40);

    stepEntity(e, { x: 1, y: 1 }, openMap(), 1000);

    expect(Math.hypot(e.x - 40, e.y - 40)).toBeCloseTo(60, 5);
    expect(e.x - 40).toBeCloseTo(60 / Math.SQRT2, 5);
    expect(e.y - 40).toBeCloseTo(60 / Math.SQRT2, 5);
  });

  it('slides_along_wall', () => {
    const rows = Array.from({ length: 10 }, () => '.....#....');
    const map = parseCollision(rows);
    const e = entityAtTile(2, 2);

    stepEntity(e, { x: 1, y: 1 }, map, 1000);

    // The wall stops horizontal movement at x = 35, but vertical movement
    // continues for the full second.
    expect(feetRight(e)).toBeLessThanOrEqual(5 * TILE);
    expect(e.y).toBeGreaterThan(55);
  });

  it('cannot_enter_solid', () => {
    const rows = Array.from({ length: 10 }, () => '.....#....');
    const map = parseCollision(rows);
    const e = entityAtTile(2, 2);

    stepEntity(e, { x: 1, y: 0 }, map, 2000);

    expect(feetRight(e)).toBeLessThanOrEqual(5 * TILE);
    expect(feetRight(e)).toBeGreaterThan(5 * TILE - 1);
  });

  it('huge_ms_never_tunnels_through_wall', () => {
    const map = parseCollision(Array.from({ length: 10 }, () => '.....#....'));
    const e = entityAtTile(2, 2);

    stepEntity(e, { x: 1, y: 0 }, map, 5000);

    expect(feetRight(e)).toBeLessThanOrEqual(5 * TILE);
    expect(Math.floor(e.x / TILE)).toBeLessThan(5);
  });

  it('keyboard_cancels_path', () => {
    const e = entityAtTile(1, 1);
    e.path = [
      { x: 2, y: 1 },
      { x: 3, y: 1 },
    ];

    stepEntity(e, { x: 1, y: 0 }, openMap(), 16);

    expect(e.path).toEqual([]);
    expect(e.x).toBeGreaterThan(1 * TILE + TILE / 2);
  });

  it('follows_path_then_stops', () => {
    const e = entityAtTile(1, 1);
    e.path = [
      { x: 2, y: 1 },
      { x: 3, y: 1 },
    ];

    stepEntity(e, { x: 0, y: 0 }, openMap(), 1000);

    expect(e.x).toBeCloseTo(3 * TILE + TILE / 2, 5);
    expect(e.y).toBeCloseTo(1 * TILE + TILE / 2, 5);
    expect(e.path).toEqual([]);
    expect(e.moving).toBe(false);
    expect(e.facing).toBe('right');
  });

  it('coordinates_at_draw_time_are_integers', () => {
    const e = createEntity(10.75, 20.25);

    expect(drawPos(e)).toEqual({ x: 10, y: 20 });
  });
});
