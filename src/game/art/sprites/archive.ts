import { PALETTES } from '../palette';
import { CAT_GRIDS } from './cat';

/**
 * The Archive: a records room that somebody labelled and never filed. Shelves
 * of boxes, a stool with a terminal, a jar of evidence, a framed cat, a glass
 * case of dust, a tired vector screen and a poster. Built from small helpers
 * so each grid is exact, then handed to the shared decoder like every sprite.
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

/** A box with a one pixel outline, so every object reads against the dark. */
const boxed = (cv: Canvas, x: number, y: number, w: number, h: number, edge: string, fill: string): void => {
  rect(cv, x, y, w, h, edge);
  rect(cv, x + 1, y + 1, w - 2, h - 2, fill);
};

const rows = (cv: Canvas): string[] => cv.map((r) => r.join(''));

function hash(a: number, b: number): number {
  let h = Math.imul(a + 0x9e3779b9, 0x45d9f3b) ^ Math.imul(b + 0x7f4a7c15, 0x27d4eb2d);
  h ^= h >>> 15;
  h = Math.imul(h, 0x2c1b3c6d);
  h ^= h >>> 12;
  return h >>> 0;
}

// --- shelves ---------------------------------------------------------------

/** Spine colours for file boxes: face, top edge, shadow. */
const BOX_TONES: readonly [string, string, string][] = [
  ['k', 'l', 'j'],
  ['n', 'o', 'm'],
  ['x', 'z', 'y'],
  ['E', 'z', 'c'],
  ['h', 'i', 'g'],
  ['q', 'p', 'B'],
  ['g', 'h', 'f'],
];

export const SHELF = { w: 40, h: 44 } as const;

/**
 * A wooden unit of three rows, each packed with file boxes of different
 * heights. `seed` changes the order so no two shelves match.
 */
function shelf(seed: number): string[] {
  const cv = blank(SHELF.w, SHELF.h);
  // The frame: two posts, a top board and three shelf boards.
  rect(cv, 0, 0, SHELF.w, SHELF.h, 'e');
  rect(cv, 1, 1, SHELF.w - 2, SHELF.h - 2, 'a');
  rect(cv, 1, 1, 2, SHELF.h - 1, 'f');
  rect(cv, SHELF.w - 3, 1, 2, SHELF.h - 1, 'f');
  rect(cv, 1, 1, 1, SHELF.h - 1, 'g');
  for (const y of [0, 14, 28, 42]) {
    rect(cv, 0, y, SHELF.w, 2, 'e');
    rect(cv, 1, y, SHELF.w - 2, 1, 'h');
    rect(cv, 1, y + 1, SHELF.w - 2, 1, 'g');
  }

  for (let row = 0; row < 3; row += 1) {
    const floor = 14 + row * 14; // the board this row rests on
    let x = 4;
    let n = 0;
    while (x < SHELF.w - 4) {
      const r = hash(seed * 31 + row, n);
      n += 1;
      const w = 4 + (r % 3);
      const h = 7 + ((r >>> 4) % 5);
      if (x + w > SHELF.w - 4) break;
      // A gap now and then, and one that has fallen over.
      if ((r >>> 9) % 7 === 0) {
        x += 3;
        continue;
      }
      const [face, top, shade] = BOX_TONES[(r >>> 12) % BOX_TONES.length];
      const y = floor - h;
      rect(cv, x, y, w, h, face);
      rect(cv, x, y, w, 1, top);
      rect(cv, x + w - 1, y + 1, 1, h - 1, shade);
      // The label: a cream strip on the spine, sometimes with a scrawl.
      if (h >= 8) {
        rect(cv, x + 1, y + 3, w - 2, 2, 'p');
        if ((r >>> 17) % 2 === 0) plot(cv, x + 1, y + 4, 'q');
      }
      x += w + 1;
    }
  }
  return rows(cv);
}

// --- floor props -----------------------------------------------------------

