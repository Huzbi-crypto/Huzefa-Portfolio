/**
 * The workshop under the hall: a cool teal cellar of workbenches and half
 * finished machines. Everything is built from small helpers so the grids are
 * exact, then decoded like every other sprite. Palette keys only.
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
const box = (cv: Canvas, x: number, y: number, w: number, h: number, edge: string, fill: string): void => {
  rect(cv, x, y, w, h, edge);
  rect(cv, x + 1, y + 1, w - 2, h - 2, fill);
};

function line(cv: Canvas, x0: number, y0: number, x1: number, y1: number, c: string): void {
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  let x = x0;
  let y = y0;
  for (;;) {
    plot(cv, x, y, c);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }
}

const rows = (cv: Canvas): string[] => cv.map((r) => r.join(''));

// --- tiles -----------------------------------------------------------------

/** Wood planks, laid crosswise. Cool and dark so the lantern's warmth shows. */
const floorTile = (alt: boolean): string[] => {
  const cv = blank(16, 16);
  rect(cv, 0, 0, 16, 16, 'f');
  rect(cv, 0, 0, 16, 1, 'e');
  rect(cv, 0, 8, 16, 1, 'e');
  // Plank ends, staggered row to row.
  rect(cv, 10, 1, 1, 7, 'e');
  rect(cv, 3, 9, 1, 7, 'e');
  // Grain.
  for (const [x, y] of [[2, 3], [3, 3], [6, 5], [7, 5], [13, 2], [14, 6], [7, 12], [8, 12], [12, 11], [13, 14]]) {
    plot(cv, x, y, 'g');
  }
  plot(cv, 1, 1, 'g');
  plot(cv, 11, 9, 'g');
  if (alt) {
    // A dark oil stain and a knot.
    rect(cv, 4, 3, 5, 3, 'e');
    rect(cv, 5, 2, 3, 1, 'e');
    rect(cv, 5, 6, 3, 1, 'e');
    plot(cv, 5, 4, 'f');
    rect(cv, 12, 11, 2, 2, 'g');
    plot(cv, 12, 11, 'e');
  }
  return rows(cv);
};

/** Teal board walls with dark seams: the cellar's own colour, unlike the hall's violet. */
const wallTile = (): string[] => {
  const cv = blank(16, 16);
  rect(cv, 0, 0, 16, 16, 'm');
  for (const x of [0, 8]) rect(cv, x, 0, 1, 16, 'a');
  for (const x of [1, 9]) rect(cv, x, 0, 1, 16, 'n');
  rect(cv, 0, 0, 16, 1, 'a');
  // Nails and a bit of grain.
  for (const [x, y] of [[3, 3], [11, 3], [3, 12], [11, 12]]) plot(cv, x, y, 'a');
  for (const [x, y] of [[5, 6], [6, 6], [13, 9], [14, 9], [4, 10]]) plot(cv, x, y, 'n');
  return rows(cv);
};

const wallBaseTile = (): string[] => {
  const cv = blank(16, 16);
  rect(cv, 0, 0, 16, 16, 'm');
  for (const x of [0, 8]) rect(cv, x, 0, 1, 9, 'a');
  for (const x of [1, 9]) rect(cv, x, 0, 1, 9, 'n');
  rect(cv, 0, 9, 16, 1, 'a');
  // A skirting board and the dark underneath.
  rect(cv, 0, 10, 16, 3, 'n');
  rect(cv, 0, 10, 16, 1, 'o');
  rect(cv, 0, 13, 16, 1, 'a');
  rect(cv, 0, 14, 16, 2, 'a');
  for (let x = 0; x < 16; x += 2) plot(cv, x, 15, 'm');
  return rows(cv);
};

// --- wall decor ------------------------------------------------------------

