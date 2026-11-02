export const TILE = 8;

export type Tile = { x: number; y: number };

export type TileMap = {
  w: number;
  h: number;
  solid: Uint8Array;
};

const NEIGHBORS = [
  { x: 0, y: -1 },
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
] as const;

/**
 * Build a collision map from an ASCII grid. `#` is solid; every other
 * character is walkable.
 */
export function parseCollision(rows: string[]): TileMap {
  const h = rows.length;
  const w = h > 0 ? rows[0].length : 0;
  const solid = new Uint8Array(w * h);

  for (let y = 0; y < h; y += 1) {
    if (rows[y].length !== w) {
      throw new Error(
        `Uneven map row: expected ${w} tiles, got ${rows[y].length}`,
      );
    }

    for (let x = 0; x < w; x += 1) {
      solid[y * w + x] = rows[y][x] === '#' ? 1 : 0;
    }
  }

  return { w, h, solid };
}

function indexOf(map: TileMap, tile: Tile): number {
  return tile.y * map.w + tile.x;
}

function tileAtIndex(map: TileMap, index: number): Tile {
  return { x: index % map.w, y: Math.floor(index / map.w) };
}

function isSolidTile(map: TileMap, tile: Tile): boolean {
  if (tile.x < 0 || tile.y < 0 || tile.x >= map.w || tile.y >= map.h) {
    return true;
  }
  return map.solid[indexOf(map, tile)] === 1;
}

function sameTile(a: Tile, b: Tile): boolean {
  return a.x === b.x && a.y === b.y;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function clampTile(map: TileMap, tile: Tile): Tile {
  return {
    x: clamp(Math.trunc(tile.x), 0, map.w - 1),
    y: clamp(Math.trunc(tile.y), 0, map.h - 1),
  };
}

function heuristic(a: Tile, b: Tile): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

/** A* over walkable tiles with four-way movement. Excludes the start tile. */
function aStar(map: TileMap, from: Tile, to: Tile): Tile[] | null {
  const total = map.w * map.h;
  const start = indexOf(map, from);
  const goal = indexOf(map, to);

  const open: number[] = [start];
  const inOpen = new Uint8Array(total);
  inOpen[start] = 1;
  const closed = new Uint8Array(total);
  const cameFrom = new Int32Array(total).fill(-1);
  const gScore = new Float64Array(total).fill(Number.POSITIVE_INFINITY);
  const fScore = new Float64Array(total).fill(Number.POSITIVE_INFINITY);
  gScore[start] = 0;
  fScore[start] = heuristic(from, to);

  while (open.length > 0) {
    let best = 0;
    for (let i = 1; i < open.length; i += 1) {
      if (fScore[open[i]] < fScore[open[best]]) best = i;
    }

    const current = open.splice(best, 1)[0];
    inOpen[current] = 0;

    if (current === goal) {
      const path: Tile[] = [];
      let step = goal;
      while (step !== start) {
        path.push(tileAtIndex(map, step));
        step = cameFrom[step];
        if (step === -1) return null;
      }
      return path.reverse();
    }

    closed[current] = 1;
    const currentTile = tileAtIndex(map, current);

    for (const offset of NEIGHBORS) {
      const next = {
        x: currentTile.x + offset.x,
        y: currentTile.y + offset.y,
      };
      if (
        next.x < 0 ||
        next.y < 0 ||
        next.x >= map.w ||
        next.y >= map.h ||
        map.solid[indexOf(map, next)] === 1
      ) {
        continue;
      }

      const nextIndex = indexOf(map, next);
      if (closed[nextIndex] === 1) continue;

      const tentative = gScore[current] + 1;
      if (tentative >= gScore[nextIndex]) continue;

      cameFrom[nextIndex] = current;
      gScore[nextIndex] = tentative;
      fScore[nextIndex] = tentative + heuristic(next, to);
      if (inOpen[nextIndex] === 0) {
        open.push(nextIndex);
        inOpen[nextIndex] = 1;
      }
    }
  }

  return null;
}

/**
 * Pick the reachable walkable tile closest to the requested one. Ties break
 * toward the target's row, then its column, so results are deterministic.
 */
function nearestReachableTile(
  map: TileMap,
  from: Tile,
  to: Tile,
): Tile | null {
  if (isSolidTile(map, from)) return null;

  const total = map.w * map.h;
  const start = indexOf(map, from);
  const queue: number[] = [start];
  const seen = new Uint8Array(total);
  seen[start] = 1;

  let best: Tile | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  let bestManhattan = Number.POSITIVE_INFINITY;

  for (let head = 0; head < queue.length; head += 1) {
    const tile = tileAtIndex(map, queue[head]);
    const dx = tile.x - to.x;
    const dy = tile.y - to.y;
    const distance = dx * dx + dy * dy;
    const manhattan = Math.abs(dx) + Math.abs(dy);

    if (
      distance < bestDistance ||
      (distance === bestDistance && manhattan < bestManhattan) ||
      (distance === bestDistance &&
        manhattan === bestManhattan &&
        best !== null &&
        (tile.y < best.y || (tile.y === best.y && tile.x < best.x)))
    ) {
      best = tile;
      bestDistance = distance;
      bestManhattan = manhattan;
    }

    for (const offset of NEIGHBORS) {
      const nextX = tile.x + offset.x;
      const nextY = tile.y + offset.y;
      if (
        nextX < 0 ||
        nextY < 0 ||
        nextX >= map.w ||
        nextY >= map.h ||
        map.solid[nextY * map.w + nextX] === 1
      ) {
        continue;
      }
      const nextIndex = nextY * map.w + nextX;
      if (seen[nextIndex] === 1) continue;
      seen[nextIndex] = 1;
      queue.push(nextIndex);
    }
  }

  return best;
}

/**
 * Find a four-way path from one tile to another. The returned path starts
 * after `from` and ends on the walkable tile nearest the request: clicking a
 * wall or a sealed room walks to the closest tile the visitor can reach.
 */
export function findPath(map: TileMap, from: Tile, to: Tile): Tile[] {
  if (map.w <= 0 || map.h <= 0) return [];

  const start = clampTile(map, from);
  const goal = clampTile(map, to);

  if (sameTile(start, goal)) return [];
  if (isSolidTile(map, start)) return [];

  if (!isSolidTile(map, goal)) {
    const exact = aStar(map, start, goal);
    if (exact !== null) return exact;
  }

  const nearest = nearestReachableTile(map, start, goal);
  if (nearest === null || sameTile(nearest, start)) return [];

  return aStar(map, start, nearest) ?? [];
}
