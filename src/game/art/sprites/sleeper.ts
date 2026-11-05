/**
 * Huzbi, the host, on his nap-room sofa at the ending's scale. He is not the
 * visitor: where the player is a lanky hoodie kid with headphones on his head,
 * Huzbi is a soft, round home-body. A big bush of messy hair, round amber
 * glasses, an oversized terracotta cardigan over a cream tee, headphones
 * hanging round his neck, grey sweats and fat red slippers. 64 by 46, one
 * sprite for the sofa and whoever is on it.
 *
 * The frames cover the whole ending loop: asleep (two breathing frames, glasses
 * pushed up and the manga on his face), cough (two), slide (the manga leaves
 * his face), one eye, both eyes, rise, sit up, awake (a wave, two frames), then
 * the life after the talk: the hand lowers, he sits for a beat (two frames),
 * leans down for the manga, reads (two frames), and lies back with the manga
 * rising to his face. Original pixel art, palette keys only.
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
  | 'awake1'
  | 'lower'
  | 'sit0'
  | 'sit1'
  | 'reach'
  | 'read0'
  | 'read1'
  | 'layBack';

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

/** A filled ellipse with a one-pixel outline. */
function ell(cv: Canvas, cx: number, cy: number, rx: number, ry: number, edge: string, fill: string): void {
  for (let y = -ry - 1; y <= ry + 1; y += 1) {
    for (let x = -rx - 1; x <= rx + 1; x += 1) {
      const d = (x * x) / (rx * rx + 0.3) + (y * y) / (ry * ry + 0.3);
      if (d <= 1) plot(cv, Math.round(cx + x), Math.round(cy + y), fill);
      else if (d <= 1 + 1.9 / Math.max(rx, ry)) plot(cv, Math.round(cx + x), Math.round(cy + y), edge);
    }
  }
}

/** A thin round ring, for the glasses. */
function ring(cv: Canvas, cx: number, cy: number, r: number, c: string): void {
  for (let a = 0; a < 40; a += 1) {
    const t = (a / 40) * Math.PI * 2;
    plot(cv, Math.round(cx + Math.cos(t) * r), Math.round(cy + Math.sin(t) * r), c);
  }
}

const rows = (cv: Canvas): string[] => cv.map((r) => r.join(''));

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

/** The tea mug on the far arm of the sofa, steam curling when `steam` is 1 or 2. */
function mugOnArm(cv: Canvas, steam: 0 | 1 | 2): void {
  boxed(cv, 56, 17, 6, 5, 'a', 'p');
  rect(cv, 57, 18, 4, 1, 'C');
  rect(cv, 61, 18, 2, 3, 'a');
  rect(cv, 57, 20, 4, 1, 'q');
  if (steam === 1) {
    for (const [x, y] of [[58, 14], [59, 13], [58, 12], [59, 11]]) plot(cv, x, y, 'C');
  } else if (steam === 2) {
    for (const [x, y] of [[59, 14], [58, 13], [59, 12], [58, 11]]) plot(cv, x, y, 'C');
  }
}

// --- the head: round, with a bush of hair and round amber glasses --------------------

export type Face =
  | 'under' // asleep under the manga
  | 'cough'
  | 'rub'
  | 'one'
  | 'wide'
  | 'grin' // awake, wave
  | 'talk' // mid-sentence, mouth open
  | 'calm' // sitting, tired but fond
  | 'blink'
  | 'read' // eyes down on a page
  | 'drowse'; // half-lidded, about to go under

