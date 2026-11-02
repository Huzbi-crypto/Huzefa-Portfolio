/**
 * The tiny 3D screen in the Renderer exhibit. Real rotation and perspective,
 * integer pixels out: it is a wireframe toy, not a renderer with opinions about
 * depth buffers. Shapes live in camera space with +z away from the viewer.
 */

export type Mat4 = number[];

export type Vec3 = { x: number; y: number; z: number };

export type Shape = {
  vertices: Vec3[];
  /** Vertex index pairs. */
  edges: readonly [number, number][];
};

export type Point = { x: number; y: number };

export type Edge2D = { a: Point; b: Point };

/** Anything closer than this to the camera is clipped rather than projected. */
const Z_NEAR = 1;
const MAX_POINTS = 4096;

function multiply(a: Mat4, b: Mat4): Mat4 {
  const out = new Array<number>(16).fill(0);
  for (let row = 0; row < 4; row += 1) {
    for (let column = 0; column < 4; column += 1) {
      let sum = 0;
      for (let k = 0; k < 4; k += 1) {
        sum += a[row * 4 + k] * b[k * 4 + column];
      }
      out[row * 4 + column] = sum;
    }
  }
  return out;
}

/**
 * Yaw around Y, then pitch around X. Row-major, column vectors, so the matrix
 * multiplies a point directly.
 */
export function rotation(yaw: number, pitch: number): Mat4 {
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);

  const aroundY: Mat4 = [
    cy, 0, -sy, 0,
    0, 1, 0, 0,
    sy, 0, cy, 0,
    0, 0, 0, 1,
  ];
  const aroundX: Mat4 = [
    1, 0, 0, 0,
    0, cp, -sp, 0,
    0, sp, cp, 0,
    0, 0, 0, 1,
  ];

  return multiply(aroundX, aroundY);
}

/**
 * Project every edge that is fully in front of the camera onto an integer
 * screen. Edges with an endpoint behind the camera disappear for that frame.
 */
export function projectEdges(
  m: Mat4,
  shape: Shape,
  w: number,
  h: number,
): Edge2D[] {
  const focal = h;
  const centerX = w / 2;
  const centerY = h / 2;

  const projected: Array<Point | null> = shape.vertices.map((vertex) => {
    const x = m[0] * vertex.x + m[1] * vertex.y + m[2] * vertex.z + m[3];
    const y = m[4] * vertex.x + m[5] * vertex.y + m[6] * vertex.z + m[7];
    const z = m[8] * vertex.x + m[9] * vertex.y + m[10] * vertex.z + m[11];

    if (
      !Number.isFinite(x) ||
      !Number.isFinite(y) ||
      !Number.isFinite(z) ||
      z <= Z_NEAR
    ) {
      return null;
    }

    return {
      x: Math.round(centerX + (x * focal) / z),
      y: Math.round(centerY - (y * focal) / z),
    };
  });

  const edges: Edge2D[] = [];
  for (const [from, to] of shape.edges) {
    const a = projected[from];
    const b = projected[to];
    if (!a || !b) continue;
    edges.push({ a, b });
  }
  return edges;
}

/** Bresenham, so every point is a whole pixel and both ends are included. */
export function rasterLine(e: Edge2D): Point[] {
  let x = Math.round(e.a.x);
  let y = Math.round(e.a.y);
  const x1 = Math.round(e.b.x);
  const y1 = Math.round(e.b.y);

  const dx = Math.abs(x1 - x);
  const dy = -Math.abs(y1 - y);
  const sx = x < x1 ? 1 : -1;
  const sy = y < y1 ? 1 : -1;
  let error = dx + dy;
  const points: Point[] = [{ x, y }];

  while ((x !== x1 || y !== y1) && points.length < MAX_POINTS) {
    const doubled = 2 * error;
    if (doubled >= dy) {
      error += dy;
      x += sx;
    }
    if (doubled <= dx) {
      error += dx;
      y += sy;
    }
    points.push({ x, y });
  }

  return points;
}
