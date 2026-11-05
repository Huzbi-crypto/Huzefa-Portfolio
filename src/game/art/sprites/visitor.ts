/**
 * The player: a lanky, slightly slouched programmer. Fixed traits from
 * the spec (a human in a hoodie and headphones with messy dark hair), then a
 * shape language of his own:
 *
 *   - a hair tuft that never lies flat, off-centre, and a side lock over one eye
 *   - slim violet over-ear cups (2px wide, 3 tall) hugging the head under a 1px band
 *   - a narrow hoodie with two uneven drawstrings and a tiny cat pin
 *   - skinny jeans and big white sneakers
 *
 * 16x24, four directions, three frames each (0 idle, 1 and 2 steps), plus one
 * `visitor-<dir>-idle` frame per direction for the idle beat (a blink and a
 * tuft bob). Left is the mirror of right.
 *
 * Palette keys: a ink, b hair, c hair light, v skin, w skin shadow, x/y/z
 * hoodie, E headphone cups, A band and cup shine, B jeans, C white, r amber
 * pin.
 */

const W = 16;
const H = 24;

type Grid = string[][];
type Frame = 0 | 1 | 2;

const blank = (): Grid => Array.from({ length: H }, () => Array.from({ length: W }, () => '.'));
const mirrorRow = (row: string): string => [...row].reverse().join('');
/** A symmetric row from its left eight columns. */
const sym = (half: string): string => half + mirrorRow(half);

function put(g: Grid, x: number, y: number, c: string): void {
  if (y >= 0 && y < H && x >= 0 && x < W) g[y][x] = c;
}

/** Lay rows of text at (0, top); `.` leaves what is underneath. */
function lay(g: Grid, top: number, rows: string[], left = 0): void {
  rows.forEach((row, j) => {
    [...row].forEach((c, i) => {
      if (c !== '.') put(g, left + i, top + j, c);
    });
  });
}

/** Single pixels, written as `x,y,c` triples. */
function dots(g: Grid, list: [number, number, string][]): void {
  for (const [x, y, c] of list) put(g, x, y, c);
}

// --- front and back heads: rows 0 to 8 ----------------------------------------
// A compact head: nine rows including the tuft, 12 wide with the slim cups.

const HEAD_FRONT = [
  '........',
  '.....aab',
  '...aabbb',
  '..aAAAAA',
  '..aEabbv',
  '..aEavav',
  '..aEavvv',
  '....avvv',
  '....aaaa',
].map(sym);

const HEAD_BACK = [
  '........',
  '.....aab',
  '...aabbb',
  '..aAAAAA',
  '..aEabbb',
  '..aEabbb',
  '..aEabbc',
  '....abbb',
  '....aabb',
].map(sym);

function headFront(g: Grid): void {
  lay(g, 0, HEAD_FRONT);
  dots(g, [
    // the tuft that never lies flat
    [7, 0, 'a'], [8, 0, 'a'], [10, 0, 'a'],
    // a side lock over the right eye, a small tired smile
    [10, 4, 'b'], [10, 5, 'b'], [5, 4, 'v'], [7, 7, 'w'], [8, 7, 'w'],
    // cup shine
    [3, 4, 'A'], [12, 4, 'A'],
  ]);
}

function headBack(g: Grid): void {
  lay(g, 0, HEAD_BACK);
  dots(g, [
    [7, 0, 'a'], [8, 0, 'a'], [10, 0, 'a'],
    [6, 6, 'c'], [9, 5, 'c'], [7, 4, 'c'], [10, 7, 'c'], [3, 4, 'A'], [12, 4, 'A'],
  ]);
}

// --- front and back bodies: rows 9 to 16 -------------------------------------
// The torso is six columns of hoodie between two ink edges. Each arm is a
// two-column sleeve with its own ink edges, identical left and right.

const TORSO_FRONT = [
  '....axzz',
  '....axxx',
  '....axxx',
  '....axxx',
  '....axyy',
  '....axyy',
  '....aaaa',
].map(sym);

const TORSO_BACK = [
  '....axzz',
  '....axxx',
  '....axxx',
  '....axxz',
  '....axxx',
  '....axyy',
  '....aaaa',
].map(sym);

/**
 * One arm on the front/back views: outline, two sleeve columns, outline. The
 * shoulder and sleeve stay planted; only the hand lifts a pixel on a step
 * frame, so the walk never tears the arm or sends it sideways.
 */
