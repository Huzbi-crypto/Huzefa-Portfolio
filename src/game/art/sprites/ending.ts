/**
 * The last two rooms: the Observatory, where the whole trail ends under a
 * night sky, and the nap room, where the big mystery turns out to be a sofa.
 * Built from small helpers so every grid is exact, then handed to the shared
 * decoder like every other sprite. Original pixel art, palette keys only.
 */

type Canvas = string[][];

const blank = (w: number, h: number): Canvas =>
  Array.from({ length: h }, () => Array.from({ length: w }, () => '.'));

const rect = (cv: Canvas, x: number, y: number, w: number, h: number, c: string): void => {
  for (let j = y; j < y + h; j += 1) {
    for (let i = x; i < x + w; i += 1) {
      if (cv[j] && i >= 0 && i < cv[j].length) cv[j][i] = c;
    }
  }
};

const plot = (cv: Canvas, x: number, y: number, c: string): void => rect(cv, x, y, 1, 1, c);

/** A box with a one pixel outline. */
const boxed = (cv: Canvas, x: number, y: number, w: number, h: number, edge: string, fill: string): void => {
  rect(cv, x, y, w, h, edge);
  rect(cv, x + 1, y + 1, w - 2, h - 2, fill);
};

/** Fill an ellipse (centre, radii) one scanline at a time. */
const ellipse = (cv: Canvas, cx: number, cy: number, rx: number, ry: number, c: string): void => {
  for (let y = -ry; y <= ry; y += 1) {
    const span = Math.round(rx * Math.sqrt(1 - (y * y) / (ry * ry + 0.0001)));
    rect(cv, cx - span, cy + y, span * 2 + 1, 1, c);
  }
};

const rows = (cv: Canvas): string[] => cv.map((r) => r.join(''));

function hash(a: number, b: number): number {
  let h = Math.imul(a + 0x9e3779b9, 0x45d9f3b) ^ Math.imul(b + 0x7f4a7c15, 0x27d4eb2d);
  h ^= h >>> 15;
  h = Math.imul(h, 0x2c1b3c6d);
  h ^= h >>> 12;
  return h >>> 0;
}

// --- the Observatory: shell ------------------------------------------------

/** Teal slate, laid in big squares with a joint between each. */
function obsFloor(alt: boolean): string[] {
  const cv = blank(16, 16);
  rect(cv, 0, 0, 16, 16, 'm');
  rect(cv, 0, 0, 16, 1, 'a');
  rect(cv, 0, 8, 16, 1, 'a');
  rect(cv, 0, 0, 1, 8, 'a');
  rect(cv, 8, 8, 1, 8, 'a');
  rect(cv, 1, 1, 15, 1, 'n');
  rect(cv, 1, 9, 15, 1, 'n');
  const flecks = alt
    ? [[4, 4], [11, 5], [3, 12], [13, 13], [6, 3]]
    : [[10, 3], [5, 6], [12, 12], [4, 13]];
  for (const [x, y] of flecks) plot(cv, x, y, 'o');
  return rows(cv);
}

/** The dome wall: navy panels split by ribs, so the room reads as a round hall. */
function obsWall(): string[] {
  const cv = blank(16, 16);
  rect(cv, 0, 0, 16, 16, 'D');
  rect(cv, 0, 0, 2, 16, 'b');
  rect(cv, 2, 0, 1, 16, 'c');
  rect(cv, 14, 0, 2, 16, 'b');
  rect(cv, 13, 0, 1, 16, 'a');
  for (const [x, y] of [[7, 4], [9, 10], [5, 13]]) plot(cv, x, y, 'b');
  return rows(cv);
}

function obsWallBase(): string[] {
  const cv = blank(16, 16);
  rect(cv, 0, 0, 16, 16, 'D');
  rect(cv, 0, 0, 2, 16, 'b');
  rect(cv, 14, 0, 2, 16, 'b');
  rect(cv, 0, 10, 16, 6, 'b');
  rect(cv, 0, 10, 16, 1, 'c');
  rect(cv, 0, 15, 16, 1, 'a');
  return rows(cv);
}

// --- the Observatory: things -----------------------------------------------

