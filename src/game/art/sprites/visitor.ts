/**
 * The player, drawn as Huzbi: a human in a hoodie and headphones with messy
 * dark hair. 16x24, four directions, three frames each (0 idle, 1 and 2 steps).
 * Left is the mirror of right.
 *
 * Palette keys: a ink outline, b hair, c hair light, v skin, w skin shadow,
 * x/y/z hoodie, A/B headphones and jeans, C white (shoes and drawstrings).
 *
 * The head and the standing body are drawn by hand; each walk frame only
 * changes the arms and the legs, so the silhouette of the head never wobbles.
 */

const W = 16;
const H = 24;

// --- heads: rows 0 to 11 ----------------------------------------------------

const HEAD_FRONT = [
  '...a..aaaa.a....',
  '..abaabbbbaaba..',
  '.abbbbcbbbbcbba.',
  '.aBAAAAABBBBBBa.',
  '.aBbbbbbbbbbbBa.',
  'aBAbbvbbbbvbbABa',
  'aBAbvvvvvvvvbABa',
  'aBAvvavvvvavvABa',
  'aBAvvavvvvavvABa',
  '.aavvvvwwvvvvaa.',
  '...aawvvvvwaa...',
  '....aawwwwaa....',
];

const HEAD_BACK = [
  '...a..aaaa.a....',
  '..abaabbbbaaba..',
  '.abbbbcbbbbcbba.',
  '.aBAAAAABBBBBBa.',
  '.aBbbbbbbbbbbBa.',
  'aBAbbbcbbbbbbABa',
  'aBAbabbbbcbabABa',
  'aBAbbbbcbbbbbABa',
  'aBAbbbbbbabbbABa',
  '.aabbbbbbbbbbaa.',
  '...aabbbbbbaa...',
  '....aawwwwaa....',
];

const HEAD_RIGHT = [
  '....a.aaa.a.....',
  '...abbaabbbaa...',
  '..abbcbbbbbbba..',
  '..aBAAAAAABbbba.',
  '..abbbbbbbbvva..',
  '..abbaBAbvvvva..',
  '..abbaBAvvvvva..',
  '..abbaBAvvvava..',
  '..abbaBAvvvavva.',
  '..abbaaavvvwwva.',
  '...abbbaavvvaa..',
  '.....aawwaa.....',
];

// --- torsos: rows 12 to 19, with arms drawn on top --------------------------

const TORSO_FRONT = [
  '.ayxxzwwwwzxxya.',
  '.ayxzxxCxxCxxya.',
  '.ayxzxxCxxCxxya.',
  '.ayxxxxxxxxxxya.',
  '.ayxxyyyyyyxxya.',
  '.ayxxyxxxxyxxya.',
  '.ayxxyyyyyyxxya.',
  '.ayyyyyyyyyyyya.',
];

const TORSO_BACK = [
  '.ayxxxxxxxxxxya.',
  '.ayxzxxyyxxxxya.',
  '.ayxzxyyyyxxxya.',
  '.ayxzxxxxxxxxya.',
  '.ayxxxxxxxxxxya.',
  '.ayxxxxxxxxxxya.',
  '.ayxxxxxxxxxxya.',
  '.ayyyyyyyyyyyya.',
];

const TORSO_RIGHT = [
  '...ayyxwwxxya...',
  '..ayyxxxxxxCya..',
  '..ayxxxxxxxCya..',
  '..ayxxxxxxxxya..',
  '..ayxxxxxxxxya..',
  '..ayxxxxxxxxya..',
  '..ayxxxxxxxxya..',
  '..ayyyyyyyyyya..',
];

// --- legs: rows 20 to 23 ----------------------------------------------------

const LEGS_FRONT = {
  stand: ['...aBBBaaBBBa...', '...aBBBaaBBBa...', '..aCCCCaaCCCCa..', '..aaaaaaaaaaaa..'],
  // Left leg planted, right leg lifting.
  stepL: ['...aBBBaaBBBa...', '...aBBBaaCCCCa..', '..aCCCCa.aaaaa..', '..aaaaaaa.......'],
  // Right leg planted, left leg lifting.
  stepR: ['...aBBBaaBBBa...', '..aCCCCaaBBBa...', '..aaaaa.aCCCCa..', '.......aaaaaaa..'],
};

const LEGS_RIGHT = {
  stand: ['....aBBBBBBa....', '....aBBBaBBBa...', '....aCCCCCCCa...', '....aaaaaaaaa...'],
  // Near leg swings forward, far leg trails.
  step1: ['....aBBBBBBa....', '...abbBaBBBBa...', '..aAAAa..aCCCCa.', '..aaaaa..aaaaaa.'],
  // Near leg trails, far leg swings forward.
  step2: ['....aBBBBBBa....', '...aBBBabbba....', '..aCCCa..aAAAAa.', '..aaaaa..aaaaaa.'],
};