function armFV(g: Grid, side: 'l' | 'r', lift: number, back: boolean): void {
  const x = side === 'l' ? 1 : 11;
  const inner = side === 'l' ? ['x', 'y'] : ['y', 'x'];
  for (let i = 0; i < 4; i += 1) put(g, x + i, 9, 'a');
  const handY = 15 + lift;
  for (let y = 10; y < handY; y += 1) {
    put(g, x, y, 'a');
    put(g, x + 1, y, inner[0]);
    put(g, x + 2, y, inner[1]);
    put(g, x + 3, y, 'a');
  }
  put(g, x, handY, 'a');
  put(g, x + 1, handY, back ? inner[0] : 'v');
  put(g, x + 2, handY, back ? inner[1] : 'v');
  put(g, x + 3, handY, 'a');
  for (let i = 1; i < 4; i += 1) put(g, side === 'l' ? x + i - 1 : x + i, handY + 1, 'a');
}

function bodyFront(g: Grid, frame: Frame): void {
  lay(g, 9, TORSO_FRONT);
  dots(g, [
    // drawstrings, a cat pin on the left chest, a pocket seam
    [6, 10, 'C'], [6, 11, 'C'], [9, 10, 'C'], [9, 11, 'C'], [9, 12, 'C'],
    [9, 13, 'r'], [10, 13, 'r'], [10, 12, 'r'], [7, 14, 'a'], [8, 14, 'a'],
  ]);
  const lift = frame === 1 ? [-1, 0] : frame === 2 ? [0, -1] : [0, 0];
  armFV(g, 'l', lift[0], false);
  armFV(g, 'r', lift[1], false);
}

/** The idle blink: the ink eye becomes a softer lid for one beat. */
function blinkFront(g: Grid): void {
  dots(g, [[6, 5, 'w'], [9, 5, 'w']]);
}

function blinkSide(g: Grid): void {
  put(g, 11, 5, 'w');
}

function bodyBack(g: Grid, frame: Frame): void {
  lay(g, 9, TORSO_BACK);
  // the hood, bunched behind the neck
  dots(g, [[7, 10, 'z'], [8, 10, 'z'], [6, 11, 'y'], [9, 11, 'y']]);
  const lift = frame === 1 ? [-1, 0] : frame === 2 ? [0, -1] : [0, 0];
  armFV(g, 'l', lift[0], true);
  armFV(g, 'r', lift[1], true);
}

// --- legs: rows 16 to 23 ------------------------------------------------------

/** One leg and its shoe, `lift` rows off the floor. */
function legFV(g: Grid, x: number, lift: number): void {
  const bottom = 23 - lift;
  for (let y = 16; y <= bottom - 2; y += 1) {
    put(g, x, y, 'a');
    put(g, x + 1, y, 'B');
    put(g, x + 2, y, 'B');
    put(g, x + 3, y, 'a');
  }
  const xs = x < 8 ? x - 1 : x;
  for (let i = 0; i < 5; i += 1) put(g, xs + i, bottom - 1, i === 0 || i === 4 ? 'a' : 'C');
  for (let i = 0; i < 5; i += 1) put(g, xs + i, bottom, 'a');
}

function legsFV(g: Grid, frame: Frame): void {
  legFV(g, 4, frame === 1 ? 1 : 0);
  legFV(g, 8, frame === 2 ? 1 : 0);
}

// --- the right-facing side view ---------------------------------------------

const HEAD_RIGHT = [
  '................',
  '.....aabbaa.....',
  '....aabbbbbba...',
  '...abAAAAAAAba..',
  '...abbEEabbvva..',
  '...abbEEavvava..',
  '...abbEEavvvwa..',
  '...abbbbavvwva..',
  '....aaaaaaaaa...',
];

const TORSO_RIGHT = [
  '....axzzzzxa....',
  '....axxxxxxa....',
  '....axxxxxxa....',
  '....axxxxxxa....',
  '....ayxxxyya....',
  '....ayxxxyya....',
  '....aaaaaaaa....',
];