/**
 * The telescope: a brass tube on a wooden tripod, aimed up and to the left
 * at the sky. 44 by 64; its feet are the bottom row.
 */
export const TELESCOPE = { w: 44, h: 64 } as const;

function telescope(): string[] {
  const cv = blank(TELESCOPE.w, TELESCOPE.h);

  // Tripod legs from the mount down to the floor.
  const legs: [number, number][] = [[7, 61], [22, 62], [37, 61]];
  for (const [fx, fy] of legs) {
    const top = { x: 24, y: 38 };
    const steps = fy - top.y;
    for (let i = 0; i <= steps; i += 1) {
      const x = Math.round(top.x + ((fx - top.x) * i) / steps);
      const y = top.y + i;
      rect(cv, x - 1, y, 3, 1, 'e');
      plot(cv, x, y, 'g');
    }
    rect(cv, fx - 2, fy, 5, 2, 'a');
    plot(cv, fx, fy, 'r');
  }
  // The mount.
  boxed(cv, 19, 34, 12, 8, 'a', 'r');
  rect(cv, 20, 35, 10, 2, 's');
  rect(cv, 20, 40, 10, 1, 'h');

  // The tube: a long brass parallelogram leaning to the upper left.
  for (let y = 4; y <= 38; y += 1) {
    const x0 = 3 + Math.round((38 - y) * -0.45 + 16);
    rect(cv, x0, y, 10, 1, 'r');
    plot(cv, x0 - 1, y, 'a');
    plot(cv, x0 + 10, y, 'a');
    rect(cv, x0 + 1, y, 2, 1, 's');
    rect(cv, x0 + 8, y, 1, 1, 'h');
  }
  // Bands along the tube.
  for (const y of [10, 22, 33]) {
    const x0 = 3 + Math.round((38 - y) * -0.45 + 16);
    rect(cv, x0 - 1, y, 12, 2, 'h');
    rect(cv, x0, y, 10, 1, 'i');
  }
  // The open end, with a rim of glass.
  const lensX = 3 + Math.round(34 * -0.45 + 16);
  rect(cv, lensX - 2, 2, 14, 3, 'a');
  rect(cv, lensX - 1, 3, 12, 1, 'A');
  rect(cv, lensX + 1, 3, 4, 1, 'C');
  // The eyepiece, down near the mount.
  rect(cv, 30, 36, 6, 3, 'a');
  rect(cv, 31, 36, 4, 2, 'B');
  return rows(cv);
}

/**
 * A round table with a glass top over a map of stars. The top is an
 * ellipse; `TABLE_GLASS` is where the stars are allowed to sit.
 */
export const STAR_TABLE = { w: 112, h: 62 } as const;
export const TABLE_GLASS = { cx: 56, cy: 25, rx: 47, ry: 13 } as const;

function starTable(): string[] {
  const cv = blank(STAR_TABLE.w, STAR_TABLE.h);

  // Foot, stem and the heavy rim.
  ellipse(cv, 56, 56, 22, 5, 'a');
  ellipse(cv, 56, 55, 21, 4, 'f');
  ellipse(cv, 56, 54, 17, 3, 'g');
  rect(cv, 50, 38, 12, 17, 'e');
  rect(cv, 51, 38, 10, 17, 'g');
  rect(cv, 52, 38, 3, 17, 'h');
  rect(cv, 58, 38, 3, 17, 'f');
  rect(cv, 49, 46, 14, 2, 'e');
  rect(cv, 50, 46, 12, 1, 'i');

  ellipse(cv, 56, 31, 55, 18, 'a');
  ellipse(cv, 56, 30, 54, 17, 'f');
  ellipse(cv, 56, 29, 54, 17, 'h');
  ellipse(cv, 56, 28, 52, 15, 'i');
  // The glass, deep and dark, with a ring of brass inside the rim.
  ellipse(cv, 56, 25, 50, 14, 'r');
  ellipse(cv, 56, 25, 49, 13, 'a');
  ellipse(cv, 56, 25, TABLE_GLASS.rx, TABLE_GLASS.ry, 'D');
  // Reflections: a short slanted gleam in each corner of the glass.
  for (let i = 0; i < 5; i += 1) plot(cv, 22 + i, 17 + Math.floor(i / 2), 'c');
  for (let i = 0; i < 4; i += 1) plot(cv, 92 - i, 31 - Math.floor(i / 2), 'c');
  return rows(cv);
}

