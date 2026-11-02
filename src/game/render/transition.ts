/** Edge length, in game pixels, of one block of the iris. */
export const IRIS_BLOCK = 4;

export type IrisRun = { x: number; y: number; w: number; h: number };

/**
 * A circular iris: `progress` 0 shows everything, 1 covers everything. The
 * returned test says whether a pixel is covered (true) or still visible.
 * The circle closes on (cx, cy) and reaches the farthest corner just before
 * it starts to shrink, so progress 0 and 1 are exact no matter where the
 * centre sits.
 */
export function irisMask(
  progress: number,
  cx: number,
  cy: number,
  viewW: number,
  viewH: number,
): (x: number, y: number) => boolean {
  const p = progress < 0 ? 0 : progress > 1 ? 1 : progress;
  const far = Math.hypot(
    Math.max(Math.abs(cx), Math.abs(viewW - cx)),
    Math.max(Math.abs(cy), Math.abs(viewH - cy)),
  );
  const radius = (far + 1) * (1 - p);
  const radiusSq = radius * radius;
  return (x, y) => {
    const dx = x - cx;
    const dy = y - cy;
    return dx * dx + dy * dy >= radiusSq;
  };
}

/**
 * The iris as horizontal runs of whole blocks, sampled at each block's
 * centre, so the edge is a hard staircase of pixels and never a smooth
 * curve. Drawing is a handful of `fillRect` calls.
 */
export function irisRuns(
  progress: number,
  cx: number,
  cy: number,
  viewW: number,
  viewH: number,
): IrisRun[] {
  const mask = irisMask(progress, cx, cy, viewW, viewH);
  const runs: IrisRun[] = [];
  const half = IRIS_BLOCK / 2;

  for (let y = 0; y < viewH; y += IRIS_BLOCK) {
    let start = -1;
    // One block past the edge so a run that reaches the edge is flushed.
    for (let x = 0; x < viewW + IRIS_BLOCK; x += IRIS_BLOCK) {
      const hit = x < viewW && mask(x + half, y + half);
      if (hit && start < 0) start = x;
      if (!hit && start >= 0) {
        runs.push({ x: start, y, w: x - start, h: IRIS_BLOCK });
        start = -1;
      }
    }
  }
  return runs;
}

/** Paint the iris over whatever is already on the canvas. */
export function drawIris(
  g: CanvasRenderingContext2D,
  progress: number,
  cx: number,
  cy: number,
  viewW: number,
  viewH: number,
  ink: string,
): void {
  if (progress <= 0) return;
  g.fillStyle = ink;
  for (const r of irisRuns(progress, cx, cy, viewW, viewH)) {
    g.fillRect(r.x, r.y, r.w, r.h);
  }
}

/**
 * The extra door swinging open before the iris closes. The room already
 * draws the door open by then, so this only paints the earlier frames over
 * it: shut, then ajar, then nothing, which lets the open door show through.
 */
export function doorSwingFrame(progress: number): 'doorClosed' | 'darkDoorAjar' | null {
  if (progress < 0.3) return 'doorClosed';
  if (progress < 0.7) return 'darkDoorAjar';
  return null;
}
