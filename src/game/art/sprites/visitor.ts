/**
 * Huzbi, the player: a lanky, slightly slouched programmer. Fixed traits from
 * the spec (a human in a hoodie and headphones with messy dark hair), then a
 * shape language of his own:
 *
 *   - a hair tuft that never lies flat, off-centre, and a side lock over one eye
 *   - oversized violet over-ear cups, the widest thing on him
 *   - a narrow hoodie with two uneven drawstrings and a tiny cat pin
 *   - skinny jeans and big white sneakers
 *
 * 16x24, four directions, three frames each (0 idle, 1 and 2 steps), plus one
 * `visitor-<dir>-idle` frame per direction for the idle beat (a hand goes up
 * to straighten the headphones, or the tuft bobs). Left is the mirror of right.
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

// --- front and back heads: rows 0 to 10 ---------------------------------------

const HEAD_FRONT = [
  '........',
  '.....aab',
  '...aabbb',
  '..abbbbb',
  '..aAAAAA',
  '.aEEabbv',
  '.aEEavvv',
  '.aEEavav',
  '.aEEavwv',
  '.aaaavvv',
  '....aaww',
].map(sym);

const HEAD_BACK = [
  '........',
  '.....aab',
  '...aabbb',
  '..abbbbb',
  '..aAAAAA',
  '.aEEabbb',
  '.aEEabbb',
  '.aEEabbc',
  '.aEEabbb',
  '.aaaaabb',
  '....aabb',
].map(sym);

function headFront(g: Grid, dy = 0): void {
  lay(g, dy, HEAD_FRONT);
  dots(g, [
    // the tuft that never lies flat, and a loose strand
    [7, dy, 'a'], [8, dy, 'a'], [10, dy, 'a'], [8, 1 + dy, 'b'], [9, 1 + dy, 'a'], [10, 1 + dy, 'b'],
    [12, 1 + dy, 'a'], [11, 2 + dy, 'a'], [12, 2 + dy, 'a'],
    // a side lock over the right eye, a crooked tired smile
    [10, 5 + dy, 'b'], [10, 6 + dy, 'b'], [5, 5 + dy, 'v'], [7, 9 + dy, 'w'], [8, 9 + dy, 'w'], [9, 9 + dy, 'v'], [6, 9 + dy, 'v'],
    // cup shine
    [2, 5 + dy, 'A'], [12, 5 + dy, 'A'],
  ]);
}

function headBack(g: Grid, dy = 0): void {
  lay(g, dy, HEAD_BACK);
  dots(g, [
    [7, dy, 'a'], [8, dy, 'a'], [10, dy, 'a'], [8, 1 + dy, 'b'], [9, 1 + dy, 'a'], [10, 1 + dy, 'b'],
    [12, 1 + dy, 'a'], [11, 2 + dy, 'a'], [12, 2 + dy, 'a'],
    [6, 7 + dy, 'c'], [9, 6 + dy, 'c'], [7, 5 + dy, 'c'], [10, 8 + dy, 'c'], [5, 8 + dy, 'c'], [2, 5 + dy, 'A'], [12, 5 + dy, 'A'],
  ]);
}

// --- front and back bodies -----------------------------------------------------

const TORSO_FRONT = [
  '...axzzx',
  '....axxx',
  '....axxx',
  '....axxx',
  '....axyy',
  '....axyy',
  '....aaaa',
].map(sym);

const TORSO_BACK = [
  '...axzzx',
  '....axxx',
  '....axxx',
  '....axxz',
  '....axxx',
  '....axyy',
  '....aaaa',
].map(sym);

/** One arm on the front/back views: sleeve down from the shoulder to a hand. */
function armFV(g: Grid, side: 'l' | 'r', dy: number, back: boolean): void {
  const x = side === 'l' ? 2 : 12;
  const rows = [
    ['a', 'x', 'a'],
    ['a', 'x', 'a'],
    ['a', 'x', 'a'],
    ['a', 'x', 'a'],
    ['a', back ? 'x' : 'v', 'a'],
    ['.', 'a', '.'],
  ];
  rows.forEach((r, j) => {
    r.forEach((c, i) => {
      if (c !== '.') put(g, x + i, 12 + dy + j, c);
    });
  });
}

function bodyFront(g: Grid, frame: Frame, handUp: boolean): void {
  lay(g, 11, TORSO_FRONT);
  dots(g, [
    [6, 12, 'C'], [6, 13, 'C'], [9, 12, 'C'], [9, 13, 'C'], [9, 14, 'C'],
    [10, 14, 'r'], [11, 14, 'r'], [7, 15, 'a'], [8, 15, 'a'],
  ]);
  const swing = frame === 1 ? [1, -1] : frame === 2 ? [-1, 1] : [0, 0];
  if (handUp) {
    // the viewer's left arm is up at the cup; handToCup draws it after the head
    for (let j = 0; j < 4; j += 1) {
      put(g, 2, 14 + j, 'a');
      put(g, 3, 14 + j, 'x');
      put(g, 4, 14 + j, 'a');
    }
  } else {
    armFV(g, 'l', swing[0], false);
    armFV(g, 'r', swing[1], false);
  }
}

