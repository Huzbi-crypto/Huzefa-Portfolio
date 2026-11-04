/**
 * Huzbi on the nap-room sofa, at the ending's scale. The same person as the
 * room avatar, drawn bigger so the face can act: a bush of dark hair with a
 * tuft that never lies flat and a side lock, oversized violet over-ear cups,
 * a hoodie with uneven drawstrings and a cat pin, skinny jeans, white
 * sneakers. 64 by 46, one sprite for the sofa and whoever is on it.
 *
 * The wake-up is a run of frames the scene plays by time: asleep (two
 * breathing frames), cough (two), slide (the manga leaves his face), one eye,
 * both eyes, rise (up on one elbow), sit up, and awake (a grin and a wave,
 * two frames). Original pixel art, palette keys only.
 */

type Canvas = string[][];

export const SLEEPER = { w: 64, h: 46 } as const;

export type SleepFrame =
  | 'asleep0'
  | 'asleep1'
  | 'cough0'
  | 'cough1'
  | 'slide'
  | 'oneEye'
  | 'bothEyes'
  | 'rise'
  | 'sitUp'
  | 'awake0'
  | 'awake1';

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

const boxed = (cv: Canvas, x: number, y: number, w: number, h: number, edge: string, fill: string): void => {
  rect(cv, x, y, w, h, edge);
  rect(cv, x + 1, y + 1, w - 2, h - 2, fill);
};

const lay = (cv: Canvas, x: number, y: number, rows: string[]): void => {
  rows.forEach((row, j) => {
    [...row].forEach((c, i) => {
      if (c !== '.') plot(cv, x + i, y + j, c);
    });
  });
};

const rows = (cv: Canvas): string[] => cv.map((r) => r.join(''));
const sym = (half: string): string => half + [...half].reverse().join('');

// --- the sofa ------------------------------------------------------------------

