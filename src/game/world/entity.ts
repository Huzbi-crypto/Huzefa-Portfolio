import { TILE, type Tile, type TileMap } from './grid';

export type Facing = 'up' | 'down' | 'left' | 'right';

export type Entity = {
  x: number;
  y: number;
  w: number;
  h: number;
  facing: Facing;
  moving: boolean;
  walkMs: number;
  path: Tile[];
};

const SPEED = 60;
const MAX_STEP = 1;

/**
 * `x` and `y` are the centre of the feet box, which makes path targets and
 * the camera target line up with tile centres. The feet box is 10 by 6 world
 * pixels.
 */
export function createEntity(x: number, y: number): Entity {
  return {
    x,
    y,
    w: 10,
    h: 6,
    facing: 'down',
    moving: false,
    walkMs: 0,
    path: [],
  };
}

function overlapsSolid(
  map: TileMap,
  e: Entity,
  x: number,
  y: number,
): boolean {
  const left = Math.floor((x - e.w / 2) / TILE);
  const right = Math.ceil((x + e.w / 2) / TILE) - 1;
  const top = Math.floor((y - e.h / 2) / TILE);
  const bottom = Math.ceil((y + e.h / 2) / TILE) - 1;

  for (let tileY = top; tileY <= bottom; tileY += 1) {
    for (let tileX = left; tileX <= right; tileX += 1) {
      if (
        tileX < 0 ||
        tileY < 0 ||
        tileX >= map.w ||
        tileY >= map.h ||
        map.solid[tileY * map.w + tileX] === 1
      ) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Move in whole-pixel substeps and resolve each axis separately. Short steps
 * make tunnelling impossible even after a long frame, and separate axes let
 * the entity slide along a wall it is pushing into.
 */
function moveBy(e: Entity, map: TileMap, dx: number, dy: number): boolean {
  const distance = Math.hypot(dx, dy);
  if (distance === 0) return false;

  const steps = Math.max(1, Math.ceil(distance / MAX_STEP));
  const stepX = dx / steps;
  const stepY = dy / steps;
  const startX = e.x;
  const startY = e.y;

  for (let i = 0; i < steps; i += 1) {
    if (stepX !== 0 && !overlapsSolid(map, e, e.x + stepX, e.y)) {
      e.x += stepX;
    }
    if (stepY !== 0 && !overlapsSolid(map, e, e.x, e.y + stepY)) {
      e.y += stepY;
    }
  }

  return e.x !== startX || e.y !== startY;
}

function faceDelta(e: Entity, dx: number, dy: number): void {
  if (dx === 0 && dy === 0) return;

  if (Math.abs(dx) >= Math.abs(dy)) {
    e.facing = dx > 0 ? 'right' : 'left';
  } else {
    e.facing = dy > 0 ? 'down' : 'up';
  }
}

function stepAlongPath(e: Entity, map: TileMap, ms: number): boolean {
  let budget = SPEED * (ms / 1000);
  let moved = false;

  while (budget > 0 && e.path.length > 0) {
    const target = e.path[0];
    const targetX = target.x * TILE + TILE / 2;
    const targetY = target.y * TILE + TILE / 2;
    const dx = targetX - e.x;
    const dy = targetY - e.y;
    const distance = Math.hypot(dx, dy);

    if (distance <= 1e-9) {
      e.path.shift();
      continue;
    }

    faceDelta(e, dx, dy);
    const travel = Math.min(distance, budget);
    const movedThisStep = moveBy(
      e,
      map,
      (dx / distance) * travel,
      (dy / distance) * travel,
    );
    if (movedThisStep) moved = true;
    budget -= travel;

    if (Math.hypot(targetX - e.x, targetY - e.y) <= 1e-6) {
      e.x = targetX;
      e.y = targetY;
      e.path.shift();
    } else if (!movedThisStep) {
      break;
    }
  }

  return moved;
}

/**
 * Advance the character for one fixed step. Keyboard input always wins and
 * cancels any click-to-walk path; with no input the queued path is followed.
 */
export function stepEntity(
  e: Entity,
  move: { x: number; y: number },
  map: TileMap,
  ms: number,
): void {
  if (!Number.isFinite(ms) || ms <= 0) {
    e.moving = false;
    return;
  }

  const hasInput = move.x !== 0 || move.y !== 0;

  if (hasInput) {
    e.path.length = 0;
    const length = Math.hypot(move.x, move.y);
    const distance = SPEED * (ms / 1000);
    const dx = (move.x / length) * distance;
    const dy = (move.y / length) * distance;

    faceDelta(e, dx, dy);
    const moved = moveBy(e, map, dx, dy);
    e.moving = moved;
    if (moved) e.walkMs += ms;
    return;
  }

  if (e.path.length > 0) {
    const moved = stepAlongPath(e, map, ms);
    e.moving = e.path.length > 0;
    if (moved) e.walkMs += ms;
    return;
  }

  e.moving = false;
}

/** Whole world-pixel coordinates for drawing, so sprites never blur. */
export function drawPos(e: Entity): { x: number; y: number } {
  return { x: Math.floor(e.x), y: Math.floor(e.y) };
}
