export type Viewport = {
  scale: number;
  viewW: number;
  viewH: number;
};

/**
 * Pick the largest whole-pixel scale that fits the window, never below 2x,
 * and report the world size that fits at that scale.
 */
export function computeViewport(cssW: number, cssH: number): Viewport {
  const scale = Math.max(2, Math.floor(Math.min(cssW / 160, cssH / 180)));
  return {
    scale,
    viewW: Math.ceil(cssW / scale),
    viewH: Math.ceil(cssH / scale),
  };
}