/** A brass plate on the wall, with room for three real numbers and a date. */
export const PLAQUE = { w: 60, h: 44 } as const;

function plaque(): string[] {
  const cv = blank(PLAQUE.w, PLAQUE.h);
  rect(cv, 0, 0, PLAQUE.w, PLAQUE.h, 'a');
  rect(cv, 1, 1, PLAQUE.w - 2, PLAQUE.h - 2, 'h');
  rect(cv, 2, 2, PLAQUE.w - 4, PLAQUE.h - 4, 'r');
  rect(cv, 2, 2, PLAQUE.w - 4, 1, 's');
  rect(cv, 2, 2, 1, PLAQUE.h - 4, 's');
  rect(cv, PLAQUE.w - 3, 3, 1, PLAQUE.h - 5, 'h');
  rect(cv, 3, PLAQUE.h - 3, PLAQUE.w - 5, 1, 'h');
  rect(cv, 5, 5, PLAQUE.w - 10, PLAQUE.h - 10, 'e');
  rect(cv, 6, 6, PLAQUE.w - 12, PLAQUE.h - 12, 'f');
  // Four screws.
  for (const [x, y] of [[4, 4], [PLAQUE.w - 5, 4], [4, PLAQUE.h - 5], [PLAQUE.w - 5, PLAQUE.h - 5]]) {
    plot(cv, x, y, 'i');
  }
  return rows(cv);
}

/**
 * Where the plaque's engraved rows sit, relative to the plaque. The three
 * numbers sit close together and the date goes under them, all inside the
 * brass: rows are five pixels tall, so 8/15/22 and a date at 30 leave a clear
 * margin at the bottom (the old 36 put the date over the frame).
 */
export const PLAQUE_ROWS = { y: [8, 15, 22], dateY: 30 } as const;

/** The little door with a moon on it. 28 by 48, round-topped. */
export const NAP_DOOR = { w: 28, h: 48 } as const;

function napDoor(): string[] {
  const cv = blank(NAP_DOOR.w, NAP_DOOR.h);
  // Arched frame.
  ellipse(cv, 14, 14, 14, 14, 'a');
  rect(cv, 0, 14, 28, 34, 'a');
  ellipse(cv, 14, 14, 12, 12, 'e');
  rect(cv, 2, 14, 24, 33, 'e');
  ellipse(cv, 14, 14, 11, 11, 'g');
  rect(cv, 3, 14, 22, 33, 'g');
  // Planks.
  for (const x of [9, 14, 19]) rect(cv, x, 6, 1, 41, 'f');
  rect(cv, 4, 14, 1, 33, 'h');
  // Iron straps.
  rect(cv, 3, 22, 22, 2, 'B');
  rect(cv, 3, 36, 22, 2, 'B');
  rect(cv, 3, 22, 22, 1, 'A');
  rect(cv, 3, 36, 22, 1, 'A');
  // The moon: a crescent cut out of a disc.
  ellipse(cv, 14, 11, 5, 5, 's');
  ellipse(cv, 17, 10, 4, 4, 'g');
  rect(cv, 10, 8, 2, 1, 'C');
  // A brass knob.
  ellipse(cv, 21, 31, 2, 2, 'r');
  plot(cv, 20, 30, 's');
  return rows(cv);
}

/** The crack of warm light under the door, once it is unlocked. 24 by 8. */
function napDoorGlow(): string[] {
  const cv = blank(24, 8);
  rect(cv, 2, 0, 20, 1, 's');
  rect(cv, 0, 1, 24, 1, 'r');
  rect(cv, 1, 2, 22, 1, 'r');
  rect(cv, 3, 3, 18, 1, 'r');
  rect(cv, 6, 4, 12, 1, 'r');
  rect(cv, 9, 5, 6, 1, 'r');
  return rows(cv);
}