/** A pegboard with painted tool outlines and the tools hanging in them. */
const PEGBOARD = (() => {
  const w = 48;
  const h = 28;
  const cv = blank(w, h);
  box(cv, 0, 0, w, h, 'e', 'g');
  rect(cv, 1, 1, w - 2, 1, 'h');
  for (let y = 4; y < h - 2; y += 4) {
    for (let x = 4; x < w - 2; x += 4) plot(cv, x, y, 'e');
  }
  // Hammer.
  rect(cv, 7, 6, 2, 14, 'i');
  rect(cv, 7, 6, 1, 14, 'h');
  rect(cv, 4, 4, 8, 4, 'B');
  rect(cv, 4, 4, 8, 1, 'A');
  rect(cv, 4, 7, 8, 1, 'a');
  // Wrench: a long arm with an open jaw.
  rect(cv, 17, 9, 2, 14, 'A');
  rect(cv, 17, 9, 1, 14, 'C');
  rect(cv, 15, 4, 6, 6, 'A');
  rect(cv, 17, 4, 2, 3, 'g');
  rect(cv, 15, 4, 6, 1, 'C');
  // Saw: a blade with teeth.
  rect(cv, 25, 5, 10, 8, 'A');
  rect(cv, 25, 5, 10, 1, 'C');
  for (let x = 25; x < 35; x += 2) {
    plot(cv, x, 13, 'A');
    plot(cv, x + 1, 14, 'A');
  }
  rect(cv, 33, 8, 5, 4, 'k');
  rect(cv, 34, 9, 3, 2, 'g');
  // Pliers with red handles.
  line(cv, 41, 5, 43, 14, 'B');
  line(cv, 44, 5, 42, 14, 'B');
  rect(cv, 40, 14, 2, 7, 'k');
  rect(cv, 43, 14, 2, 7, 'k');
  plot(cv, 40, 14, 'l');
  plot(cv, 43, 14, 'l');
  // Tape measure.
  rect(cv, 28, 17, 8, 6, 'r');
  rect(cv, 28, 17, 8, 1, 's');
  rect(cv, 30, 19, 4, 2, 'e');
  return rows(cv);
})();

/** A shelf of jars: bolts, cogs and buttons. */
const JARS = (() => {
  const w = 40;
  const h = 24;
  const cv = blank(w, h);
  const jar = (x: number, fill: string, hi: string): void => {
    rect(cv, x + 1, 3, 8, 2, 'B'); // lid
    rect(cv, x + 1, 3, 8, 1, 'A');
    box(cv, x, 5, 10, 14, 'o', 'n');
    rect(cv, x + 1, 6, 1, 11, 'C'); // glass shine
    rect(cv, x + 2, 11, 7, 7, fill);
    for (const [dx, dy] of [[3, 11], [6, 12], [4, 14], [7, 16]]) plot(cv, x + dx, dy, hi);
  };
  jar(2, 'A', 'C');
  jar(15, 'r', 's');
  jar(28, 'k', 'l');
  rect(cv, 0, 19, w, 3, 'g');
  rect(cv, 0, 19, w, 1, 'i');
  rect(cv, 0, 22, w, 1, 'e');
  for (const x of [4, 34]) rect(cv, x, 23, 2, 1, 'e');
  return rows(cv);
})();

/** A pinned blueprint of a cog, because everything here is half designed. */
const BLUEPRINT = (() => {
  const w = 28;
  const h = 22;
  const cv = blank(w, h);
  box(cv, 0, 0, w, h, 'y', 'x');
  // The cog, drawn as a ring with teeth.
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const d = Math.hypot(x - 10.5, y - 11.5);
      if (d > 3.4 && d < 5.2) plot(cv, x, y, 'z');
    }
  }
  for (const [x, y] of [[10, 5], [11, 5], [10, 17], [11, 17], [4, 11], [4, 12], [17, 11], [17, 12]]) plot(cv, x, y, 'z');
  plot(cv, 10, 11, 'C');
  // Measurements.
  rect(cv, 20, 4, 5, 1, 'z');
  rect(cv, 20, 7, 4, 1, 'z');
  rect(cv, 20, 10, 5, 1, 'z');
  line(cv, 20, 15, 25, 15, 'C');
  plot(cv, 20, 14, 'C');
  plot(cv, 25, 14, 'C');
  plot(cv, 3, 3, 'k'); // pins
  plot(cv, 24, 18, 'k');
  return rows(cv);
})();