function sideBody(g: Grid, frame: Frame): void {
  lay(g, 0, HEAD_RIGHT);
  lay(g, 9, TORSO_RIGHT);
  dots(g, [
    [7, 0, 'a'], [8, 0, 'a'], [10, 0, 'a'],
    [10, 10, 'C'], [10, 11, 'C'], [10, 13, 'r'],
  ]);
  // the near arm hangs in front of the torso: outline, sleeve, outline. Its
  // shoulder stays planted and only the hand travels a pixel.
  const near = frame === 1 ? -1 : frame === 2 ? 1 : 0;
  for (let y = 10; y <= 14; y += 1) {
    put(g, 6, y, 'a');
    put(g, 7, y, 'x');
    put(g, 8, y, 'z');
    put(g, 9, y, 'a');
  }
  for (let x = 6; x <= 9; x += 1) put(g, x, 9, 'a');
  dots(g, [
    [6 + near, 15, 'a'], [7 + near, 15, 'v'], [8 + near, 15, 'v'], [9 + near, 15, 'a'],
    [6 + near, 16, 'a'], [7 + near, 16, 'a'], [8 + near, 16, 'a'],
  ]);
}

function sideLegs(g: Grid, frame: Frame): void {
  // two legs always show: the far one a shade lighter, the near one in front.
  // Standing they sit three columns apart; walking they open to five, and swap
  // on the other step. The shoes point right.
  const [far, near, lifted] =
    frame === 1 ? [3, 8, 0] : frame === 2 ? [8, 3, 1] : [4, 7, -1];
  const leg = (x: number, lift: number, fill: string): void => {
    const bottom = 23 - lift;
    for (let y = 16; y <= bottom - 2; y += 1) {
      put(g, x, y, 'a');
      put(g, x + 1, y, fill);
      put(g, x + 2, y, fill);
      put(g, x + 3, y, 'a');
    }
    for (let i = 0; i < 6; i += 1) {
      put(g, x + i, bottom - 1, i === 0 || i === 5 ? 'a' : 'C');
      put(g, x + i, bottom, 'a');
    }
  };
  leg(far, lifted === 0 ? 1 : 0, 'A');
  leg(near, lifted === 1 ? 1 : 0, 'B');
}

// --- assembly ---------------------------------------------------------------

type Facing = 'down' | 'up' | 'right';

function buildDown(frame: Frame): string[] {
  const g = blank();
  legsFV(g, frame);
  bodyFront(g, frame);
  headFront(g);
  return g.map((r) => r.join(''));
}

function buildUp(frame: Frame): string[] {
  const g = blank();
  legsFV(g, frame);
  bodyBack(g, frame);
  headBack(g);
  return g.map((r) => r.join(''));
}

function buildRight(frame: Frame): string[] {
  const g = blank();
  sideLegs(g, frame);
  sideBody(g, frame);
  return g.map((r) => r.join(''));
}

/** Nudge the loose top tuft one pixel without leaving a hole in the hair. */
function flickTuft(g: Grid, from: number, to: number): void {
  put(g, from, 0, '.');
  put(g, to, 0, 'a');
}

/** The idle beat, one frame per direction: a blink and a tuft bob. */
function idleFrame(facing: Facing): string[] {
  const g = blank();
  if (facing === 'down') {
    legsFV(g, 0);
    bodyFront(g, 0);
    headFront(g);
    blinkFront(g);
    flickTuft(g, 7, 9);
  } else if (facing === 'up') {
    legsFV(g, 0);
    bodyBack(g, 0);
    headBack(g);
    flickTuft(g, 7, 9);
  } else {
    sideLegs(g, 0);
    sideBody(g, 0);
    blinkSide(g);
    flickTuft(g, 7, 9);
  }
  return g.map((r) => r.join(''));
}

const mirror = (rows: string[]): string[] => rows.map(mirrorRow);

const FRAMES: Frame[] = [0, 1, 2];

export const VISITOR_GRIDS: Record<string, string[]> = {};
for (const f of FRAMES) {
  VISITOR_GRIDS[`visitor-down-${f}`] = buildDown(f);
  VISITOR_GRIDS[`visitor-up-${f}`] = buildUp(f);
  VISITOR_GRIDS[`visitor-right-${f}`] = buildRight(f);
  VISITOR_GRIDS[`visitor-left-${f}`] = mirror(buildRight(f));
}
VISITOR_GRIDS['visitor-down-idle'] = idleFrame('down');
VISITOR_GRIDS['visitor-up-idle'] = idleFrame('up');
VISITOR_GRIDS['visitor-right-idle'] = idleFrame('right');
VISITOR_GRIDS['visitor-left-idle'] = mirror(idleFrame('right'));