/** Draws the head centred on (cx, cy): hair 21 wide, face 17 wide. */
function head(cv: Canvas, cx: number, cy: number, face: Face): void {
  const p = (dx: number, dy: number, c: string): void => plot(cv, cx + dx, cy + dy, c);
  const r = (dx: number, dy: number, w: number, h: number, c: string): void =>
    rect(cv, cx + dx, cy + dy, w, h, c);

  // the bush: a big dark mass with a couple of tufts that never lie flat
  ell(cv, cx, cy - 2, 10, 8, 'a', 'b');
  for (const [dx, dy] of [[-3, -7], [0, -8], [3, -7], [-6, -4], [6, -4], [1, -5], [-1, -6]]) p(dx, dy, 'c');
  for (const [dx, dy] of [[-3, -11], [-2, -10], [0, -11], [1, -11], [1, -10], [4, -10], [5, -9]]) p(dx, dy, 'a');
  p(-2, -11, 'b');

  // the face
  ell(cv, cx, cy + 2, 8, 7, 'a', 'v');
  r(-6, 7, 13, 1, 'w');
  // the fringe falls unevenly over the forehead
  r(-7, -3, 15, 2, 'b');
  for (const dx of [-6, -3, 0, 2, 5]) p(dx, -1, 'b');
  p(-4, 0, 'a');
  p(3, 0, 'a');
  // ears
  p(-9, 3, 'v');
  p(9, 3, 'v');
  // nose
  p(0, 5, 'w');
  p(1, 5, 'w');

  const glasses = (dy: number, tilt: number): void => {
    ring(cv, cx - 4, cy + dy, 3, 'r');
    ring(cv, cx + 4, cy + dy + tilt, 3, 'r');
    r(-1, dy, 2, 1, 'r');
    p(-5, dy - 1, 'C');
    p(3, dy - 1 + tilt, 'C');
  };

  if (face === 'under') {
    // glasses pushed up into the hair; the manga covers the eyes, the mouth hangs open
    glasses(-6, 0);
    r(-1, 8, 3, 1, 'a');
    return;
  }
  if (face === 'rub') {
    glasses(-6, 1);
    r(-6, 2, 4, 1, 'a');
    r(3, 2, 4, 1, 'a');
    r(-6, 0, 4, 1, 'a');
    r(3, 0, 4, 1, 'a');
    r(-2, 8, 4, 1, 'w');
    return;
  }
  if (face === 'one') {
    glasses(-6, 0);
    // left eye cracks open, the right is shut, the mouth smacks
    r(-6, 1, 4, 1, 'a');
    r(-6, 2, 4, 2, 'C');
    r(-5, 2, 2, 2, 'a');
    p(-6, 2, 'C');
    r(3, 3, 4, 1, 'a');
    r(-1, 8, 3, 1, 'a');
    return;
  }

  glasses(2, 0);
  // eyes inside the lenses
  const eye = (ex: number, kind: 'dot' | 'shut' | 'down' | 'wide' | 'sq' | 'half'): void => {
    if (kind === 'dot') {
      p(ex, 2, 'a');
      p(ex + 1, 2, 'a');
    } else if (kind === 'shut') {
      r(ex - 1, 3, 4, 1, 'a');
    } else if (kind === 'down') {
      r(ex - 1, 2, 4, 1, 'w');
      p(ex, 3, 'a');
      p(ex + 1, 3, 'a');
    } else if (kind === 'wide') {
      r(ex - 1, 1, 4, 3, 'C');
      r(ex, 2, 2, 2, 'a');
    } else if (kind === 'sq') {
      p(ex - 1, 1, 'a');
      p(ex, 2, 'a');
      p(ex - 1, 3, 'a');
    } else {
      r(ex - 1, 2, 4, 1, 'w');
      r(ex - 1, 3, 4, 1, 'a');
    }
  };

  switch (face) {
    case 'cough':
      eye(-5, 'sq');
      p(7, 1, 'a');
      p(6, 2, 'a');
      p(7, 3, 'a');
      r(-2, 7, 4, 2, 'a');
      r(-1, 8, 2, 1, 'l');
      break;
    case 'wide':
      eye(-5, 'wide');
      eye(3, 'wide');
      r(-2, 6, 3, 1, 'a');
      r(-4, -2, 3, 1, 'a');
      r(2, -2, 3, 1, 'a');
      break;
    case 'grin':
      eye(-5, 'dot');
      eye(3, 'dot');
      r(-3, 6, 7, 1, 'a');
      r(-3, 7, 7, 1, 'C');
      r(-2, 8, 5, 1, 'a');
      p(-4, 6, 'w');
      p(4, 6, 'w');
      break;
    case 'talk':
      eye(-5, 'dot');
      eye(3, 'dot');
      r(-2, 6, 5, 1, 'a');
      r(-2, 7, 5, 2, 'a');
      r(-1, 8, 3, 1, 'l');
      break;
    case 'blink':
      eye(-5, 'shut');
      eye(3, 'shut');
      r(-2, 7, 5, 1, 'a');
      p(-3, 6, 'a');
      p(3, 6, 'a');
      break;
    case 'read':
      eye(-5, 'down');
      eye(3, 'down');
      r(-2, 7, 4, 1, 'a');
      p(2, 6, 'a');
      break;
    case 'drowse':
      eye(-5, 'half');
      eye(3, 'half');
      r(-1, 7, 3, 1, 'a');
      break;
    default: // calm
      eye(-5, 'dot');
      eye(3, 'dot');
      r(-2, 7, 5, 1, 'a');
      p(3, 6, 'a');
      p(-3, 6, 'a');
  }
}