function sofaBody(cv: Canvas): void {
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

// --- the head: 20 wide, 18 tall --------------------------------------------------

/** Left half (ten columns) of the head, the face left bare; the mirror makes the right. */
const HEAD_HALF = [
  '..........', // 0
  '.......aab', // 1
  '....aabbbb', // 2
  '...abbbbbb', // 3
  '..abbbbbbb', // 4
  '..aAAAAAAA', // 5 band
  '..abbbbbbb', // 6
  'aaaaabbbbb', // 7
  'aEEEabbbbb', // 8
  'aEEEabbvvv', // 9
  'aEEEavvvvv', // 10
  'aEEEavvvvv', // 11
  'aEEEavvvvv', // 12
  'aEEEavvvvv', // 13
  'aaaaavvvvv', // 14
  '....avvvvv', // 15
  '.....avvvv', // 16
  '......aaaa', // 17
].map(sym);

export type Face = 'under' | 'cough' | 'rub' | 'one' | 'wide' | 'grin';

function head(cv: Canvas, x: number, y: number, face: Face): void {
  lay(cv, x, y, HEAD_HALF);
  const p = (dx: number, dy: number, c: string): void => plot(cv, x + dx, y + dy, c);
  // the tuft that never lies flat, a loose strand, and a side lock over one eye
  for (const [dx, dy, c] of [
    [10, 0, 'a'], [11, 0, 'a'], [9, 1, 'a'], [10, 1, 'b'], [11, 1, 'b'], [12, 1, 'a'], [14, 1, 'a'],
    [14, 2, 'a'], [15, 2, 'a'], [14, 3, 'a'], [3, 1, 'a'], [4, 2, 'a'],
    [14, 8, 'b'], [14, 9, 'b'], [14, 10, 'b'], [13, 9, 'b'],
    [2, 8, 'A'], [16, 8, 'A'], [8, 9, 'b'],
  ] as [number, number, string][]) {
    p(dx, dy, c);
  }
  // nose
  p(9, 13, 'w');
  p(10, 13, 'w');

  if (face === 'under') {
    // eyes shut under the manga; the mouth hangs a little open
    rect(cv, x + 6, y + 12, 2, 1, 'a');
    rect(cv, x + 12, y + 12, 2, 1, 'a');
    rect(cv, x + 9, y + 15, 2, 1, 'a');
    p(9, 16, 'w');
    p(10, 16, 'w');
  } else if (face === 'cough') {
    // eyes squeezed into > <, mouth wide open
    for (const [dx, dy] of [[6, 11], [7, 12], [6, 13], [13, 11], [12, 12], [13, 13]]) p(dx, dy, 'a');
    rect(cv, x + 8, y + 15, 4, 2, 'a');
    rect(cv, x + 9, y + 16, 2, 1, 'l');
  } else if (face === 'rub') {
    // eyes screwed shut, brows down, a grumpy mouth
    rect(cv, x + 6, y + 12, 3, 1, 'a');
    rect(cv, x + 11, y + 12, 3, 1, 'a');
    rect(cv, x + 6, y + 10, 3, 1, 'a');
    rect(cv, x + 11, y + 10, 3, 1, 'a');
    rect(cv, x + 8, y + 15, 4, 1, 'w');
  } else if (face === 'one') {
    // the left eye cracks open, the right is still shut, the mouth smacks
    rect(cv, x + 6, y + 10, 3, 1, 'a');
    rect(cv, x + 6, y + 11, 3, 2, 'C');
    rect(cv, x + 7, y + 11, 2, 2, 'a');
    plot(cv, x + 6, y + 11, 'C');
    rect(cv, x + 6, y + 13, 3, 1, 'w');
    rect(cv, x + 11, y + 12, 3, 1, 'a');
    rect(cv, x + 9, y + 15, 3, 1, 'a');
  } else {
    // both open: tired-but-friendly, heavy lids and bags
    for (const ex of [6, 12]) {
      rect(cv, x + ex, y + 10, 3, 1, 'w');
      rect(cv, x + ex, y + 11, 3, 2, 'C');
      rect(cv, x + ex + 1, y + 11, 2, 2, 'a');
      plot(cv, x + ex + 1, y + 11, 'C');
      rect(cv, x + ex, y + 13, 3, 1, 'w');
    }
    if (face === 'grin') {
      rect(cv, x + 7, y + 14, 6, 1, 'a');
      rect(cv, x + 7, y + 15, 6, 1, 'C');
      rect(cv, x + 8, y + 16, 4, 1, 'a');
      plot(cv, x + 6, y + 14, 'w');
      plot(cv, x + 13, y + 14, 'w');
    } else {
      rect(cv, x + 8, y + 15, 4, 1, 'a');
    }
  }
}

// --- the manga: a cream paperback with a red title bar ------------------------------

function mangaOnFace(cv: Canvas, x: number, y: number): void {
  boxed(cv, x, y, 13, 7, 'a', 'p');
  rect(cv, x + 1, y + 5, 11, 1, 'q');
  rect(cv, x + 2, y + 1, 5, 2, 'k');
  plot(cv, x + 3, y + 1, 'l');
  rect(cv, x + 8, y + 1, 3, 1, 'a');
  rect(cv, x + 2, y + 4, 9, 1, 'a');
  rect(cv, x + 8, y + 2, 3, 1, 'q');
}

// --- the body, lying ---------------------------------------------------------------

function hoodieLying(cv: Canvas, lift: number): void {
  // hood bunched under the head, then the long torso
  boxed(cv, 18, 22 - lift, 8, 11, 'a', 'y');
  boxed(cv, 24, 21 - lift, 21, 12, 'a', 'x');
  rect(cv, 25, 22 - lift, 19, 1, 'z');
  rect(cv, 25, 31 - lift, 19, 1, 'y');
  // drawstrings, uneven, and the cat pin
  rect(cv, 27, 24 - lift, 1, 3, 'C');
  rect(cv, 30, 24 - lift, 1, 4, 'C');
  rect(cv, 32, 26 - lift, 2, 1, 'r');
  // kangaroo pocket
  rect(cv, 33, 28 - lift, 9, 3, 'y');
  rect(cv, 33, 28 - lift, 9, 1, 'a');
}

function legsLying(cv: Canvas): void {
  boxed(cv, 44, 24, 14, 9, 'a', 'B');
  rect(cv, 45, 25, 12, 1, 'A');
  rect(cv, 51, 26, 1, 5, 'a');
  rect(cv, 56, 24, 2, 8, 'a');
  // a sneaker propped on the far arm, toes to the sky
  lay(cv, 56, 16, [
    '..aaaa..',
    '.aCCCCa.',
    'aCCCCCCa',
    'aAAAAAAa',
    'aCCCCCCa',
    'aCCCCCCa',
    'aqqqqqqa',
    'aaaaaaaa',
  ]);
  rect(cv, 57, 24, 6, 1, 'B');
}

function armDangling(cv: Canvas, x: number): void {
  // the near arm hangs off the front of the seat, fingers nearly on the floor
  boxed(cv, x, 31, 7, 9, 'a', 'x');
  rect(cv, x + 1, 32, 2, 7, 'z');
  boxed(cv, x, 39, 7, 6, 'a', 'v');
  rect(cv, x + 2, 43, 1, 2, 'a');
  rect(cv, x + 4, 43, 1, 2, 'a');
}

function snore(cv: Canvas, x: number, y: number, big: boolean): void {
  rect(cv, x, y, 4, 1, 'C');
  plot(cv, x + 2, y + 1, 'C');
  plot(cv, x + 1, y + 2, 'C');
  rect(cv, x, y + 3, 4, 1, 'C');
  if (big) rect(cv, x + 5, y - 4, 3, 1, 'C');
}

// --- the frames -----------------------------------------------------------------------

function lying(face: Face, opts: { jerk?: number; lift?: number } = {}): Canvas {
  const cv = blank(SLEEPER.w, SLEEPER.h);
  const jerk = opts.jerk ?? 0;
  sofaBody(cv);
  legsLying(cv);
  hoodieLying(cv, opts.lift ?? 0);
  armDangling(cv, 29);
  head(cv, 3, 7 - jerk, face);
  return cv;
}

/** An open hand with four separate fingers and a thumb. 9 by 10; the thumb reaches two columns left. */
const HAND = [
  '...a.a...',
  '..avavaa.',
  '.aavavava',
  'avavavava',
  'avavavava',
  'avavavava',
  'avvvvvvva',
  'avvvvvvva',
  '.avvvvva.',
  '..aaaaa..',
];

function hand(cv: Canvas, x: number, y: number): void {
  lay(cv, x, y, HAND);
  lay(cv, x - 2, y + 4, ['.aa', 'avv', '.aa']);
}

function seated(face: Face, wave: 0 | 1 | 2, rub: boolean): Canvas {
  const cv = blank(SLEEPER.w, SLEEPER.h);
  sofaBody(cv);
  boxed(cv, 8, 29, 48, 11, 'a', 'n');
  rect(cv, 9, 30, 46, 1, 'o');
  // the near arm rests on the seat
  boxed(cv, 15, 21, 7, 13, 'a', 'x');
  rect(cv, 16, 22, 2, 10, 'z');
  boxed(cv, 15, 33, 7, 5, 'a', 'v');
  rect(cv, 17, 37, 1, 1, 'a');
  rect(cv, 19, 37, 1, 1, 'a');
  // torso: a narrow hoodie with a hood ring, drawstrings, a cat pin and a pocket
  boxed(cv, 22, 17, 20, 19, 'a', 'x');
  rect(cv, 23, 18, 18, 1, 'z');
  rect(cv, 23, 18, 2, 13, 'z');
  rect(cv, 23, 33, 18, 2, 'y');
  rect(cv, 28, 19, 8, 2, 'y');
  rect(cv, 28, 19, 1, 5, 'C');
  rect(cv, 34, 19, 1, 6, 'C');
  rect(cv, 36, 25, 2, 1, 'r');
  rect(cv, 27, 29, 10, 5, 'y');
  rect(cv, 27, 29, 10, 1, 'a');
  // knees up front: thighs run toward us along the seat, shins drop to the floor
  for (const x of [22, 33]) {
    boxed(cv, x, 34, 9, 5, 'a', 'B');
    rect(cv, x + 1, 35, 7, 1, 'A');
    boxed(cv, x + 1, 38, 7, 5, 'a', 'B');
    rect(cv, x + 2, 39, 1, 3, 'A');
    boxed(cv, x - 1, 42, 11, 4, 'a', 'C');
    rect(cv, x, 44, 9, 1, 'q');
  }
  head(cv, 22, 0, face);

  if (rub) {
    // the far hand scrubs at an eye
    boxed(cv, 42, 21, 7, 8, 'a', 'x');
    rect(cv, 43, 22, 2, 6, 'z');
    boxed(cv, 40, 11, 7, 11, 'a', 'x');
    rect(cv, 41, 12, 2, 8, 'z');
    boxed(cv, 39, 7, 8, 6, 'a', 'v');
  } else if (wave === 0) {
    boxed(cv, 42, 21, 7, 13, 'a', 'x');
    rect(cv, 43, 22, 2, 10, 'z');
    boxed(cv, 42, 33, 7, 5, 'a', 'v');
    rect(cv, 44, 37, 1, 1, 'a');
    rect(cv, 46, 37, 1, 1, 'a');
  } else {
    // upper arm out, forearm straight up, an open hand: "hi"
    const tilt = wave === 1 ? 0 : 2;
    boxed(cv, 41, 19, 11, 6, 'a', 'x');
    rect(cv, 42, 20, 9, 1, 'z');
    boxed(cv, 46 + tilt, 9, 6, 14, 'a', 'x');
    rect(cv, 47 + tilt, 10, 2, 11, 'z');
    hand(cv, 44 + tilt, 0);
  }
  return cv;
}

function risen(): Canvas {
  // up on the near elbow, shoulders lifting, hair a disaster
  const cv = blank(SLEEPER.w, SLEEPER.h);
  sofaBody(cv);
  legsLying(cv);
  hoodieLying(cv, 3);
  armDangling(cv, 29);
  boxed(cv, 8, 20, 17, 12, 'a', 'x');
  rect(cv, 9, 21, 15, 1, 'z');
  boxed(cv, 14, 28, 8, 5, 'a', 'x');
  boxed(cv, 12, 30, 6, 4, 'a', 'v');
  head(cv, 3, 2, 'wide');
  return cv;
}

export function sleeperFrame(frame: SleepFrame): string[] {
  switch (frame) {
    case 'asleep0':
    case 'asleep1': {
      const cv = lying('under', { lift: frame === 'asleep1' ? 1 : 0 });
      mangaOnFace(cv, 7, frame === 'asleep1' ? 16 : 17);
      if (frame === 'asleep1') snore(cv, 27, 6, true);
      else snore(cv, 25, 8, false);
      return rows(cv);
    }
    case 'cough0':
    case 'cough1': {
      const jerk = frame === 'cough1' ? 2 : 0;
      const cv = lying('cough', { jerk });
      // the manga hops off his face, a fist goes to his mouth, a cough in two puffs
      mangaOnFace(cv, 7, 15 - jerk * 2);
      boxed(cv, 11, 23 - jerk, 8, 6, 'a', 'v');
      rect(cv, 12, 24 - jerk, 6, 1, 'w');
      rect(cv, 14, 25 - jerk, 1, 3, 'a');
      for (const [x, y] of [[25, 18], [27, 16], [28, 19], [26, 22], [29, 21]]) plot(cv, x, y - jerk, 'C');
      return rows(cv);
    }
    case 'slide': {
      // the manga skids off his face and down his chest; eyes screwed shut
      const cv = lying('rub');
      mangaOnFace(cv, 22, 25);
      return rows(cv);
    }
    case 'oneEye': {
      const cv = lying('one');
      boxed(cv, 20, 15, 8, 8, 'a', 'v');
      rect(cv, 21, 16, 6, 1, 'w');
      return rows(cv);
    }
    case 'bothEyes':
      return rows(lying('wide'));
    case 'rise':
      return rows(risen());
    case 'sitUp':
      return rows(seated('wide', 0, false));
    case 'awake0':
      return rows(seated('grin', 1, false));
    default:
      return rows(seated('grin', 2, false));
  }
}

export const SLEEPER_GRIDS: Record<string, string[]> = {
  sleeperAsleep0: sleeperFrame('asleep0'),
  sleeperAsleep1: sleeperFrame('asleep1'),
  sleeperCough0: sleeperFrame('cough0'),
  sleeperCough1: sleeperFrame('cough1'),
  sleeperStir: sleeperFrame('slide'),
  sleeperOneEye: sleeperFrame('oneEye'),
  sleeperBothEyes: sleeperFrame('bothEyes'),
  sleeperRise: sleeperFrame('rise'),
  sleeperSitUp: sleeperFrame('sitUp'),
  sleeperAwake: sleeperFrame('awake0'),
  sleeperAwake1: sleeperFrame('awake1'),
};