// --- the ways through ------------------------------------------------------

/** The hatch in the hall's floor: open, with a warm glow and the top of a ladder. */
const HATCH = (() => {
  const w = 32;
  const h = 22;
  const cv = blank(w, h);
  box(cv, 0, 0, w, h, 'e', 'f');
  rect(cv, 1, 1, w - 2, 1, 'g');
  // The opening.
  rect(cv, 4, 4, 24, 14, 'a');
  rect(cv, 4, 4, 24, 1, 'f');
  // Warm light from below, in dithered rows near the edge.
  for (let y = 5; y < 17; y += 1) {
    for (let x = 5; x < 27; x += 1) {
      const level = y < 8 ? 2 : y < 12 ? 3 : 4;
      if ((x + y) % level === 0 && y > 7 - (x % 3)) plot(cv, x, y, y < 10 ? 'r' : 'h');
    }
  }
  // The ladder going down.
  rect(cv, 11, 5, 1, 12, 'i');
  rect(cv, 20, 5, 1, 12, 'i');
  for (let y = 7; y < 17; y += 3) rect(cv, 12, y, 8, 1, 'h');
  // Hinges.
  rect(cv, 6, 1, 4, 2, 'B');
  rect(cv, 22, 1, 4, 2, 'B');
  return rows(cv);
})();

/** The way up, on the cellar wall: a ladder to a hatch with cool light round it. */
const LADDER = (() => {
  const w = 20;
  const h = 44;
  const cv = blank(w, h);
  rect(cv, 0, 0, w, 10, 'a');
  rect(cv, 2, 2, 16, 8, 'b');
  rect(cv, 4, 3, 12, 7, 'a');
  // Cool light leaking down from the hall above.
  for (let y = 3; y < 10; y += 1) {
    for (let x = 4; x < 16; x += 1) if ((x + y) % 3 === 0) plot(cv, x, y, 'd');
  }
  rect(cv, 4, 0, 1, h, 'h');
  rect(cv, 15, 0, 1, h, 'h');
  rect(cv, 4, 0, 1, h, 'g');
  rect(cv, 15, 0, 1, h, 'g');
  plot(cv, 4, 11, 'i');
  plot(cv, 15, 11, 'i');
  for (let y = 12; y < h - 2; y += 6) {
    rect(cv, 5, y, 10, 2, 'i');
    rect(cv, 5, y + 1, 10, 1, 'g');
  }
  return rows(cv);
})();

// --- the rickety machine of ai-anime ---------------------------------------

/** Where the picture appears on the machine, in sprite pixels. */
export const AI_CANVAS = { x: 14, y: 12, w: 24, h: 24 } as const;
/** Where the bulb on top sits, in sprite pixels. */
export const AI_BULB = { x: 25, y: 5 } as const;
/** The lever's pivot, in sprite pixels. */
export const AI_LEVER_AT = { x: 52, y: 30 } as const;