/** A rack of rolled star charts. 24 by 32. */
function charts(): string[] {
  const cv = blank(24, 32);
  boxed(cv, 0, 0, 24, 32, 'e', 'f');
  rect(cv, 1, 1, 22, 1, 'g');
  for (const [x, y, c] of [[3, 4, 'p'], [11, 4, 'q'], [3, 14, 'q'], [11, 14, 'p'], [3, 24, 'p'], [11, 24, 'q']] as const) {
    ellipse(cv, x + 3, y + 3, 3, 3, 'a');
    ellipse(cv, x + 3, y + 3, 2, 2, c);
    plot(cv, x + 3, y + 3, 'q');
  }
  rect(cv, 17, 4, 5, 5, 'p');
  rect(cv, 17, 14, 5, 5, 'q');
  rect(cv, 17, 24, 5, 5, 'p');
  rect(cv, 1, 11, 22, 1, 'e');
  rect(cv, 1, 21, 22, 1, 'e');
  return rows(cv);
}

/** A scrap of paper on the floor, with its pebble. 12 by 10. */
function scrap(): string[] {
  const cv = blank(12, 10);
  rect(cv, 1, 1, 9, 7, 'a');
  rect(cv, 2, 2, 7, 5, 'p');
  rect(cv, 2, 6, 7, 1, 'q');
  rect(cv, 3, 3, 4, 1, 'q');
  rect(cv, 3, 5, 3, 1, 'q');
  plot(cv, 8, 1, 'a');
  plot(cv, 9, 2, 'p');
  ellipse(cv, 9, 7, 2, 1, 'a');
  rect(cv, 8, 7, 3, 1, 'B');
  plot(cv, 8, 6, 'A');
  return rows(cv);
}

/** A stone stool with a mug of tea nobody drank. 14 by 16. */
function stool(): string[] {
  const cv = blank(14, 16);
  rect(cv, 2, 8, 10, 2, 'a');
  rect(cv, 1, 7, 12, 3, 'e');
  rect(cv, 1, 7, 12, 1, 'h');
  rect(cv, 3, 10, 2, 5, 'e');
  rect(cv, 9, 10, 2, 5, 'e');
  rect(cv, 3, 14, 8, 1, 'a');
  rect(cv, 4, 2, 5, 5, 'a');
  rect(cv, 5, 3, 3, 3, 'C');
  rect(cv, 5, 2, 3, 1, 'p');
  plot(cv, 9, 4, 'a');
  plot(cv, 9, 5, 'a');
  plot(cv, 10, 4, 'a');
  return rows(cv);
}

// --- the nap room -----------------------------------------------------------

/** A window onto the same night, with a moon in it. 36 by 40. */
export const NAP_WINDOW = { w: 36, h: 40 } as const;

function napWindow(): string[] {
  const cv = blank(NAP_WINDOW.w, NAP_WINDOW.h);
  boxed(cv, 0, 0, 36, 40, 'e', 'h');
  boxed(cv, 3, 3, 30, 34, 'a', 'D');
  rect(cv, 17, 3, 2, 34, 'e');
  rect(cv, 3, 19, 30, 2, 'e');
  ellipse(cv, 10, 11, 5, 5, 'p');
  ellipse(cv, 12, 10, 4, 4, 'D');
  plot(cv, 7, 9, 'C');
  for (const [x, y] of [[26, 8], [6, 27], [24, 30], [29, 25], [11, 33]]) plot(cv, x, y, 'C');
  rect(cv, 0, 38, 36, 2, 'f');
  rect(cv, 0, 38, 36, 1, 'g');
  return rows(cv);
}

/** A round wall clock stuck at five past. 14 by 14. */
function clock(): string[] {
  const cv = blank(14, 14);
  ellipse(cv, 7, 7, 6, 6, 'a');
  ellipse(cv, 7, 7, 5, 5, 'h');
  ellipse(cv, 7, 7, 4, 4, 'p');
  rect(cv, 7, 3, 1, 5, 'a');
  rect(cv, 8, 4, 1, 4, 'a');
  plot(cv, 9, 5, 'a');
  plot(cv, 7, 7, 'k');
  plot(cv, 7, 2, 'q');
  plot(cv, 7, 12, 'q');
  plot(cv, 2, 7, 'q');
  plot(cv, 12, 7, 'q');
  return rows(cv);
}