// --- the manga: a cream paperback with a red title bar ------------------------------

function mangaOnFace(cv: Canvas, x: number, y: number): void {
  boxed(cv, x, y, 15, 8, 'a', 'p');
  rect(cv, x + 1, y + 6, 13, 1, 'q');
  rect(cv, x + 2, y + 1, 6, 2, 'k');
  plot(cv, x + 3, y + 1, 'l');
  rect(cv, x + 9, y + 1, 4, 1, 'a');
  rect(cv, x + 2, y + 4, 11, 1, 'a');
  rect(cv, x + 9, y + 2, 4, 1, 'q');
}

/** An open manga page held up to read: two pages and a spine, panels and bubbles. */
function mangaOpen(cv: Canvas, x: number, y: number, flip: boolean): void {
  boxed(cv, x, y, 20, 12, 'a', 'p');
  rect(cv, x + 9, y + 1, 2, 10, 'q');
  rect(cv, x + 2, y + 2, 6, 4, 'C');
  rect(cv, x + 2, y + 2, 6, 1, 'a');
  rect(cv, x + 2, y + 7, 6, 3, 'q');
  rect(cv, x + 12, y + 2, 6, 3, 'q');
  rect(cv, x + 12, y + 6, 6, 4, 'C');
  rect(cv, x + 13, y + 7, 3, 1, 'a');
  plot(cv, x + 4, y + 4, 'a');
  if (flip) {
    // a page mid-turn lifting at the corner
    rect(cv, x + 14, y - 2, 6, 3, 'p');
    rect(cv, x + 14, y - 2, 6, 1, 'a');
    plot(cv, x + 20, y - 1, 'a');
  }
}

// --- the body ---------------------------------------------------------------------

/** A small rounded hand with four separate fingertips. */
function handOpen(cv: Canvas, x: number, y: number): void {
  ell(cv, x + 3, y + 5, 3, 3, 'a', 'v');
  for (let i = 0; i < 4; i += 1) {
    rect(cv, x + i * 2 - 1 + 1, y, 1, 3, 'a');
    rect(cv, x + i * 2 + 1 - 1, y + 1, 1, 3, 'v');
  }
  rect(cv, x + 3, y + 7, 1, 1, 'w');
  rect(cv, x - 2, y + 4, 2, 2, 'v');
  plot(cv, x - 3, y + 4, 'a');
  plot(cv, x - 3, y + 5, 'a');
}

/** A small closed hand resting. */
function handRest(cv: Canvas, x: number, y: number): void {
  ell(cv, x, y, 2, 2, 'a', 'v');
  plot(cv, x - 1, y + 1, 'w');
  plot(cv, x + 1, y + 1, 'w');
}

/** A cardigan sleeve with a cream cuff, as a rounded limb. */
function sleeve(cv: Canvas, cx: number, cy: number, rx: number, ry: number): void {
  ell(cv, cx, cy, rx, ry, 'j', 'k');
  plot(cv, cx - 1, cy - ry + 1, 'l');
}

/** The cardigan torso: open front, cream tee and a headphone band round the neck. */
function cardigan(cv: Canvas, cx: number, cy: number, rx: number, ry: number): void {
  ell(cv, cx, cy, rx, ry, 'j', 'k');
  // light on the shoulder, shadow low down
  rect(cv, cx - rx + 3, cy - ry + 2, rx, 1, 'l');
  rect(cv, cx - rx + 3, cy + ry - 2, rx * 2 - 5, 1, 'j');
  // cream tee down the middle, cardigan edges either side
  rect(cv, cx - 3, cy - ry + 2, 7, ry * 2 - 3, 'p');
  rect(cv, cx - 3, cy - ry + 2, 1, ry * 2 - 3, 'j');
  rect(cv, cx + 3, cy - ry + 2, 1, ry * 2 - 3, 'j');
  rect(cv, cx - 2, cy + ry - 4, 5, 1, 'q');
  for (let y = cy - ry + 5; y < cy + ry - 3; y += 3) plot(cv, cx, y, 'q');
  // a patch pocket
  rect(cv, cx + 5, cy + 1, 5, 3, 'j');
  rect(cv, cx + 5, cy + 1, 5, 1, 'l');
}