const MACHINE = (() => {
  const w = 60;
  const h = 72;
  const cv = blank(w, h);

  // Legs, a little crooked, with a cross brace.
  rect(cv, 8, 58, 5, 14, 'e');
  rect(cv, 9, 58, 3, 13, 'f');
  rect(cv, 45, 58, 5, 13, 'e');
  rect(cv, 46, 58, 3, 12, 'f');
  line(cv, 11, 61, 46, 69, 'e');
  line(cv, 11, 62, 46, 70, 'f');
  rect(cv, 7, 70, 7, 2, 'a');
  rect(cv, 44, 69, 7, 3, 'a');

  // The body: planks, a patch and some bolts.
  box(cv, 4, 42, 48, 18, 'e', 'g');
  rect(cv, 5, 43, 46, 1, 'h');
  for (const x of [16, 28, 40]) rect(cv, x, 44, 1, 15, 'f');
  box(cv, 41, 47, 9, 9, 'e', 'i'); // a patch, nailed on
  for (const [x, y] of [[43, 49], [47, 49], [43, 53], [47, 53]]) plot(cv, x, y, 'A');
  for (const [x, y] of [[7, 46], [7, 56], [48, 46], [48, 56]]) plot(cv, x, y, 'B');
  // Rickety: the lower left corner has slipped.
  rect(cv, 4, 58, 3, 2, 'e');
  plot(cv, 5, 58, 'f');
  // A slot where nothing ever comes out.
  rect(cv, 9, 55, 14, 3, 'a');

  // The frame, held up on two posts.
  rect(cv, 16, 36, 3, 8, 'e');
  rect(cv, 17, 36, 1, 8, 'f');
  rect(cv, 35, 36, 3, 8, 'e');
  rect(cv, 36, 36, 1, 8, 'f');
  box(cv, 10, 8, 36, 32, 'e', 'i');
  rect(cv, 11, 9, 34, 1, 'p'); // top light
  rect(cv, 11, 9, 1, 30, 'p');
  rect(cv, 12, 10, 32, 30, 'h');
  rect(cv, AI_CANVAS.x - 1, AI_CANVAS.y - 1, AI_CANVAS.w + 2, AI_CANVAS.h + 2, 'e');
  rect(cv, AI_CANVAS.x, AI_CANVAS.y, AI_CANVAS.w, AI_CANVAS.h, 'q');
  // Corner pins of the frame.
  for (const [x, y] of [[12, 10], [43, 10], [12, 37], [43, 37]]) plot(cv, x, y, 'B');

  // A bulb post on top, and a bent pipe with a rivet or two on the left.
  rect(cv, 24, 6, 3, 3, 'B');
  rect(cv, 22, 2, 7, 5, 'A');
  rect(cv, 22, 2, 7, 1, 'C');
  rect(cv, 3, 14, 4, 30, 'B');
  rect(cv, 3, 14, 1, 30, 'A');
  rect(cv, 3, 10, 12, 4, 'B');
  rect(cv, 3, 10, 12, 1, 'A');
  for (const y of [20, 28, 36]) rect(cv, 2, y, 6, 1, 'A');

  // The lever's slot on the right-hand side.
  rect(cv, 51, 26, 3, 22, 'a');
  rect(cv, 49, 46, 8, 4, 'e');
  rect(cv, 50, 47, 6, 2, 'B');

  return rows(cv);
})();

const LEVER_W = 12;
const LEVER_H = 26;

/** The handle up, ready to be pulled. */
const LEVER_UP = (() => {
  const cv = blank(LEVER_W, LEVER_H);
  rect(cv, 5, 6, 3, 20, 'A');
  rect(cv, 5, 6, 1, 20, 'C');
  rect(cv, 7, 6, 1, 20, 'B');
  rect(cv, 2, 0, 8, 7, 'a');
  rect(cv, 3, 1, 6, 5, 'k');
  rect(cv, 3, 1, 6, 1, 'l');
  rect(cv, 3, 1, 2, 3, 'l');
  return rows(cv);
})();

/** The handle pulled down: a short stub, the knob low and near the body. */
const LEVER_DOWN = (() => {
  const cv = blank(LEVER_W, LEVER_H);
  rect(cv, 5, 18, 3, 8, 'A');
  rect(cv, 5, 18, 1, 8, 'C');
  rect(cv, 7, 18, 1, 8, 'B');
  rect(cv, 2, 10, 8, 7, 'a');
  rect(cv, 3, 11, 6, 5, 'k');
  rect(cv, 3, 11, 6, 1, 'l');
  rect(cv, 3, 11, 2, 3, 'l');
  return rows(cv);
})();