/** Two stacks of manga: one neat, one not. Spines are plain colour bars. 24 by 18. */
function mangaStacks(): string[] {
  const cv = blank(24, 18);
  const neat: [string, string][] = [['E', 'z'], ['k', 'l'], ['n', 'o'], ['y', 'x'], ['h', 'i']];
  neat.forEach(([face, top], i) => {
    const y = 16 - (i + 1) * 3;
    rect(cv, 1, y, 10, 3, 'a');
    rect(cv, 2, y, 8, 2, face);
    rect(cv, 2, y, 8, 1, top);
    rect(cv, 3, y + 1, 3, 1, 'C');
  });
  const mess: [string, string, number][] = [['l', 'k', 0], ['z', 'x', 2], ['o', 'n', -1], ['q', 'p', 1]];
  mess.forEach(([face, top, off], i) => {
    const y = 16 - (i + 1) * 3;
    rect(cv, 13 + off, y, 10, 3, 'a');
    rect(cv, 14 + off, y, 8, 2, face);
    rect(cv, 14 + off, y, 8, 1, top);
    rect(cv, 15 + off, y + 1, 2, 1, 'a');
  });
  rect(cv, 0, 16, 24, 1, 'a');
  return rows(cv);
}

/** The manga that fell, open and face down. 18 by 10. */
function mangaFallen(): string[] {
  const cv = blank(18, 10);
  rect(cv, 0, 7, 18, 1, 'a');
  rect(cv, 1, 3, 16, 4, 'a');
  rect(cv, 2, 3, 6, 4, 'E');
  rect(cv, 10, 3, 6, 4, 'E');
  rect(cv, 2, 3, 6, 1, 'z');
  rect(cv, 10, 3, 6, 1, 'z');
  rect(cv, 8, 2, 2, 5, 'B');
  rect(cv, 3, 5, 3, 1, 'C');
  rect(cv, 11, 5, 3, 1, 'C');
  rect(cv, 1, 7, 16, 1, 'p');
  rect(cv, 0, 8, 18, 1, 'a');
  return rows(cv);
}

// --- the sleeper ---------------------------------------------------------------

export type SleepPose = 'asleep0' | 'asleep1' | 'stir' | 'sitUp' | 'awake';

/** One sprite holds the sofa and whoever is on it. 64 by 46. */
export const SLEEPER = { w: 64, h: 46 } as const;

function sofaBody(cv: Canvas): void {
  // Back, seat, arms and base: teal, deep and lived in.
  boxed(cv, 0, 14, 64, 17, 'a', 'n');
  rect(cv, 1, 15, 62, 1, 'o');
  for (const x of [13, 25, 38, 50]) rect(cv, x, 17, 1, 13, 'm');
  boxed(cv, 8, 29, 48, 11, 'a', 'n');
  rect(cv, 9, 30, 46, 1, 'o');
  rect(cv, 9, 38, 46, 1, 'm');
  boxed(cv, 0, 21, 11, 21, 'a', 'n');
  rect(cv, 1, 22, 9, 1, 'o');
  rect(cv, 8, 24, 2, 17, 'm');
  boxed(cv, 53, 21, 11, 21, 'a', 'n');
  rect(cv, 54, 22, 9, 1, 'o');
  rect(cv, 54, 24, 2, 17, 'm');
  rect(cv, 2, 41, 60, 3, 'a');
  rect(cv, 3, 41, 58, 2, 'm');
  rect(cv, 4, 44, 4, 2, 'e');
  rect(cv, 56, 44, 4, 2, 'e');
}