/** Headphones worn round the neck: a band under the chin and a cup on the chest. */
function neckPhones(cv: Canvas, cx: number, y: number): void {
  for (let x = cx - 8; x <= cx + 8; x += 1) {
    const d = Math.round(Math.pow((x - cx) / 8, 2) * 2);
    plot(cv, x, y + d, 'B');
    plot(cv, x, y + d + 1, 'A');
  }
  for (const side of [-1, 1]) {
    const x = cx + side * 8;
    ell(cv, x, y + 5, 2, 3, 'a', 'B');
    rect(cv, x - 1, y + 4, 2, 2, 'A');
  }
}

function slippers(cv: Canvas, x: number): void {
  ell(cv, x, 44, 5, 2, 'a', 'l');
  rect(cv, x - 4, 43, 8, 1, 'k');
  rect(cv, x - 3, 41, 7, 2, 'q');
}

function snore(cv: Canvas, x: number, y: number, big: boolean): void {
  rect(cv, x, y, 4, 1, 'C');
  plot(cv, x + 2, y + 1, 'C');
  plot(cv, x + 1, y + 2, 'C');
  rect(cv, x, y + 3, 4, 1, 'C');
  if (big) rect(cv, x + 5, y - 4, 3, 1, 'C');
}

// --- the frames -----------------------------------------------------------------------

const LYING_HEAD = { x: 13, y: 15 } as const;

function lying(face: Face, opts: { lift?: number; jerk?: number; arm?: boolean } = {}): Canvas {
  const cv = blank(SLEEPER.w, SLEEPER.h);
  const lift = opts.lift ?? 0;
  sofaBody(cv);
  mugOnArm(cv, 0);
  // legs: grey sweats and a slipper propped on the far arm, sole to the sky
  ell(cv, 51, 29, 9, 5, 'a', 'B');
  rect(cv, 44, 27, 12, 1, 'A');
  ell(cv, 60, 25, 3, 4, 'a', 'l');
  rect(cv, 58, 21, 5, 2, 'q');
  // the soft round body, rising with each breath
  cardigan(cv, 33, 26 - lift, 14, 9);
  neckPhones(cv, 22, 20 - lift);
  if (opts.arm !== false) {
    // the near arm hangs off the front of the seat, fingers almost on the floor
    sleeve(cv, 31, 36, 3, 6);
    handRest(cv, 31, 43);
  }
  head(cv, LYING_HEAD.x, LYING_HEAD.y - (opts.jerk ?? 0), face);
  return cv;
}

function risen(): Canvas {
  // up on an elbow, shoulders lifting, hair a disaster, glasses back on
  const cv = blank(SLEEPER.w, SLEEPER.h);
  sofaBody(cv);
  mugOnArm(cv, 0);
  ell(cv, 51, 29, 9, 5, 'a', 'B');
  ell(cv, 60, 25, 3, 4, 'a', 'l');
  rect(cv, 58, 21, 5, 2, 'q');
  cardigan(cv, 33, 23, 14, 9);
  neckPhones(cv, 22, 19);
  sleeve(cv, 20, 30, 4, 4);
  handRest(cv, 17, 33);
  sleeve(cv, 31, 36, 3, 6);
  handRest(cv, 31, 43);
  head(cv, 15, 11, 'wide');
  return cv;
}

type Arms = 'rest' | 'wave0' | 'wave1' | 'lower' | 'read' | 'reach';

