/**
 * Huzbi, the host, on his nap-room sofa, drawn at the same 1x pixel scale as
 * the 16x24 visitor. Seated he is a 17-wide, 31-tall figure on a furniture-sized
 * sofa; lying he is a ~30x12 body with his head on a pillow. Nothing is enlarged
 * to act: every beat is a 1-2px shift or a pose swap.
 *
 * Identity, kept from the cardigan-owl design: a bush of messy hair, round amber
 * glasses, a terracotta cardigan over a cream tee, headphones hanging round his
 * neck, grey sweats, fat red slippers and a tea mug on the sofa arm. 64 by 46,
 * one sprite for the sofa and whoever is on it.
 *
 * Frames cover the whole ending loop: asleep (two breathing frames, glasses
 * pushed up into the hair and the manga on his face), stir (two: the cough
 * lands, his breath catches and the manga jerks up off his nose), slide (the
 * manga leaves his face), one eye, both eyes, rise, sit up, awake (a wave, two
 * frames), then the life after the talk: the hand lowers (two), he sits for a
 * beat (two), leans down for the manga, reads (two) and lies back (two) until
 * the manga is on his face again.
 * Original pixel art, palette keys only.
 */

type Canvas = string[][];

export const SLEEPER = { w: 64, h: 46 } as const;

export type SleepFrame =
  | 'asleep0'
  | 'asleep1'
  | 'stir0'
  | 'stir1'
  | 'slide'
  | 'oneEye'
  | 'bothEyes'
  | 'rise'
  | 'sitUp'
  | 'awake0'
  | 'awake1'
  | 'lower0'
  | 'lower1'
  | 'sit0'
  | 'sit1'
  | 'reach0'
  | 'reach1'
  | 'read0'
  | 'read1'
  | 'layBack0'
  | 'layBack1';

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

/** Lay rows of text with their top-left at (x, y); `.` leaves what is underneath. */
function lay(cv: Canvas, x: number, y: number, art: string[], width?: number): void {
  art.forEach((row, j) => {
    if (width !== undefined && row.length !== width) {
      throw new Error(`sleeper art row ${j} is ${row.length} wide, expected ${width}: ${row}`);
    }
    [...row].forEach((c, i) => {
      if (c !== '.') plot(cv, x + i, y + j, c);
    });
  });
}

const STEPS = [[1, 0], [-1, 0], [0, 1], [0, -1]] as const;