/** A head, front on and a little tilted: hair, headphones and a face to fill in. */
function head(cv: Canvas, x: number, y: number, face: 'hidden' | 'shut' | 'half' | 'wide'): void {
  // Hair, going in every direction.
  rect(cv, x + 1, y + 2, 15, 6, 'a');
  rect(cv, x + 2, y + 1, 13, 2, 'a');
  for (const [dx, dy] of [[2, -1], [5, -2], [8, -1], [11, -2], [14, -1], [0, 3], [16, 4]]) {
    rect(cv, x + dx, y + dy, 2, 3, 'a');
  }
  for (const [dx, dy] of [[4, 3], [9, 2], [12, 4], [6, 5]]) plot(cv, x + dx, y + dy, 'e');
  // The face.
  rect(cv, x + 2, y + 6, 13, 10, 'a');
  rect(cv, x + 3, y + 6, 11, 9, 'v');
  rect(cv, x + 3, y + 13, 11, 2, 'w');
  rect(cv, x + 4, y + 15, 9, 1, 'a');
  // The headphone band over the hair, and the cups at the ears.
  rect(cv, x + 2, y + 1, 13, 1, 'B');
  rect(cv, x + 3, y + 1, 4, 1, 'A');
  rect(cv, x - 1, y + 5, 4, 8, 'a');
  rect(cv, x, y + 6, 2, 6, 'B');
  rect(cv, x, y + 6, 1, 3, 'A');
  rect(cv, x + 14, y + 5, 4, 8, 'a');
  rect(cv, x + 15, y + 6, 2, 6, 'B');
  rect(cv, x + 15, y + 6, 1, 3, 'A');

  if (face === 'hidden') return;
  // Eyes and brows.
  if (face === 'shut') {
    rect(cv, x + 4, y + 9, 3, 1, 'a');
    rect(cv, x + 10, y + 9, 3, 1, 'a');
    plot(cv, x + 4, y + 7, 'a');
    plot(cv, x + 5, y + 8, 'a');
    plot(cv, x + 12, y + 7, 'a');
    plot(cv, x + 11, y + 8, 'a');
    rect(cv, x + 7, y + 12, 3, 1, 'a');
    plot(cv, x + 6, y + 13, 'a');
    plot(cv, x + 10, y + 13, 'a');
  } else if (face === 'half') {
    rect(cv, x + 4, y + 9, 3, 2, 'C');
    rect(cv, x + 10, y + 9, 3, 2, 'C');
    rect(cv, x + 4, y + 8, 3, 1, 'a');
    rect(cv, x + 10, y + 8, 3, 1, 'a');
    plot(cv, x + 5, y + 10, 'a');
    plot(cv, x + 11, y + 10, 'a');
    rect(cv, x + 7, y + 13, 3, 1, 'a');
  } else {
    rect(cv, x + 4, y + 8, 3, 3, 'C');
    rect(cv, x + 10, y + 8, 3, 3, 'C');
    rect(cv, x + 5, y + 9, 2, 2, 'a');
    rect(cv, x + 11, y + 9, 2, 2, 'a');
    plot(cv, x + 4, y + 6, 'a');
    plot(cv, x + 5, y + 6, 'a');
    plot(cv, x + 12, y + 6, 'a');
    plot(cv, x + 13, y + 6, 'a');
    // A smirk, slightly lopsided.
    rect(cv, x + 6, y + 13, 5, 1, 'a');
    plot(cv, x + 11, y + 12, 'a');
    plot(cv, x + 5, y + 12, 'w');
  }
}

/** An open manga, face down, covering a face: spine ridge, two cover halves, page edge. */
function mangaOnFace(cv: Canvas, x: number, y: number): void {
  rect(cv, x, y + 1, 17, 12, 'a');
  rect(cv, x + 1, y + 1, 7, 11, 'E');
  rect(cv, x + 9, y + 1, 7, 11, 'E');
  rect(cv, x + 1, y + 1, 7, 1, 'z');
  rect(cv, x + 9, y + 1, 7, 1, 'z');
  rect(cv, x + 8, y, 2, 13, 'B');
  rect(cv, x + 2, y + 4, 4, 1, 'C');
  rect(cv, x + 10, y + 4, 4, 1, 'C');
  rect(cv, x + 2, y + 7, 3, 1, 'C');
  rect(cv, x + 1, y + 12, 15, 1, 'p');
  rect(cv, x, y + 13, 17, 1, 'a');
}

