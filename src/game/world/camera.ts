export type Camera = { x: number; y: number };

function axis(target: number, view: number, world: number): number {
  const max = world - view;

  // A view larger than the world is letterboxed: centre the whole world.
  if (max <= 0) return max / 2;

  return Math.min(max, Math.max(0, target - view / 2));
}

/**
 * Center the camera on a world position, keep it inside the world, and round
 * to whole pixels so the low-resolution canvas never shows a half-pixel.
 */
export function computeCamera(
  target: { x: number; y: number },
  viewW: number,
  viewH: number,
  worldW: number,
  worldH: number,
): Camera {
  return {
    x: Math.round(axis(target.x, viewW, worldW)),
    y: Math.round(axis(target.y, viewH, worldH)),
  };
}