/** Three crates in a stack, labelled in a hurry. */
const BOX_STACK = (() => {
  const cv = blank(24, 24);
  const crate = (x: number, y: number, w: number, h: number, tone: number): void => {
    boxed(cv, x, y, w, h, 'e', tone === 0 ? 'g' : 'h');
    rect(cv, x + 1, y + 1, w - 2, 1, 'i');
    rect(cv, x + 1, y + h - 3, w - 2, 1, 'f');
    rect(cv, x + 3, y + 3, w - 6, 3, 'p'); // label
    rect(cv, x + 4, y + 4, w - 9, 1, 'q');
    for (const dx of [0, w - 2]) rect(cv, x + dx, y + 1, 1, h - 2, 'f');
  };
  crate(1, 10, 14, 14, 0);
  crate(11, 12, 12, 12, 1);
  crate(4, 0, 12, 10, 1);
  return rows(cv);
})();

// --- the terminal on a stool ------------------------------------------------

export const TERM = { w: 36, h: 36 } as const;
/** Where the tiny screen sits on the sprite, for text and cursor. */
export const TERM_SCREEN = { x: 4, y: 3, w: 28, h: 18 } as const;

const TERMINAL = (() => {
  const cv = blank(TERM.w, TERM.h);
  // The cream CRT.
  boxed(cv, 0, 0, 36, 26, 'a', 'p');
  rect(cv, 1, 1, 34, 1, 'C');
  rect(cv, 34, 2, 1, 23, 'q');
  rect(cv, 1, 23, 34, 2, 'q');
  // A bezel round the glass, then the glass.
  rect(cv, 3, 2, 30, 20, 'B');
  rect(cv, 4, 3, 28, 18, 'a');
  rect(cv, 4, 3, 28, 1, 'u');
  rect(cv, 4, 3, 1, 18, 'u');
  // Knobs and a vent.
  rect(cv, 27, 23, 2, 2, 'r');
  rect(cv, 30, 23, 2, 2, 'k');
  for (let x = 5; x < 15; x += 2) rect(cv, x, 23, 1, 2, 'B');
  // The keyboard, on the stool's seat.
  boxed(cv, 5, 26, 24, 4, 'a', 'A');
  for (let x = 7; x < 28; x += 3) rect(cv, x, 27, 2, 1, 'B');
  rect(cv, 9, 28, 14, 1, 'B');
  // A round stool: seat, then three legs.
  rect(cv, 2, 29, 32, 4, 'e');
  rect(cv, 3, 29, 30, 2, 'h');
  rect(cv, 3, 31, 30, 1, 'g');
  rect(cv, 3, 32, 30, 1, 'f');
  rect(cv, 3, 29, 12, 1, 'i');
  for (const x of [5, 16, 28]) {
    rect(cv, x, 33, 3, 3, 'e');
    rect(cv, x + 1, 33, 1, 3, 'f');
  }
  return rows(cv);
})();

// --- the cookie jar ---------------------------------------------------------

export const JAR = { w: 32, h: 32 } as const;
/** The inside of the glass, for the cookies. */
export const JAR_INSIDE = { x: 9, y: 9, w: 14, h: 12 } as const;