function seated(face: Face, arms: Arms, opts: { lean?: number; steam?: 0 | 1 | 2 } = {}): Canvas {
  const cv = blank(SLEEPER.w, SLEEPER.h);
  const lean = opts.lean ?? 0;
  sofaBody(cv);
  mugOnArm(cv, opts.steam ?? 0);
  // legs first, so the torso sits down on them: thighs along the seat, shins to the floor
  for (const x of [24, 36]) {
    ell(cv, x + 4, 37, 6, 3, 'a', 'B');
    rect(cv, x, 35, 9, 1, 'A');
    boxed(cv, x + 1, 38, 7, 4, 'a', 'B');
    rect(cv, x + 2, 39, 1, 2, 'A');
    slippers(cv, x + 4);
  }
  cardigan(cv, 32 - lean, 27, 13, 9);
  neckPhones(cv, 32 - lean, 20);

  switch (arms) {
    case 'rest':
      sleeve(cv, 19 - lean, 29, 3, 6);
      handRest(cv, 20 - lean, 36);
      sleeve(cv, 45 - lean, 29, 3, 6);
      handRest(cv, 44 - lean, 36);
      break;
    case 'lower':
      // the far hand is halfway down: forearm out level, fingers soft
      sleeve(cv, 19, 29, 3, 6);
      handRest(cv, 20, 36);
      sleeve(cv, 46, 27, 3, 4);
      sleeve(cv, 50, 28, 3, 3);
      handOpen(cv, 52, 23);
      break;
    case 'wave0':
    case 'wave1': {
      sleeve(cv, 19, 29, 3, 6);
      handRest(cv, 20, 36);
      const tilt = arms === 'wave0' ? 0 : 2;
      sleeve(cv, 46, 24, 4, 3);
      sleeve(cv, 49 + tilt, 16, 3, 6);
      handOpen(cv, 47 + tilt, 2);
      break;
    }
    case 'read':
      // both hands hold the manga open in front of his chest
      sleeve(cv, 21, 28, 3, 6);
      sleeve(cv, 43, 28, 3, 6);
      break;
    case 'reach':
      // leaning forward with the near arm down at the floor, the other on his knee
      sleeve(cv, 45 - lean, 29, 3, 6);
      handRest(cv, 44 - lean, 36);
      sleeve(cv, 15, 33, 3, 8);
      handOpen(cv, 12, 40);
      break;
  }

  head(cv, 32 - lean, 9 + (arms === 'reach' ? 4 : 0), face);

  if (arms === 'read') {
    mangaOpen(cv, 22, 24, face === 'read' && opts.steam === 2);
    handRest(cv, 22, 33);
    handRest(cv, 42, 33);
  }
  return cv;
}

export function sleeperFrame(frame: SleepFrame): string[] {
  switch (frame) {
    case 'asleep0':
    case 'asleep1': {
      const cv = lying('under', { lift: frame === 'asleep1' ? 1 : 0 });
      mangaOnFace(cv, 6, frame === 'asleep1' ? 12 : 13);
      if (frame === 'asleep1') snore(cv, 27, 6, true);
      else snore(cv, 25, 9, false);
      return rows(cv);
    }
    case 'cough0':
    case 'cough1': {
      const jerk = frame === 'cough1' ? 2 : 0;
      const cv = lying('cough', { jerk });
      // the manga hops off his face, a fist goes to his mouth, a cough in two puffs
      mangaOnFace(cv, 6, 8 - jerk * 2);
      ell(cv, 16, 26 - jerk, 3, 3, 'a', 'v');
      rect(cv, 15, 27 - jerk, 3, 1, 'w');
      for (const [x, y] of [[26, 19], [28, 17], [29, 20], [27, 23], [30, 22]]) plot(cv, x, y - jerk, 'C');
      return rows(cv);
    }
    case 'slide': {
      // the manga skids off his face and down his chest; eyes screwed shut
      const cv = lying('rub');
      mangaOnFace(cv, 22, 22);
      return rows(cv);
    }
    case 'oneEye': {
      const cv = lying('one');
      mangaOnFace(cv, 24, 24);
      return rows(cv);
    }
    case 'bothEyes':
      return rows(lying('wide'));
    case 'rise':
      return rows(risen());
    case 'sitUp':
      return rows(seated('wide', 'rest'));
    case 'awake0':
      return rows(seated('grin', 'wave0'));
    case 'awake1':
      return rows(seated('talk', 'wave1'));
    case 'lower':
      return rows(seated('talk', 'lower'));
    case 'sit0':
      return rows(seated('calm', 'rest', { steam: 1 }));
    case 'sit1':
      return rows(seated('blink', 'rest', { steam: 2 }));
    case 'reach':
      return rows(seated('calm', 'reach', { lean: 5 }));
    case 'read0':
      return rows(seated('read', 'read', { steam: 1 }));
    case 'read1':
      return rows(seated('read', 'read', { steam: 2 }));
    default: {
      // lying back, the manga travelling up toward his face, eyes sliding shut
      const cv = lying('drowse');
      mangaOnFace(cv, 12, 20);
      return rows(cv);
    }
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
  sleeperLower: sleeperFrame('lower'),
  sleeperSit0: sleeperFrame('sit0'),
  sleeperSit1: sleeperFrame('sit1'),
  sleeperReach: sleeperFrame('reach'),
  sleeperRead0: sleeperFrame('read0'),
  sleeperRead1: sleeperFrame('read1'),
  sleeperLayBack: sleeperFrame('layBack'),
};
