import { describe, expect, it } from 'vitest';
import {
  projectEdges,
  rasterLine,
  rotation,
  type Edge2D,
  type Shape,
} from './wire3d';

function shape(vertices: Shape['vertices'], edges: [number, number][]): Shape {
  return { vertices, edges };
}

describe('rotation', () => {
  it('identity_keeps_shape', () => {
    const m = rotation(0, 0);
    const square = shape(
      [
        { x: 1, y: 2, z: 4 },
        { x: -1, y: 2, z: 4 },
        { x: -1, y: -2, z: 4 },
        { x: 1, y: -2, z: 4 },
      ],
      [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 0],
      ],
    );

    const edges = projectEdges(m, square, 200, 100);

    expect(edges).toEqual<Edge2D[]>([
      { a: { x: 125, y: 0 }, b: { x: 75, y: 0 } },
      { a: { x: 75, y: 0 }, b: { x: 75, y: 100 } },
      { a: { x: 75, y: 100 }, b: { x: 125, y: 100 } },
      { a: { x: 125, y: 100 }, b: { x: 125, y: 0 } },
    ]);
  });

  it('known_90deg_rotation', () => {
    const yaw = rotation(Math.PI / 2, 0);
    expect(yaw[0]).toBeCloseTo(0);
    expect(yaw[2]).toBeCloseTo(-1);
    expect(yaw[8]).toBeCloseTo(1);
    expect(yaw[10]).toBeCloseTo(0);

    const pitch = rotation(0, Math.PI / 2);
    expect(pitch[5]).toBeCloseTo(0);
    expect(pitch[6]).toBeCloseTo(-1);
    expect(pitch[9]).toBeCloseTo(1);
    expect(pitch[10]).toBeCloseTo(0);
  });
});

describe('projectEdges', () => {
  it('perspective_shrinks_far_points', () => {
    const m = rotation(0, 0);
    const shape3d = shape(
      [
        { x: 0, y: 0, z: 4 },
        { x: 1, y: 0, z: 4 },
        { x: 1, y: 0, z: 8 },
      ],
      [
        [0, 1],
        [0, 2],
      ],
    );

    const [near, far] = projectEdges(m, shape3d, 200, 100);
    expect(near.b.x - near.a.x).toBeGreaterThan(far.b.x - far.a.x);
  });

  it('behind_camera_is_clipped', () => {
    const m = rotation(0, 0);
    const mixed = shape(
      [
        { x: 0, y: 0, z: 2 },
        { x: 2, y: 0, z: 3 },
        { x: 0, y: 0, z: -1 },
      ],
      [
        [0, 1],
        [0, 2],
      ],
    );

    expect(projectEdges(m, mixed, 100, 100)).toHaveLength(1);
    expect(
      projectEdges(
        m,
        shape(
          [
            { x: 0, y: 0, z: -1 },
            { x: 1, y: 0, z: 0 },
          ],
          [[0, 1]],
        ),
        100,
        100,
      ),
    ).toEqual([]);
  });
});

describe('rasterLine', () => {
  it('points_are_integers', () => {
    const m = rotation(0.6, 0.3);
    const cube = shape(
      [
        { x: -1, y: -1, z: 5 },
        { x: 1, y: -1, z: 5 },
        { x: 1, y: 1, z: 5 },
        { x: -1, y: 1, z: 5 },
        { x: -1, y: -1, z: 7 },
        { x: 1, y: -1, z: 7 },
        { x: 1, y: 1, z: 7 },
        { x: -1, y: 1, z: 7 },
      ],
      [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 0],
        [4, 5],
        [5, 6],
        [6, 7],
        [7, 4],
        [0, 4],
        [1, 5],
        [2, 6],
        [3, 7],
      ],
    );

    const edges = projectEdges(m, cube, 320, 180);
    expect(edges.length).toBeGreaterThan(0);

    for (const edge of edges) {
      expect(Number.isInteger(edge.a.x)).toBe(true);
      expect(Number.isInteger(edge.a.y)).toBe(true);
      expect(Number.isInteger(edge.b.x)).toBe(true);
      expect(Number.isInteger(edge.b.y)).toBe(true);

      const points = rasterLine(edge);
      expect(points.length).toBeGreaterThan(1);
      for (const point of points) {
        expect(Number.isInteger(point.x)).toBe(true);
        expect(Number.isInteger(point.y)).toBe(true);
      }
    }
  });

  it('rasterLine_includes_both_ends', () => {
    const points = rasterLine({ a: { x: 7, y: 7 }, b: { x: 2, y: 3 } });

    expect(points[0]).toEqual({ x: 7, y: 7 });
    expect(points[points.length - 1]).toEqual({ x: 2, y: 3 });
    expect(points).toHaveLength(6);
    expect(rasterLine({ a: { x: 4, y: 4 }, b: { x: 4, y: 4 } })).toEqual([
      { x: 4, y: 4 },
    ]);
  });
});