const COOKIE_JAR = (() => {
  const cv = blank(JAR.w, JAR.h);
  // A small table.
  rect(cv, 1, 22, 30, 3, 'e');
  rect(cv, 2, 22, 28, 1, 'i');
  rect(cv, 2, 23, 28, 1, 'h');
  rect(cv, 2, 24, 28, 1, 'f');
  rect(cv, 4, 25, 3, 7, 'e');
  rect(cv, 5, 25, 1, 6, 'f');
  rect(cv, 25, 25, 3, 7, 'e');
  rect(cv, 26, 25, 1, 6, 'f');
  rect(cv, 8, 28, 16, 1, 'f'); // a stretcher between the legs
  // The glass jar.
  rect(cv, 7, 5, 18, 17, 'a');
  rect(cv, 8, 6, 16, 15, 'B');
  rect(cv, 9, 7, 14, 13, 'b');
  rect(cv, 9, 20, 14, 1, 'c');
  rect(cv, 9, 7, 1, 13, 'A'); // the shine down one side
  rect(cv, 10, 8, 1, 4, 'C');
  rect(cv, 22, 8, 1, 12, 'B');
  // The lid and its knob.
  rect(cv, 8, 2, 16, 4, 'a');
  rect(cv, 9, 3, 14, 2, 'B');
  rect(cv, 9, 3, 14, 1, 'A');
  rect(cv, 13, 0, 6, 3, 'a');
  rect(cv, 14, 1, 4, 1, 'r');
  // A paper tag on string, because everything here is labelled.
  rect(cv, 24, 8, 4, 1, 'q');
  rect(cv, 26, 9, 5, 6, 'a');
  rect(cv, 27, 10, 3, 4, 'p');
  rect(cv, 28, 11, 2, 1, 'q');
  rect(cv, 28, 13, 1, 1, 'q');
  return rows(cv);
})();

// --- the framed cat ---------------------------------------------------------

export const FRAME = { w: 52, h: 38 } as const;
/** The picture inside the frame, in sprite pixels. */
export const FRAME_PICTURE = { x: 8, y: 4, w: 36, h: 30 } as const;

/** The room's cat, big, against a patch of wall, as the picture in the frame. */
function pictureRows(): string[] {
  const cv = blank(FRAME_PICTURE.w, FRAME_PICTURE.h);
  rect(cv, 0, 0, FRAME_PICTURE.w, FRAME_PICTURE.h, 'c');
  rect(cv, 0, 0, FRAME_PICTURE.w, 2, 'b');
  rect(cv, 28, 3, 6, 8, 'd'); // a patch of light on the wall
  const cat = CAT_GRIDS['cat-sitting'];
  cat.forEach((row, y) => {
    for (let x = 0; x < row.length; x += 1) {
      if (row[x] === '.') continue;
      rect(cv, 2 + x * 2, 1 + y * 2, 2, 2, row[x]); // scaled up two to one
    }
  });
  return rows(cv);
}

const FRAMED = (() => {
  const cv = blank(FRAME.w, FRAME.h);
  boxed(cv, 0, 0, FRAME.w, FRAME.h, 'e', 'g');
  rect(cv, 1, 1, FRAME.w - 2, 1, 'i');
  rect(cv, 1, 2, 1, FRAME.h - 3, 'h');
  rect(cv, FRAME.w - 2, 2, 1, FRAME.h - 3, 'f');
  rect(cv, 2, FRAME.h - 3, FRAME.w - 4, 1, 'f');
  boxed(cv, 3, 3, FRAME.w - 6, FRAME.h - 6, 'f', 'p'); // the mat
  rect(cv, 4, 4, FRAME.w - 8, 1, 'C');
  boxed(cv, FRAME_PICTURE.x - 1, FRAME_PICTURE.y - 1, FRAME_PICTURE.w + 2, FRAME_PICTURE.h + 2, 'a', 'a');
  pictureRows().forEach((row, y) => {
    for (let x = 0; x < row.length; x += 1) plot(cv, FRAME_PICTURE.x + x, FRAME_PICTURE.y + y, row[x]);
  });
  // A tiny brass plate, the way real galleries do.
  rect(cv, 23, 35, 6, 1, 'r');
  rect(cv, 23, 36, 6, 1, 'e');
  return rows(cv);
})();