/** The hoodie with its pockets, strings and a hood bunched at the neck. */
function hoodieLying(cv: Canvas, lift: number): void {
  boxed(cv, 24, 27 - lift, 25, 13 + lift, 'a', 'x');
  rect(cv, 25, 28 - lift, 23, 1, 'z');
  rect(cv, 25, 37, 23, 2, 'y');
  // The hood, bunched where the neck is.
  boxed(cv, 20, 29, 9, 9, 'a', 'y');
  rect(cv, 21, 30, 3, 5, 'x');
  // Strings and a pocket.
  plot(cv, 30, 31 - lift, 'C');
  plot(cv, 31, 33 - lift, 'C');
  plot(cv, 34, 31 - lift, 'C');
  rect(cv, 34, 35, 9, 3, 'y');
  rect(cv, 34, 35, 9, 1, 'a');
}

/** Jeans bent at the knee, ending in a pair of socks hung over the arm. */
function legsLying(cv: Canvas): void {
  boxed(cv, 46, 29, 12, 11, 'a', 'B');
  rect(cv, 47, 30, 10, 1, 'A');
  boxed(cv, 50, 24, 8, 7, 'a', 'B');
  rect(cv, 51, 25, 6, 1, 'A');
  boxed(cv, 55, 14, 9, 11, 'a', 'C');
  rect(cv, 56, 22, 7, 2, 'p');
  rect(cv, 57, 16, 5, 1, 'q');
}

function sleeper(pose: SleepPose): string[] {
  const cv = blank(SLEEPER.w, SLEEPER.h);
  sofaBody(cv);

  if (pose === 'asleep0' || pose === 'asleep1') {
    const lift = pose === 'asleep1' ? 1 : 0;
    head(cv, 7, 12, 'hidden');
    hoodieLying(cv, lift);
    legsLying(cv);
    mangaOnFace(cv, 9, 20 - lift);
    // The arm dangling over the front of the sofa.
    boxed(cv, 44, 33, 6, 11, 'a', 'x');
    rect(cv, 45, 34, 2, 8, 'z');
    boxed(cv, 44, 42, 6, 4, 'a', 'v');
  } else if (pose === 'stir') {
    head(cv, 7, 12, 'shut');
    hoodieLying(cv, 0);
    legsLying(cv);
    // The manga has slid down onto the chest.
    mangaOnFace(cv, 26, 26);
    boxed(cv, 44, 33, 6, 11, 'a', 'x');
    boxed(cv, 44, 42, 6, 4, 'a', 'v');
  } else {
    // Sitting up in the middle of the sofa, manga in lap, hair a disaster.
    rect(cv, 8, 29, 48, 11, 'n');
    boxed(cv, 8, 29, 48, 11, 'a', 'n');
    rect(cv, 9, 30, 46, 1, 'o');
    head(cv, 23, 0, pose === 'awake' ? 'wide' : 'half');
    // Torso and arms.
    boxed(cv, 20, 16, 24, 20, 'a', 'x');
    rect(cv, 21, 17, 22, 1, 'z');
    rect(cv, 21, 33, 22, 2, 'y');
    plot(cv, 29, 20, 'C');
    plot(cv, 30, 22, 'C');
    plot(cv, 34, 20, 'C');
    plot(cv, 33, 22, 'C');
    rect(cv, 26, 30, 12, 4, 'y');
    rect(cv, 26, 30, 12, 1, 'a');
    // Jeans down the front of the seat, socks on the floor.
    boxed(cv, 22, 34, 9, 10, 'a', 'B');
    boxed(cv, 33, 34, 9, 10, 'a', 'B');
    rect(cv, 23, 35, 7, 1, 'A');
    rect(cv, 34, 35, 7, 1, 'A');
    boxed(cv, 21, 43, 11, 3, 'a', 'C');
    boxed(cv, 32, 43, 11, 3, 'a', 'C');
    // The manga in the lap.
    rect(cv, 26, 28, 12, 7, 'a');
    rect(cv, 27, 28, 5, 6, 'E');
    rect(cv, 32, 28, 5, 6, 'E');
    rect(cv, 31, 27, 2, 8, 'B');
    rect(cv, 28, 30, 3, 1, 'C');
    rect(cv, 33, 30, 3, 1, 'C');
    if (pose === 'awake') {
      // A hand up, a sleeve down: "hi".
      boxed(cv, 44, 16, 6, 12, 'a', 'x');
      rect(cv, 45, 17, 2, 9, 'z');
      boxed(cv, 44, 8, 8, 9, 'a', 'v');
      rect(cv, 45, 9, 6, 2, 'v');
      rect(cv, 45, 11, 6, 1, 'w');
      for (const x of [44, 46, 48, 50]) rect(cv, x, 6, 2, 3, 'v');
      for (const x of [44, 46, 48, 50]) plot(cv, x, 5, 'a');
      boxed(cv, 14, 28, 6, 9, 'a', 'x');
      boxed(cv, 14, 35, 6, 4, 'a', 'v');
    } else {
      // Both hands holding the manga, one rubbing an eye.
      boxed(cv, 14, 24, 6, 12, 'a', 'x');
      boxed(cv, 14, 34, 6, 4, 'a', 'v');
      boxed(cv, 44, 14, 6, 14, 'a', 'x');
      boxed(cv, 41, 12, 6, 5, 'a', 'v');
    }
  }
  return rows(cv);
}

