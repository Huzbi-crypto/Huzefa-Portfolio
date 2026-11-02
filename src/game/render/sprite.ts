export type Sprite = {
  w: number;
  h: number;
  pixels: (string | null)[];
};

const spriteCanvases = new WeakMap<Sprite, HTMLCanvasElement>();

/**
 * Turn a palette-indexed character grid into a flat pixel list. `.` is
 * transparent; every other character must exist in the palette.
 */
export function decodeSprite(
  rows: string[],
  palette: Record<string, string>,
): Sprite {
  const h = rows.length;
  const w = h > 0 ? rows[0].length : 0;
  const pixels: (string | null)[] = [];

  for (const row of rows) {
    if (row.length !== w) {
      throw new Error(
        `Uneven sprite row: expected ${w} pixels, got ${row.length}`,
      );
    }

    for (const character of row) {
      if (character === '.') {
        pixels.push(null);
        continue;
      }
      if (!Object.prototype.hasOwnProperty.call(palette, character)) {
        throw new Error(`Unknown sprite character: ${character}`);
      }
      pixels.push(palette[character]);
    }
  }

  return { w, h, pixels };
}

function getSpriteCanvas(sprite: Sprite): HTMLCanvasElement {
  const cached = spriteCanvases.get(sprite);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = sprite.w;
  canvas.height = sprite.h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas is not available');

  for (let y = 0; y < sprite.h; y += 1) {
    for (let x = 0; x < sprite.w; x += 1) {
      const color = sprite.pixels[y * sprite.w + x];
      if (color === null) continue;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    }
  }

  spriteCanvases.set(sprite, canvas);
  return canvas;
}

/**
 * Draw a sprite at whole world pixels, reusing a per-sprite offscreen canvas
 * so the pixel grid is never resampled.
 */
export function drawSprite(
  ctx: CanvasRenderingContext2D,
  sprite: Sprite,
  x: number,
  y: number,
  opts: { flipX?: boolean } = {},
): void {
  const px = Math.floor(x);
  const py = Math.floor(y);
  const canvas = getSpriteCanvas(sprite);

  if (opts.flipX) {
    ctx.save();
    ctx.translate(px + sprite.w, py);
    ctx.scale(-1, 1);
    ctx.drawImage(canvas, 0, 0);
    ctx.restore();
    return;
  }

  ctx.drawImage(canvas, px, py);
}