const gear = (turn: boolean): string[] => {
  const cv = blank(11, 11);
  for (let y = 0; y < 11; y += 1) {
    for (let x = 0; x < 11; x += 1) {
      const d = Math.hypot(x - 5, y - 5);
      if (d <= 3.6) cv[y][x] = d <= 1.4 ? 'a' : 'A';
    }
  }
  const teeth = turn
    ? [[5, 0], [5, 10], [0, 5], [10, 5], [1, 1], [9, 9], [9, 1], [1, 9]]
    : [[4, 0], [6, 0], [4, 10], [6, 10], [0, 4], [0, 6], [10, 4], [10, 6]];
  for (const [x, y] of teeth) plot(cv, x, y, 'B');
  for (const [x, y] of turn
    ? [[5, 1], [5, 9], [1, 5], [9, 5]]
    : [[4, 1], [6, 1], [4, 9], [6, 9], [1, 4], [1, 6], [9, 4], [9, 6]]) {
    plot(cv, x, y, 'A');
  }
  plot(cv, 3, 3, 'C');
  return rows(cv);
};

// --- the robots and their flow chart ---------------------------------------

/** A small boxy robot, eyes left dark: the exhibit lights them. */
const ROBOT = (() => {
  const cv = blank(14, 20);
  rect(cv, 6, 0, 2, 4, 'B'); // antenna
  rect(cv, 5, 0, 4, 1, 'A');
  box(cv, 1, 4, 12, 8, 'a', 'A');
  rect(cv, 2, 5, 10, 1, 'C');
  rect(cv, 2, 5, 1, 5, 'C');
  rect(cv, 3, 7, 8, 3, 'a'); // visor
  box(cv, 2, 12, 10, 6, 'a', 'B');
  rect(cv, 3, 13, 8, 1, 'A');
  rect(cv, 5, 15, 4, 2, 'a'); // a little dial
  rect(cv, 0, 13, 2, 4, 'a'); // arms
  rect(cv, 12, 13, 2, 4, 'a');
  rect(cv, 2, 18, 4, 2, 'a'); // feet
  rect(cv, 8, 18, 4, 2, 'a');
  return rows(cv);
})();

/** The drafting table with the flow chart chalked on it. */
export const FLOW_BOARD_ORIGIN = { x: 4, y: 6 } as const;

const FLOW_BOARD = (() => {
  const w = 152;
  const h = 56;
  const cv = blank(w, h);
  // The top: slate with a wooden frame.
  box(cv, 0, 0, w, 42, 'e', 'g');
  rect(cv, 1, 1, w - 2, 1, 'h');
  rect(cv, 3, 3, w - 6, 36, 'b');
  rect(cv, 3, 3, w - 6, 1, 'a');
  // Chart lines: each hop is an arrow with a head.
  const pads = [
    { x: 18, y: 24 },
    { x: 54, y: 16 },
    { x: 90, y: 28 },
    { x: 126, y: 18 },
  ];
  for (let i = 0; i < pads.length - 1; i += 1) {
    const a = pads[i];
    const b = pads[i + 1];
    line(cv, a.x + 8, a.y, b.x - 8, b.y, 'B');
    line(cv, a.x + 8, a.y + 1, b.x - 8, b.y + 1, 'B');
    // Arrow head.
    plot(cv, b.x - 9, b.y - 2, 'A');
    plot(cv, b.x - 10, b.y - 3, 'A');
    plot(cv, b.x - 9, b.y + 3, 'A');
    plot(cv, b.x - 10, b.y + 4, 'A');
    plot(cv, b.x - 8, b.y, 'A');
  }
  for (const p of pads) {
    box(cv, p.x - 10, p.y - 4, 20, 14, 'B', 'c');
    rect(cv, p.x - 9, p.y - 3, 18, 1, 'd');
  }
  // Scuffs of chalk.
  for (const [x, y] of [[8, 6], [9, 6], [140, 34], [141, 34], [60, 36], [100, 6]]) plot(cv, x, y, 'B');
  // Front face and legs.
  rect(cv, 0, 42, w, 5, 'f');
  rect(cv, 0, 42, w, 1, 'e');
  rect(cv, 0, 46, w, 1, 'e');
  for (const x of [6, 138]) {
    rect(cv, x, 47, 8, 9, 'e');
    rect(cv, x + 1, 47, 6, 8, 'f');
  }
  return rows(cv);
})();