/** The raised hand, drawn over the head: fingers on the left cup. */
function handToCup(g: Grid): void {
  dots(g, [
    [1, 9, 'a'], [2, 9, 'a'], [3, 9, 'a'], [1, 8, 'a'], [2, 8, 'v'], [3, 8, 'v'], [4, 8, 'a'],
    [1, 7, 'a'], [2, 7, 'v'], [3, 7, 'v'], [4, 7, 'a'], [2, 6, 'a'], [3, 6, 'a'],
    [3, 10, 'a'], [2, 10, 'x'], [4, 10, 'a'], [3, 11, 'x'], [2, 11, 'a'], [4, 11, 'a'], [3, 12, 'x'], [2, 12, 'a'], [4, 12, 'a'], [3, 13, 'x'], [2, 13, 'a'], [4, 13, 'a'],
  ]);
}

function bodyBack(g: Grid, frame: Frame): void {
  lay(g, 11, TORSO_BACK);
  // the hood, bunched behind the neck
  dots(g, [[7, 12, 'z'], [8, 12, 'z'], [6, 13, 'y'], [9, 13, 'y']]);
  const swing = frame === 1 ? [1, -1] : frame === 2 ? [-1, 1] : [0, 0];
  armFV(g, 'l', swing[0], true);
  armFV(g, 'r', swing[1], true);
}

// --- legs: rows 17 to 23 ------------------------------------------------------

/** One leg and its shoe, `lift` rows off the floor. */
function legFV(g: Grid, x: number, lift: number): void {
  const bottom = 23 - lift;
  for (let y = 17; y <= bottom - 2; y += 1) {
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
  // the torso hem is row 17; jeans start straight under it
  legFV(g, 4, frame === 1 ? 1 : 0);
  legFV(g, 8, frame === 2 ? 1 : 0);
  for (let x = 4; x < 12; x += 1) put(g, x, 17, 'a');
}

// --- the right-facing side view ---------------------------------------------

const HEAD_RIGHT = [
  '......aa........',
  '.....abba.a.....',
  '....abbbbbba....',
  '...abbbbbbbbaa..',
  '...abAAAAAAAba..',
  '...abEEEabbvva..',
  '...abEEEavvvva..',
  '...abEEEavvava..',
  '...abEEEavvvwa..',
  '....aaaaavvava..',
  '.......aaawwa...',
];

const TORSO_RIGHT = [
  '.....axzxxa.....',
  '....axxxxxxa....',
  '....axxxxxxa....',
  '....axxxxxxa....',
  '....axxxyyya....',
  '....axxyyyya....',
  '.....aaaaaaa....',
];

function sideBody(g: Grid, frame: Frame): void {
  lay(g, 0, HEAD_RIGHT);
  lay(g, 11, TORSO_RIGHT);
  dots(g, [[10, 12, 'C'], [10, 13, 'C'], [9, 15, 'r']]);
  // the far arm swings behind the body, the near arm in front
  const near = frame === 1 ? -1 : frame === 2 ? 1 : 0;
  const far = -near;
  for (let j = 0; j < 4; j += 1) put(g, 5 + far, 13 + j, 'y');
  put(g, 5 + far, 17, 'v');
  for (let j = 0; j < 5; j += 1) {
    put(g, 7 + near, 12 + j, 'a');
    put(g, 8 + near, 12 + j, j === 0 ? 'z' : 'x');
    put(g, 9 + near, 12 + j, 'a');
  }
  dots(g, [[8 + near, 17, 'v'], [7 + near, 17, 'a'], [9 + near, 17, 'a'], [8 + near, 18, 'a']]);
}

function sideLegs(g: Grid, frame: Frame): void {
  // legs overlap in the middle when standing and scissor when walking
  const back = frame === 1 ? -3 : frame === 2 ? 3 : 0;
  const front = -back;
  const leg = (dx: number, tone: 'B' | 'y', lift: number): void => {
    const x = 6 + dx;
    for (let y = 17; y <= 20 - lift; y += 1) {
      put(g, x, y, 'a');
      put(g, x + 1, y, tone === 'B' ? 'B' : 'B');
      put(g, x + 2, y, 'B');
      put(g, x + 3, y, 'a');
    }
    const bottom = 23 - lift;
    for (let i = 0; i < 6; i += 1) {
      put(g, x - 1 + i + 1, bottom - 1, i === 0 ? 'a' : i === 5 ? 'a' : 'C');
      put(g, x - 1 + i + 1, bottom, 'a');
    }
  };
  leg(back, 'y', frame === 0 ? 0 : 1);
  leg(front, 'B', 0);
  for (let x = 5; x < 12; x += 1) put(g, x, 17, 'a');
}

// --- assembly ---------------------------------------------------------------

type Facing = 'down' | 'up' | 'right';

function buildDown(frame: Frame): string[] {
  const g = blank();
  legsFV(g, frame);
  bodyFront(g, frame, false);
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

/** The idle beat, one frame per direction: a hand straightens the cup, or the tuft bobs. */
function idleFrame(facing: Facing): string[] {
  const g = blank();
  if (facing === 'down') {
    legsFV(g, 0);
    bodyFront(g, 0, true);
    headFront(g);
    handToCup(g);
    // the head tips a little toward the raised hand: the tuft slides over
    dots(g, [[8, 0, '.'], [9, 0, 'a'], [10, 0, '.'], [11, 0, 'a']]);
  } else if (facing === 'up') {
    legsFV(g, 0);
    bodyBack(g, 0);
    headBack(g);
    dots(g, [[8, 0, '.'], [9, 0, 'a'], [10, 0, '.'], [11, 0, 'a']]);
  } else {
    sideLegs(g, 0);
    sideBody(g, 0);
    dots(g, [[6, 0, 'a'], [7, 0, '.'], [8, 0, 'a'], [9, 0, 'a']]);
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