/** A mug on the floor beside the sofa. 10 by 10. */
function mug(): string[] {
  const cv = blank(10, 10);
  rect(cv, 1, 2, 6, 7, 'a');
  rect(cv, 2, 3, 4, 5, 'x');
  rect(cv, 2, 3, 4, 1, 'z');
  rect(cv, 7, 3, 2, 1, 'a');
  rect(cv, 8, 4, 1, 3, 'a');
  rect(cv, 7, 6, 2, 1, 'a');
  rect(cv, 1, 9, 7, 1, 'a');
  return rows(cv);
}

export const ENDING_SPRITE_GRIDS: Record<string, string[]> = {
  obsFloor: obsFloor(false),
  obsFloorAlt: obsFloor(true),
  obsWall: obsWall(),
  obsWallBase: obsWallBase(),
  obsTelescope: telescope(),
  obsTable: starTable(),
  obsPlaque: plaque(),
  obsNapDoor: napDoor(),
  obsNapDoorGlow: napDoorGlow(),
  obsCharts: charts(),
  obsStool: stool(),
  clueScrap: scrap(),
  napWindow: napWindow(),
  napClock: clock(),
  napMangaStacks: mangaStacks(),
  napMangaFallen: mangaFallen(),
  napMug: mug(),
  sleeperAsleep0: sleeper('asleep0'),
  sleeperAsleep1: sleeper('asleep1'),
  sleeperStir: sleeper('stir'),
  sleeperSitUp: sleeper('sitUp'),
  sleeperAwake: sleeper('awake'),
};

export const ENDING_NAMES = Object.keys(ENDING_SPRITE_GRIDS);

/** A 3 by 5 digit font for the plaque's real numbers. Original drawing. */
export const DIGIT_GLYPHS: Record<string, string[]> = {
  '0': ['###', '#.#', '#.#', '#.#', '###'],
  '1': ['.#.', '##.', '.#.', '.#.', '###'],
  '2': ['##.', '..#', '.#.', '#..', '###'],
  '3': ['##.', '..#', '.#.', '..#', '##.'],
  '4': ['#.#', '#.#', '###', '..#', '..#'],
  '5': ['###', '#..', '##.', '..#', '##.'],
  '6': ['.##', '#..', '###', '#.#', '###'],
  '7': ['###', '..#', '.#.', '.#.', '.#.'],
  '8': ['###', '#.#', '###', '#.#', '###'],
  '9': ['###', '#.#', '###', '..#', '##.'],
  '-': ['...', '...', '###', '...', '...'],
};

/** The pixels of a run of digits (and dashes), `[x, y]` pairs, 4 pixels per character. */
export function digitPixels(text: string): { points: [number, number][]; w: number } {
  const points: [number, number][] = [];
  let x = 0;
  for (const ch of text) {
    const glyph = DIGIT_GLYPHS[ch];
    if (glyph) {
      glyph.forEach((row, y) => {
        for (let i = 0; i < 3; i += 1) if (row[i] === '#') points.push([x + i, y]);
      });
    }
    x += 4;
  }
  return { points, w: Math.max(0, x - 1) };
}

export { hash as endingHash };