/** Where each chart pad sits on the board sprite, so robots stand on them. */
export const FLOW_PADS = [
  { x: 18, y: 24 },
  { x: 54, y: 16 },
  { x: 90, y: 28 },
  { x: 126, y: 18 },
] as const;

// --- the tin cans ----------------------------------------------------------

/** Where the open end of a can is, in sprite pixels. */
export const CAN_MOUTH = { x: 9, y: 9 } as const;
/** Where the string is tied, in sprite pixels. */
export const CAN_KNOT = { x: 4, y: 22 } as const;

const CAN = (() => {
  const cv = blank(20, 26);
  // The tin: ribbed side, a label and an open end facing the visitor.
  box(cv, 2, 8, 16, 16, 'a', 'A');
  rect(cv, 3, 9, 14, 1, 'C');
  rect(cv, 3, 9, 2, 13, 'C');
  rect(cv, 15, 10, 2, 13, 'B');
  rect(cv, 3, 14, 14, 5, 'k');
  rect(cv, 3, 14, 14, 1, 'l');
  rect(cv, 3, 18, 14, 1, 'j');
  rect(cv, 6, 15, 8, 2, 'p'); // the label
  for (const y of [11, 22]) rect(cv, 3, y, 14, 1, 'B');
  // The mouth.
  rect(cv, 3, 3, 14, 7, 'a');
  rect(cv, 4, 2, 12, 9, 'a');
  rect(cv, 5, 3, 10, 7, 'B');
  rect(cv, 6, 4, 8, 5, 'a');
  rect(cv, 5, 3, 10, 1, 'A');
  // A knot at the back for the string.
  rect(cv, 3, 21, 2, 3, 'p');
  return rows(cv);
})();

/** A crate to stand a can on. */
const CAN_CRATE = (() => {
  const cv = blank(26, 16);
  box(cv, 0, 0, 26, 16, 'e', 'g');
  rect(cv, 1, 1, 24, 1, 'h');
  rect(cv, 1, 6, 24, 1, 'f');
  rect(cv, 1, 11, 24, 1, 'f');
  for (const [x, y] of [[3, 3], [22, 3], [3, 13], [22, 13]]) plot(cv, x, y, 'B');
  rect(cv, 0, 14, 26, 2, 'a');
  return rows(cv);
})();

// --- the compiler belt -----------------------------------------------------

const BELT_W = 148;
const BELT_H = 22;

/** Where each station stands along the belt, in belt sprite pixels. */
export const BELT_STATIONS = [10, 44, 78, 112] as const;
/** Height of the belt's top surface above the sprite bottom, where items ride. */
export const BELT_SURFACE_Y = 8;

const belt = (shift: number): string[] => {
  const cv = blank(BELT_W, BELT_H);
  // Frame and rollers.
  box(cv, 0, 2, BELT_W, 16, 'a', 'B');
  rect(cv, 1, 3, BELT_W - 2, 1, 'A');
  // The moving rubber: dark with tick marks that crawl.
  rect(cv, 6, 5, BELT_W - 12, 9, 'a');
  rect(cv, 6, 5, BELT_W - 12, 1, 'b');
  for (let x = 6 + shift; x < BELT_W - 8; x += 6) {
    rect(cv, x, 7, 1, 5, 'b');
    plot(cv, x + 1, 9, 'c');
  }
  // End rollers.
  for (const x of [1, BELT_W - 7]) {
    rect(cv, x, 4, 6, 12, 'A');
    rect(cv, x, 4, 6, 1, 'C');
    rect(cv, x + 2, 6, 2, 8, 'B');
  }
  // Legs.
  for (const x of [14, 70, 126]) {
    rect(cv, x, 18, 5, 4, 'a');
    rect(cv, x + 1, 18, 3, 3, 'B');
  }
  return rows(cv);
};