function luminance(hex: string): number {
  const n = Number.parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

/** The picture as brightness, 0 to 1, for the ASCII conversion. */
export function framePictureLuminance(): { w: number; h: number; pixels: number[] } {
  const palette = PALETTES['cozy-crt'];
  const picture = pictureRows();
  const pixels: number[] = [];
  for (const row of picture) {
    // Stretched, so the cat's dark outline reaches blank and its belly reaches the heaviest marks.
    for (const ch of row) {
      pixels.push(Math.min(1, Math.max(0, (luminance(palette[ch] ?? palette.a) - 0.1) / 0.85)));
    }
  }
  return { w: FRAME_PICTURE.w, h: FRAME_PICTURE.h, pixels };
}

// --- the glass case of dust ---------------------------------------------------

export const TANK = { w: 48, h: 32 } as const;
/** The inside of the glass, where the specks live. */
export const TANK_INSIDE = { x: 4, y: 3, w: 40, h: 18 } as const;

const DUST_CASE = (() => {
  const cv = blank(TANK.w, TANK.h);
  // A wooden plinth with a brass plate.
  boxed(cv, 0, 22, 48, 10, 'e', 'g');
  rect(cv, 1, 23, 46, 1, 'i');
  rect(cv, 1, 24, 46, 1, 'h');
  rect(cv, 2, 28, 44, 1, 'f');
  rect(cv, 19, 26, 10, 2, 'r');
  rect(cv, 19, 28, 10, 1, 'e');
  // The glass case: steel corners, dark inside.
  rect(cv, 0, 0, 48, 23, 'a');
  rect(cv, 1, 1, 46, 21, 'B');
  rect(cv, 3, 2, 42, 19, 'a');
  rect(cv, 4, 3, 40, 18, 'b');
  rect(cv, 1, 1, 46, 1, 'A');
  rect(cv, 1, 1, 1, 21, 'A');
  rect(cv, 5, 3, 1, 5, 'B'); // a glint on the glass
  rect(cv, 6, 3, 6, 1, 'B');
  for (const x of [0, 46]) rect(cv, x, 0, 2, 3, 'A');
  return rows(cv);
})();

// --- the vector screen ----------------------------------------------------------

export const VECTOR = { w: 32, h: 40 } as const;
/** The glass, for the wireframe. */
export const VECTOR_SCREEN = { x: 4, y: 4, w: 24, h: 20 } as const;

const VECTOR_DISPLAY = (() => {
  const cv = blank(VECTOR.w, VECTOR.h);
  // A grey steel case, nothing like the cream terminals.
  boxed(cv, 0, 0, 32, 30, 'a', 'A');
  rect(cv, 1, 1, 30, 1, 'C');
  rect(cv, 30, 2, 1, 27, 'B');
  rect(cv, 1, 28, 30, 1, 'B');
  rect(cv, 2, 2, 28, 24, 'B');
  rect(cv, 3, 3, 26, 22, 'a');
  rect(cv, 4, 4, 24, 20, 'b');
  rect(cv, 4, 4, 24, 20, 'a');
  // The control strip: a lamp and three knobs.
  rect(cv, 4, 26, 3, 2, 'k');
  for (const x of [17, 21, 25]) {
    rect(cv, x, 26, 3, 3, 'a');
    rect(cv, x + 1, 26, 1, 2, 'r');
  }
  // One thick pedestal and a round foot.
  rect(cv, 12, 30, 8, 6, 'e');
  rect(cv, 13, 30, 2, 6, 'h');
  rect(cv, 15, 30, 4, 6, 'g');
  boxed(cv, 6, 36, 20, 4, 'e', 'f');
  rect(cv, 7, 37, 18, 1, 'g');
  return rows(cv);
})();

// --- the poster ----------------------------------------------------------------

export const POSTER = { w: 28, h: 40 } as const;
/** The eyes, in poster pixels: left and right, top-left corner and size. */
export const POSTER_EYES = [
  { x: 5, y: 13, w: 5, h: 4 },
  { x: 18, y: 13, w: 5, h: 4 },
] as const;

const MONSTER_POSTER_ART = (() => {
  const cv = blank(POSTER.w, POSTER.h);
  // Paper, taped up a little crooked: the right edge steps in halfway.
  rect(cv, 0, 0, 28, 40, 'a');
  rect(cv, 1, 1, 26, 38, 'p');
  rect(cv, 1, 1, 26, 1, 'C');
  rect(cv, 26, 14, 1, 25, 'q');
  rect(cv, 1, 38, 26, 1, 'q');
  // The art: a dark panel.
  rect(cv, 3, 3, 22, 29, 'a');
  rect(cv, 3, 3, 22, 3, 'b');

  // A heavy horned head, built a row at a time so it stays symmetrical.
  const half = (y: number, from: number, to: number, c: string): void => {
    rect(cv, from, y, to - from + 1, 1, c);
    rect(cv, 27 - to, y, to - from + 1, 1, c);
  };
  // Horns.
  for (let i = 0; i < 6; i += 1) half(4 + i, 4 + i, 6 + i, i < 3 ? 'u' : 'm');
  // The head.
  for (let y = 9; y <= 28; y += 1) {
    const width = y < 12 ? 7 + (y - 9) * 2 : y < 24 ? 11 : 11 - (y - 24) * 2;
    half(y, 14 - Math.max(3, Math.min(11, width)), 13, y % 5 === 0 ? 'm' : 'u');
  }
  // Brow ridges: big, dark and a touch too serious.
  for (const [x0, y0, x1, y1] of [
    [4, 11, 11, 13],
    [16, 13, 23, 11],
  ]) {
    const steps = 8;
    for (let i = 0; i < steps; i += 1) {
      const x = x0 + Math.round(((x1 - x0) * i) / (steps - 1));
      const y = y0 + Math.round(((y1 - y0) * i) / (steps - 1));
      rect(cv, x, y, 1, 2, 'a');
    }
  }
  // Eyes: dim red here, bright red drawn over them by the scene.
  for (const eye of POSTER_EYES) {
    rect(cv, eye.x, eye.y, eye.w, eye.h, 'k');
    rect(cv, eye.x + 1, eye.y, eye.w - 2, 1, 'l');
    rect(cv, eye.x + 2, eye.y + 1, 1, 3, 'a');
  }
  // The tape and medallion running down the middle, as in the original.
  rect(cv, 13, 3, 2, 14, 'i');
  rect(cv, 13, 3, 1, 14, 'h');
  rect(cv, 11, 7, 6, 5, 'g');
  rect(cv, 12, 6, 4, 7, 'g');
  rect(cv, 12, 8, 4, 3, 'h');
  plot(cv, 13, 9, 'f');
  // A nose-ridge and nostril, the mouth, and jagged teeth.
  rect(cv, 13, 17, 2, 6, 'm');
  rect(cv, 9, 23, 10, 5, 'a');
  for (const x of [10, 12, 14, 16]) {
    rect(cv, x, 23, 1, 2, 'C');
    rect(cv, x + 1, 27, 1, 1, 'C');
  }
  // Drips off the chin, because a good monster is a damp one.
  for (const [x, len] of [[8, 3], [13, 4], [19, 2]]) rect(cv, x, 29, 1, len, 'u');

  // The caption strip, and a corner of tape on each side.
  rect(cv, 4, 34, 14, 1, 'q');
  rect(cv, 4, 36, 9, 1, 'q');
  rect(cv, 20, 34, 4, 3, 'k');
  rect(cv, 20, 34, 4, 1, 'l');
  // Tape: a diagonal strip at the top left and one at the top right.
  for (let i = 0; i < 4; i += 1) rect(cv, i, i, 4, 1, 'C');
  for (let i = 0; i < 4; i += 1) rect(cv, 27 - i - 3, i, 4, 1, 'q');
  // A curled lower corner.
  rect(cv, 24, 36, 3, 3, 'q');
  rect(cv, 25, 37, 2, 2, 'p');
  plot(cv, 26, 38, 'a');
  return rows(cv);
})();


// --- the door that stands on its own ------------------------------------------

export const DOOR = { w: 24, h: 40 } as const;
/** The opening, where the glow is drawn over the frame. */
export const DOOR_OPENING = { x: 4, y: 5, w: 16, h: 33 } as const;

/** A doorframe standing on the floor with nothing attached: the way into the Archive. */
const FREE_DOOR = (() => {
  const cv = blank(DOOR.w, DOOR.h);
  rect(cv, 0, 0, 24, 40, 'e');
  rect(cv, 1, 1, 22, 38, 'g');
  rect(cv, 1, 1, 22, 2, 'i');
  rect(cv, 1, 3, 22, 1, 'h');
  rect(cv, 1, 1, 2, 38, 'h');
  rect(cv, 21, 1, 2, 38, 'f');
  // The opening, left ink: the glow arrives by itself.
  rect(cv, DOOR_OPENING.x - 1, DOOR_OPENING.y - 1, DOOR_OPENING.w + 2, DOOR_OPENING.h + 1, 'e');
  rect(cv, DOOR_OPENING.x, DOOR_OPENING.y, DOOR_OPENING.w, DOOR_OPENING.h, 'a');
  // A brass plate on the lintel, and a hinge or two.
  rect(cv, 9, 1, 6, 2, 'r');
  rect(cv, 9, 3, 6, 1, 'e');
  for (const y of [10, 28]) {
    rect(cv, 1, y, 2, 3, 'r');
    rect(cv, 1, y + 3, 2, 1, 'e');
  }
  // Two stubby feet, so it can stand without a wall.
  rect(cv, 0, 37, 7, 3, 'e');
  rect(cv, 17, 37, 7, 3, 'e');
  rect(cv, 1, 37, 5, 1, 'g');
  rect(cv, 18, 37, 5, 1, 'g');
  return rows(cv);
})();

/** What can be seen through it: warm shelves of files, drawn bright because they light themselves. */
const FREE_DOOR_GLOW = (() => {
  const cv = blank(DOOR_OPENING.w, DOOR_OPENING.h);
  rect(cv, 0, 0, DOOR_OPENING.w, DOOR_OPENING.h, 'g');
  for (let x = 0; x < DOOR_OPENING.w; x += 1) {
    const centre = Math.abs(x - 7.5);
    if (centre < 4) rect(cv, x, 0, 1, DOOR_OPENING.h, 'h');
    else if (centre > 6) rect(cv, x, 0, 1, DOOR_OPENING.h, 'f');
  }
  for (const top of [2, 10, 18]) {
    let x = 1;
    let n = 0;
    while (x < DOOR_OPENING.w - 2) {
      const r = hash(top, n);
      n += 1;
      const w = 2 + (r % 2);
      const h = 4 + ((r >>> 4) % 3);
      const [face, light] = BOX_TONES[(r >>> 8) % BOX_TONES.length];
      rect(cv, x, top + 6 - h, w, h, face);
      rect(cv, x, top + 6 - h, w, 1, light);
      x += w + 1;
    }
    rect(cv, 0, top + 6, DOOR_OPENING.w, 1, 'e');
    rect(cv, 0, top + 7, DOOR_OPENING.w, 1, 'f');
  }
  // Light pooling on the floor inside.
  for (let y = 26; y < DOOR_OPENING.h; y += 1) {
    for (let x = 0; x < DOOR_OPENING.w; x += 1) {
      cv[y][x] = (x + y) % 2 === 0 ? 's' : y > 29 ? 'r' : 'i';
    }
  }
  return rows(cv);
})();

export const ARCHIVE_SPRITE_GRIDS: Record<string, string[]> = {
  archShelf0: shelf(1),
  archShelf1: shelf(2),
  archShelf2: shelf(3),
  archBoxStack: BOX_STACK,
  archTerminal: TERMINAL,
  archJar: COOKIE_JAR,
  archFrame: FRAMED,
  archDustCase: DUST_CASE,
  archVector: VECTOR_DISPLAY,
  archPoster: MONSTER_POSTER_ART,
  archDoor: FREE_DOOR,
  archDoorGlow: FREE_DOOR_GLOW,
};