// --- building ---------------------------------------------------------------

type Grid = string[][];

const blank = (): Grid => Array.from({ length: H }, () => Array.from({ length: W }, () => '.'));

function put(g: Grid, y: number, x: number, text: string): void {
  if (y < 0 || y >= H) return;
  for (let i = 0; i < text.length; i += 1) {
    const col = x + i;
    if (col >= 0 && col < W && text[i] !== '.') g[y][col] = text[i];
  }
}

function lay(g: Grid, top: number, rows: string[]): void {
  rows.forEach((r, i) => put(g, top + i, 0, r));
}

/** Front and back arms hang beside the body. `swing` is -1 (back), 0, +1 (forward). */
function armsFrontBack(g: Grid, left: -1 | 0 | 1, right: -1 | 0 | 1): void {
  const arm = (swing: -1 | 0 | 1, mirror: boolean): void => {
    const sleeve = ['axy', 'axy', 'axy', 'axy', 'axy', 'ayy', 'avw', '.aa', '...'];
    // Rows 13 to 21; the hand sits two rows lower when the arm swings forward.
    const lift = swing === -1 ? -1 : swing === 1 ? 1 : 0;
    const shift = (rows: string[]): string[] => {
      const out = [...rows];
      if (lift === 1) {
        out.splice(5, 0, 'axy');
        out.pop();
      } else if (lift === -1) {
        out.splice(4, 1);
        out.push('...');
      }
      return out;
    };
    const rows = shift(sleeve);
    rows.forEach((r, i) => {
      const text = mirror ? [...r].reverse().join('') : r;
      put(g, 13 + i, mirror ? 13 : 0, text);
    });
  };
  arm(left, false);
  arm(right, true);
}

/** The near arm in profile: a sleeve that swings from the shoulder. */
function armSide(g: Grid, d: -1 | 0 | 1): void {
  const col = 7;
  put(g, 13, col, 'zxy');
  put(g, 14, col, 'zxy');
  put(g, 15, col + d, 'zxy');
  put(g, 16, col + d, 'zxy');
  put(g, 17, col + 2 * d, 'yyy');
  put(g, 18, col + 2 * d, 'vvw');
  put(g, 19, col + 2 * d, '.aa');
}

type Frame = 0 | 1 | 2;

function buildFront(frame: Frame): string[] {
  const g = blank();
  lay(g, 0, HEAD_FRONT);
  lay(g, 12, TORSO_FRONT);
  // Frame 1: the screen-left leg plants, so the screen-right arm goes forward.
  armsFrontBack(g, frame === 1 ? -1 : frame === 2 ? 1 : 0, frame === 1 ? 1 : frame === 2 ? -1 : 0);
  lay(g, 20, frame === 0 ? LEGS_FRONT.stand : frame === 1 ? LEGS_FRONT.stepL : LEGS_FRONT.stepR);
  return g.map((r) => r.join(''));
}

function buildBack(frame: Frame): string[] {
  const g = blank();
  lay(g, 0, HEAD_BACK);
  lay(g, 12, TORSO_BACK);
  armsFrontBack(g, frame === 1 ? -1 : frame === 2 ? 1 : 0, frame === 1 ? 1 : frame === 2 ? -1 : 0);
  lay(g, 20, frame === 0 ? LEGS_FRONT.stand : frame === 1 ? LEGS_FRONT.stepL : LEGS_FRONT.stepR);
  return g.map((r) => r.join(''));
}

function buildRight(frame: Frame): string[] {
  const g = blank();
  lay(g, 0, HEAD_RIGHT);
  lay(g, 12, TORSO_RIGHT);
  lay(g, 20, frame === 0 ? LEGS_RIGHT.stand : frame === 1 ? LEGS_RIGHT.step1 : LEGS_RIGHT.step2);
  armSide(g, frame === 1 ? -1 : frame === 2 ? 1 : 0);
  return g.map((r) => r.join(''));
}

const mirror = (rows: string[]): string[] => rows.map((r) => [...r].reverse().join(''));

const FRAMES: Frame[] = [0, 1, 2];

export const VISITOR_GRIDS: Record<string, string[]> = {};
for (const f of FRAMES) {
  VISITOR_GRIDS[`visitor-down-${f}`] = buildFront(f);
  VISITOR_GRIDS[`visitor-up-${f}`] = buildBack(f);
  VISITOR_GRIDS[`visitor-right-${f}`] = buildRight(f);
  VISITOR_GRIDS[`visitor-left-${f}`] = mirror(buildRight(f));
}
