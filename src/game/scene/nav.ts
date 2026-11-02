import type { TileMap } from '@/game/world/grid';

/**
 * The map pathfinding should use. The feet box is 10px wide, wider than a
 * tile, so a free tile touching a solid one sideways can be pathed to but
 * never stood on. Widening every solid by one tile sideways leaves only
 * tiles the feet really fit on. Physics keeps using the true map.
 */
export function navMap(map: TileMap): TileMap {
  const solid = new Uint8Array(map.solid);
  for (let y = 0; y < map.h; y += 1) {
    for (let x = 0; x < map.w; x += 1) {
      if (map.solid[y * map.w + x] !== 1) continue;
      if (x > 0) solid[y * map.w + x - 1] = 1;
      if (x < map.w - 1) solid[y * map.w + x + 1] = 1;
    }
  }
  return { w: map.w, h: map.h, solid };
}