/** A gantry that straddles the belt: posts, a lamp box and an icon painted on it. */
const STATION = (() => {
  const cv = blank(26, 40);
  // Posts at the back and the front of the belt.
  rect(cv, 2, 12, 4, 26, 'a');
  rect(cv, 3, 12, 2, 25, 'B');
  rect(cv, 20, 12, 4, 26, 'a');
  rect(cv, 21, 12, 2, 25, 'B');
  // The box that does the work.
  box(cv, 0, 4, 26, 16, 'a', 'A');
  rect(cv, 1, 5, 24, 1, 'C');
  rect(cv, 1, 5, 1, 14, 'C');
  rect(cv, 2, 13, 22, 1, 'B');
  // Lamp socket on top.
  rect(cv, 10, 0, 6, 5, 'a');
  rect(cv, 11, 1, 4, 3, 'B');
  return rows(cv);
})();

/** Where the lamp sits on a station sprite. */
export const STATION_LAMP = { x: 11, y: 1, w: 4, h: 3 } as const;

const iconSprite = (draw: (cv: Canvas) => void): string[] => {
  const cv = blank(14, 7);
  rect(cv, 0, 0, 14, 7, 'a');
  draw(cv);
  return rows(cv);
};

const ICON_TOKENS = iconSprite((cv) => {
  rect(cv, 1, 2, 3, 3, 'o');
  rect(cv, 5, 2, 3, 3, 'r');
  rect(cv, 9, 2, 3, 3, 'z');
});
const ICON_TREE = iconSprite((cv) => {
  rect(cv, 6, 0, 2, 2, 't');
  line(cv, 6, 2, 3, 4, 't');
  line(cv, 7, 2, 10, 4, 't');
  rect(cv, 2, 4, 3, 2, 't');
  rect(cv, 9, 4, 3, 2, 't');
});
const ICON_CODE = iconSprite((cv) => {
  for (const y of [1, 3, 5]) rect(cv, 1, y, 3 + ((y * 5) % 7), 1, 'x');
  for (const y of [1, 3, 5]) rect(cv, 11, y, 2, 1, 'z');
});
const ICON_ASM = iconSprite((cv) => {
  for (const [x, y] of [[1, 1], [5, 1], [9, 1], [1, 4], [5, 4], [9, 4]]) rect(cv, x, y, 3, 2, 'r');
});

// --- the sprite set --------------------------------------------------------

export const WORKSHOP_GRIDS: Record<string, string[]> = {
  workshopFloor: floorTile(false),
  workshopFloorAlt: floorTile(true),
  workshopWall: wallTile(),
  workshopWallBase: wallBaseTile(),
  workshopPegboard: PEGBOARD,
  workshopJars: JARS,
  workshopBlueprint: BLUEPRINT,
  workshopHatch: HATCH,
  workshopLadder: LADDER,
  workshopMachine: MACHINE,
  workshopLeverUp: LEVER_UP,
  workshopLeverDown: LEVER_DOWN,
  workshopGear0: gear(false),
  workshopGear1: gear(true),
  workshopRobot: ROBOT,
  workshopFlowBoard: FLOW_BOARD,
  workshopCan: CAN,
  workshopCanCrate: CAN_CRATE,
  workshopBelt0: belt(0),
  workshopBelt1: belt(3),
  workshopStation: STATION,
  workshopIconTokens: ICON_TOKENS,
  workshopIconTree: ICON_TREE,
  workshopIconCode: ICON_CODE,
  workshopIconAsm: ICON_ASM,
};

export const WORKSHOP_NAMES = Object.keys(WORKSHOP_GRIDS);