/** A thick limb along a polyline, with a one-pixel outline. */
function limb(cv: Canvas, pts: [number, number][], r: number, edge: string, fill: string): void {
  const inside = new Set<string>();
  for (let s = 0; s < pts.length - 1; s += 1) {
    const [x0, y0] = pts[s];
    const [x1, y1] = pts[s + 1];
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2 + 1;
    for (let k = 0; k <= n; k += 1) {
      const cx = x0 + ((x1 - x0) * k) / n;
      const cy = y0 + ((y1 - y0) * k) / n;
      for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y += 1) {
        for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x += 1) {
          if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) inside.add(`${x},${y}`);
        }
      }
    }
  }
  for (const key of inside) {
    const [x, y] = key.split(',').map(Number);
    for (const [dx, dy] of STEPS) {
      if (!inside.has(`${x + dx},${y + dy}`)) plot(cv, x + dx, y + dy, edge);
    }
  }
  for (const key of inside) {
    const [x, y] = key.split(',').map(Number);
    plot(cv, x, y, fill);
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

/** A pillow on the near arm of the sofa, where he lays his head. */
function pillow(cv: Canvas): void {
  rect(cv, 3, 27, 16, 6, 'a');
  rect(cv, 4, 28, 14, 4, 'o');
  rect(cv, 4, 31, 14, 1, 'n');
  rect(cv, 5, 28, 6, 1, 'C');
}

// --- the head: a bush of hair, round amber glasses, 11 wide and 11 tall -----------

export type Face =
  | 'under' // asleep under the manga
  | 'rub' // screwed shut, a fist rubbing an eye
  | 'one' // one eye cracked open
  | 'wide' // both eyes open, glasses still up
  | 'wideOn' // wide, glasses on
  | 'huh' // mouth open, eyes still shut, caught mid-snore
  | 'grin' // awake, wave
  | 'talk' // mid-sentence, mouth open
  | 'calm' // sitting, tired but fond
  | 'blink'
  | 'read' // eyes down on a page
  | 'drowse'; // half-lidded, about to go under

const HEAD_BASE = [
  '...a..a....',
  '..abbabba..',
  '.abcbbbcba.',
  '.abbbbbbba.',
  '.abbvvvbba.',
  '.avvvvvvva.',
  'wavvvvvvvaw',
  'wavvvvvvvaw',
  '.avvvwvvva.',
  '..avvvvva..',
  '...aaaaa...',
];

/** Draws the head with its top-left at (x, y). */
function head(cv: Canvas, x: number, y: number, face: Face): void {
  lay(cv, x, y, HEAD_BASE, 11);
  const p = (dx: number, dy: number, c: string): void => plot(cv, x + dx, y + dy, c);
  /** At most 2px wide and 1px tall, below the nose and clear of the lenses. */
  const mouth = (left: string, right: string = left): void => {
    p(4, 9, left);
    p(5, 9, right);
  };

  // glasses: two round amber rings and a bridge, on the nose or pushed up in the hair
  const glassesOn = (): void => {
    for (const lx of [1, 6]) lay(cv, x + lx, y + 4, ['aaaa', 'arra', 'arra', 'aaaa']);
    p(5, 5, 'a');
    p(2, 5, 's');
    p(7, 5, 's');
  };
  const glassesUp = (): void => {
    lay(cv, x + 2, y + 2, ['rrr.rrr']);
    for (const dx of [2, 4, 6, 8]) p(dx, 3, 'r');
    p(2, 2, 's');
    p(6, 2, 's');
  };
  /** Eyes inside the lenses, one pixel each. */
  const lens = (left: string, right: string): void => {
    p(3, 6, left);
    p(7, 6, right);
    p(2, 6, left === 'C' ? 'C' : 'r');
    p(8, 6, right === 'C' ? 'C' : 'r');
  };
  /** Bare eyes, two pixels each, when the glasses are up. */
  const bare = (left: string, right: string): void => {
    const draw = (ex: number, kind: string): void => {
      if (kind === 'open') {
        p(ex, 6, 'C');
        p(ex + 1, 6, 'a');
      } else if (kind === 'shut') {
        p(ex, 6, 'a');
        p(ex + 1, 6, 'a');
      } else if (kind === 'half') {
        p(ex, 6, 'w');
        p(ex + 1, 6, 'a');
      } else if (kind === 'rub') {
        p(ex, 5, 'a');
        p(ex + 1, 6, 'a');
        p(ex, 7, 'a');
      }
    };
    draw(2, left);
    draw(7, right);
  };

  switch (face) {
    case 'under':
      glassesUp();
      mouth('w');
      break;
    case 'rub':
      glassesUp();
      bare('rub', 'shut');
      mouth('w');
      break;
    case 'one':
      glassesUp();
      bare('open', 'shut');
      mouth('a', 'l');
      break;
    case 'wide':
      glassesUp();
      bare('open', 'open');
      for (const dx of [2, 3, 7, 8]) p(dx, 4, 'a');
      mouth('a', 'w');
      break;
    case 'wideOn':
      glassesOn();
      lens('C', 'C');
      mouth('a');
      break;
    case 'huh':
      glassesUp();
      bare('shut', 'shut');
      mouth('a', 'w');
      break;
    case 'grin':
      glassesOn();
      lens('a', 'a');
      mouth('C', 'C');
      break;
    case 'talk':
      glassesOn();
      lens('a', 'a');
      mouth('a', 'l');
      break;
    case 'blink':
      glassesOn();
      lens('r', 'r');
      mouth('w');
      break;
    case 'read':
      glassesOn();
      lens('a', 'a');
      p(3, 7, 'a');
      p(7, 7, 'a');
      mouth('w');
      break;
    case 'drowse':
      glassesUp();
      bare('half', 'half');
      mouth('w');
      break;
    default: // calm
      glassesOn();
      lens('a', 'a');
      mouth('w');
  }
}

// --- the manga -------------------------------------------------------------------

/** A cream paperback with a red title bar, small enough to lie on a face. 11 by 6. */
function mangaOnFace(cv: Canvas, x: number, y: number): void {
  lay(cv, x, y, [
    'aaaaaaaaaaa',
    'appppppppqa',
    'akkkpaaaapa',
    'aklkpppppqa',
    'apqqqqqqqqa',
    'aaaaaaaaaaa',
  ], 11);
}

/**
 * The manga held open to read, seen from the front: the back cover faces the
 * visitor, because the pages face Huzbi. 14 by 9.
 */
function mangaCover(cv: Canvas, x: number, y: number, flip: boolean): void {
  lay(cv, x, y + (flip ? -1 : 0), [
    'aaaaaaaaaaaaaa',
    'appppppppppppa',
    'apkkkkkkkkkkpa',
    'apkllllllllkpa',
    'appppppppppppa',
    'apppkkkkkppppa',
    'apppklllkppppa',
    'appppppppppppa',
    'aaaaaaaaaaaaaa',
  ], 14);
}

// --- the cardigan -----------------------------------------------------------------

const CARDIGAN = [
  '..jkkpppkkj..',
  '.jkklpqpkkkj.',
  'jkkkkpqpkkkkj',
  'jkkkjpqpjkkkj',
  'jkkkjpppjkkkj',
  'jkkkjpqpjkkkj',
  'jlkkjqqqjkkkj',
  'jkkkkkkkkkkkj',
  'jkkkkkkkkkkkj',
  '.jjkkkkkkkjj.',
  '..jjjjjjjjj..',
];

/** Seated torso, 13 wide and 11 tall, headphones hanging round the neck. */
function seatedTorso(cv: Canvas, x: number, y: number): void {
  lay(cv, x, y, CARDIGAN, 13);
  // the band comes up behind the neck either side; a cup hangs on each side of the tee
  lay(cv, x, y, [
    '...B.....B...',
    '...B.....B...',
    '..BBB...BBB..',
    '..BAB...BAB..',
    '..aaa...aaa..',
  ], 13);
  // a patch pocket
  rect(cv, x + 9, y + 7, 3, 2, 'j');
  plot(cv, x + 9, y + 7, 'l');
}

function slippers(cv: Canvas, x: number): void {
  lay(cv, x, 41, ['.alla.', 'allllk', 'akkkka', 'aaaaaa'], 6);
}

// --- the frames -----------------------------------------------------------------------

function legsSeated(cv: Canvas, x: number): void {
  // thighs along the seat, shins to the floor, a slipper on each foot
  rect(cv, x, 33, 13, 3, 'a');
  rect(cv, x + 1, 33, 11, 2, 'B');
  rect(cv, x + 1, 33, 11, 1, 'A');
  for (const lx of [x + 1, x + 7]) {
    boxed(cv, lx, 35, 5, 7, 'a', 'B');
    rect(cv, lx + 1, 36, 1, 4, 'A');
    slippers(cv, lx - 1);
  }
}

type Arms = 'rest' | 'wave0' | 'wave1' | 'lower0' | 'lower1' | 'read' | 'reach0' | 'reach1';

/** A soft waving hand, fingers up, small enough to sit beside his head. 5 by 5. */
const WAVE_HAND = ['.a.a.', 'avvva', 'avvva', '.avwa', '..aa.'];

/** Where the manga lies on the seat once it has slid off his face: within an arm's reach. */
const SEAT_MANGA = { x: 13, y: 32 } as const;

function seated(
  face: Face,
  arms: Arms,
  opts: { lean?: number; dy?: number; steam?: 0 | 1 | 2; flip?: boolean; headDy?: number; seatManga?: boolean } = {},
): Canvas {
  const cv = blank(SLEEPER.w, SLEEPER.h);
  const lean = opts.lean ?? 0;
  const dy = opts.dy ?? 0;
  sofaBody(cv);
  mugOnArm(cv, opts.steam ?? 0);
  if (opts.seatManga) mangaOnFace(cv, SEAT_MANGA.x, SEAT_MANGA.y);
  legsSeated(cv, 26);
  seatedTorso(cv, 26 - lean, 23 + dy);

  const sleeve = (x: number, y: number, h: number): void => {
    boxed(cv, x, y, 3, h, 'j', 'k');
    plot(cv, x + 1, y + 1, 'l');
    rect(cv, x + 1, y + h - 2, 1, 1, 'q');
  };
  const hand = (x: number, y: number): void => {
    lay(cv, x, y, ['avva', 'avwa', '.aa.']);
  };

  switch (arms) {
    case 'rest':
      sleeve(24 - lean, 25 + dy, 9);
      hand(23 - lean, 34 + dy);
      sleeve(38 - lean, 25 + dy, 9);
      hand(38 - lean, 34 + dy);
      break;
    case 'lower0':
    case 'lower1': {
      // the wave coming down: forearm out and falling, the hand soft at the end
      sleeve(24, 25, 9);
      hand(23, 34);
      sleeve(38, 25, 6);
      if (arms === 'lower0') {
        limb(cv, [[40, 26], [44, 25], [45, 21]], 1.3, 'j', 'k');
        lay(cv, 43, 18, WAVE_HAND, 5);
      } else {
        limb(cv, [[40, 27], [44, 27], [47, 28]], 1.4, 'j', 'k');
        lay(cv, 46, 25, ['.aaa', 'avva', 'avva', '.aaa'], 4);
      }
      break;
    }
    case 'wave0':
    case 'wave1': {
      sleeve(24, 25, 9);
      hand(23, 34);
      const lift = arms === 'wave0' ? 0 : 1;
      // upper arm out to a bent elbow, forearm up beside his head, hand at
      // ear height: a wave, not a flagpole
      limb(cv, [[39, 27], [43, 25], [43, 20 - lift]], 1.3, 'j', 'k');
      lay(cv, 41, 15 - lift, WAVE_HAND, 5);
      break;
    }
    case 'read':
      // both forearms come in to hold the manga open in front of his chest
      sleeve(24, 25, 6);
      sleeve(38, 25, 6);
      break;
    case 'reach0':
    case 'reach1': {
      // leaning a little toward the manga on the seat; the far arm rests, the near hand goes to the book
      sleeve(38 - lean, 25 + dy, 9);
      hand(38 - lean, 34 + dy);
      if (arms === 'reach0') {
        limb(cv, [[25 - lean, 27], [22, 31], [21, 33]], 1.5, 'j', 'k');
        lay(cv, 19, 32, ['avva', 'avwa'], 4);
      } else {
        // the book comes up off the seat in his hand
        limb(cv, [[25 - lean, 27], [23, 31], [22, 31]], 1.5, 'j', 'k');
        mangaOnFace(cv, 14, 27);
        lay(cv, 20, 31, ['avva', 'avwa'], 4);
      }
      break;
    }
  }

  head(cv, 27 - lean, 12 + dy + (opts.headDy ?? 0), face);

  if (arms === 'read') {
    mangaCover(cv, 25, 25 + dy, opts.flip === true);
    lay(cv, 23, 29 + dy, ['avv', 'avv'], 3);
    lay(cv, 40, 29 + dy, ['vva', 'vva'], 3);
  }
  return cv;
}

// --- lying down --------------------------------------------------------------------

const HEAD_AT = { x: 8, y: 19 } as const;

function lyingBase(lift: number): Canvas {
  const cv = blank(SLEEPER.w, SLEEPER.h);
  sofaBody(cv);
  mugOnArm(cv, 0);
  pillow(cv);

  // legs: grey sweats, knees up, and a fat slipper on each foot
  limb(cv, [[28, 28], [32, 22 - lift], [36, 29]], 2.6, 'a', 'B');
  limb(cv, [[29, 27], [32, 22 - lift]], 0.8, 'A', 'A');
  lay(cv, 36, 28, ['.alla.', 'allllk', 'akkkka', 'aaaaaa'], 6);

  // the soft round body, rising with each breath
  const top = 22 - lift;
  rect(cv, 19, top, 10, 10 + lift, 'j');
  rect(cv, 20, top + 1, 8, 8 + lift, 'k');
  rect(cv, 20, top + 1, 6, 1, 'l');
  rect(cv, 20, top + 8 + lift, 8, 1, 'j');
  for (const [x, y] of [[19, top], [28, top], [19, top + 9 + lift], [28, top + 9 + lift]]) plot(cv, x, y, '.');
  // cream tee down the middle, cardigan edges either side
  rect(cv, 21, top + 3, 6, 3 + lift, 'p');
  rect(cv, 21, top + 3, 6, 1, 'j');
  rect(cv, 21, top + 5 + lift, 6, 1, 'j');
  rect(cv, 22, top + 4, 4, 1, 'q');
  // a patch pocket low on the hip
  rect(cv, 24, top + 7 + lift, 3, 2, 'j');
  plot(cv, 24, top + 7 + lift, 'l');
  return cv;
}

/** Headphones draped round the neck: a band over the join of head and shoulders, a cup on his chest. */
function lyingPhones(cv: Canvas, lift: number): void {
  const top = 22 - lift;
  rect(cv, 18, top, 1, 10 + lift, 'B');
  rect(cv, 19, top + 1, 1, 8 + lift, 'A');
  rect(cv, 19, top + 3, 3, 1, 'B');
  lay(cv, 21, top + 4, ['BBB', 'BAB', 'BBB', 'aaa'], 3);
}

function lyingHand(cv: Canvas, lift: number, pos: 'belly' | 'hang' | 'none'): void {
  const top = 22 - lift;
  if (pos === 'none') return;
  if (pos === 'belly') {
    // the near arm folded across the belly, the hand resting on the tee
    limb(cv, [[22, top + 8], [25, top + 6]], 1.5, 'j', 'k');
    lay(cv, 25, top + 4, ['aaaa', 'avva', 'avwa', '.aaa'], 4);
  } else {
    // the near arm slipped off the front of the seat, fingers drifting down
    limb(cv, [[26, top + 9], [27, 35]], 1.5, 'j', 'k');
    lay(cv, 25, 37, ['avvva', 'avwva', '.aaa.'], 5);
  }
}

function lying(face: Face, opts: { lift?: number; hand?: 'belly' | 'hang' | 'none'; headLift?: number } = {}): Canvas {
  const lift = opts.lift ?? 0;
  const cv = lyingBase(lift);
  lyingPhones(cv, lift);
  lyingHand(cv, lift, opts.hand ?? 'belly');
  head(cv, HEAD_AT.x, HEAD_AT.y - lift - (opts.headLift ?? 0), face);
  return cv;
}

function snore(cv: Canvas, x: number, y: number, big: boolean): void {
  // a small z, and a bigger one drifting up behind it
  lay(cv, x, y, ['CCC', '.C.', 'CCC']);
  if (big) lay(cv, x + 4, y - 4, ['CC', '.C', 'CC']);
}

/** The snore turning into a question mark as the cough lands. 5 by 6. */
function puzzled(cv: Canvas, x: number, y: number): void {
  lay(cv, x, y, ['.CCC.', 'C...C', '...C.', '..C..', '.....', '..C..'], 5);
}

function risen(): Canvas {
  // up on an elbow, shoulders and head lifting, glasses back on, hair a disaster
  const cv = lyingBase(3);
  lyingPhones(cv, 3);
  limb(cv, [[24, 29], [21, 32], [17, 33]], 1.6, 'j', 'k');
  lay(cv, 12, 31, ['aaaa', 'avva', 'avva', '.aaa'], 4);
  head(cv, 9, 12, 'wideOn');
  return cv;
}

export function sleeperFrame(frame: SleepFrame): string[] {
  switch (frame) {
    case 'asleep0':
    case 'asleep1': {
      const up = frame === 'asleep1';
      const cv = lying('under', { lift: up ? 1 : 0, hand: 'belly' });
      mangaOnFace(cv, 7, up ? 22 : 23);
      if (up) snore(cv, 16, 10, true);
      else snore(cv, 15, 13, false);
      return rows(cv);
    }
    case 'stir0': {
      // the cough lands: his breath catches, the manga jerks up off his nose,
      // and the snore turns into a question mark
      const cv = lying('huh', { lift: 1, headLift: 1, hand: 'belly' });
      mangaOnFace(cv, 7, 20);
      puzzled(cv, 14, 8);
      return rows(cv);
    }
    case 'stir1': {
      // the head drops back and the book slips down his face onto his chest
      const cv = lying('under', { hand: 'belly' });
      mangaOnFace(cv, 7, 26);
      puzzled(cv, 15, 9);
      return rows(cv);
    }
    case 'slide': {
      // the manga skids off his face and down his chest; eyes screwed shut
      const cv = lying('rub', { hand: 'belly' });
      mangaOnFace(cv, SEAT_MANGA.x - 3, SEAT_MANGA.y - 1);
      return rows(cv);
    }
    case 'oneEye': {
      const cv = lying('one', { hand: 'belly' });
      mangaOnFace(cv, SEAT_MANGA.x - 1, SEAT_MANGA.y - 1);
      return rows(cv);
    }
    case 'bothEyes': {
      const cv = lying('wide', { hand: 'belly' });
      mangaOnFace(cv, SEAT_MANGA.x, SEAT_MANGA.y);
      return rows(cv);
    }
    case 'rise': {
      const cv = risen();
      mangaOnFace(cv, SEAT_MANGA.x, SEAT_MANGA.y);
      return rows(cv);
    }
    case 'sitUp':
      return rows(seated('wideOn', 'rest', { seatManga: true }));
    case 'awake0':
      return rows(seated('grin', 'wave0', { seatManga: true }));
    case 'awake1':
      return rows(seated('talk', 'wave1', { seatManga: true }));
    case 'lower0':
      return rows(seated('talk', 'lower0', { seatManga: true }));
    case 'lower1':
      return rows(seated('calm', 'lower1', { seatManga: true }));
    case 'sit0':
      return rows(seated('calm', 'rest', { steam: 1, seatManga: true }));
    case 'sit1':
      return rows(seated('blink', 'rest', { steam: 2, dy: 1, headDy: -1, seatManga: true }));
    case 'reach0':
      return rows(seated('calm', 'reach0', { lean: 3, headDy: 1, seatManga: true }));
    case 'reach1':
      return rows(seated('calm', 'reach1', { lean: 2, headDy: 1 }));
    case 'read0':
      return rows(seated('read', 'read', { steam: 1 }));
    case 'read1':
      return rows(seated('read', 'read', { steam: 2, flip: true, headDy: 1 }));
    case 'layBack0': {
      // lying back, one hand lifting the manga up toward his face, eyes sliding shut
      const cv = lying('drowse', { hand: 'belly' });
      limb(cv, [[24, 27], [20, 18], [16, 13]], 1.5, 'j', 'k');
      mangaOnFace(cv, 6, 8);
      return rows(cv);
    }
    default: {
      // the manga settling onto his face, the hand easing away
      const cv = lying('drowse', { hand: 'belly' });
      mangaOnFace(cv, 7, 22);
      return rows(cv);
    }
  }
}

export const SLEEPER_GRIDS: Record<string, string[]> = {
  sleeperAsleep0: sleeperFrame('asleep0'),
  sleeperAsleep1: sleeperFrame('asleep1'),
  sleeperStir0: sleeperFrame('stir0'),
  sleeperStir1: sleeperFrame('stir1'),
  sleeperSlide: sleeperFrame('slide'),
  sleeperOneEye: sleeperFrame('oneEye'),
  sleeperBothEyes: sleeperFrame('bothEyes'),
  sleeperRise: sleeperFrame('rise'),
  sleeperSitUp: sleeperFrame('sitUp'),
  sleeperAwake: sleeperFrame('awake0'),
  sleeperAwake1: sleeperFrame('awake1'),
  sleeperLower: sleeperFrame('lower0'),
  sleeperLower1: sleeperFrame('lower1'),
  sleeperSit0: sleeperFrame('sit0'),
  sleeperSit1: sleeperFrame('sit1'),
  sleeperReach: sleeperFrame('reach0'),
  sleeperReach1: sleeperFrame('reach1'),
  sleeperRead0: sleeperFrame('read0'),
  sleeperRead1: sleeperFrame('read1'),
  sleeperLayBack: sleeperFrame('layBack0'),
  sleeperLayBack1: sleeperFrame('layBack1'),
};
