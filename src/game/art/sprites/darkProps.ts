import { DOOR_GRIDS } from './door';

/**
 * Things that live in the dark: the way back, the monitor with the eye, notes,
 * a routing board and a passage. Built from small helpers so the grids are
 * exact, then handed to the same decoder as every other sprite.
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

/** Bresenham line; `every` of 2 leaves a dotted line. */
function line(
  cv: Canvas,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  c: string,
  every = 1,
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  let x = x0;
  let y = y0;
  let n = 0;
  for (;;) {
    points.push({ x, y });
    if (n % every === 0) plot(cv, x, y, c);
    n += 1;
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
  return points;
}

const rows = (cv: Canvas): string[] => cv.map((r) => r.join(''));

// The monitor: the room's cream CRT, bigger, on a crate, screen left black for the eye.
const MONITOR_BODY: string[] = [
  `.${'a'.repeat(22)}.`,
  `.a${'p'.repeat(19)}qa.`,
  `.ap${'B'.repeat(18)}qa.`,
  ...Array.from({ length: 12 }, () => `.apB${'a'.repeat(16)}Bqa.`),
  `.ap${'B'.repeat(18)}qa.`,
  `.a${'q'.repeat(8)}u${'q'.repeat(2)}r${'q'.repeat(8)}a.`,
  `.${'a'.repeat(22)}.`,
  `.....${'A'.repeat(14)}.....`,
  `....a${'q'.repeat(14)}a....`,
  `....a${'B'.repeat(14)}a....`,
];

const CRATE: string[] = [
  `..${'e'.repeat(28)}..`,
  `..e${'h'.repeat(26)}e..`,
  `..e${'g'.repeat(26)}e..`,
  `..${'e'.repeat(28)}..`,
  ...Array.from({ length: 6 }, () => `..e${`${'g'.repeat(5)}f`.repeat(4)}gge..`),
  `..${'e'.repeat(28)}..`,
];

/** Where the eye sits on the monitor sprite, and how big it is. */
export const MONITOR_SCREEN = { x: 8, y: 3, w: 16, h: 12 } as const;

const MONITOR: string[] = [
  ...MONITOR_BODY.map((r) => `....${r}....`),
  ...CRATE,
];

/** The big friendly eye on the screen. `pupil` is the left column of the pupil, or null for a blink. */
function eye(pupil: number | null): string[] {
  const cv = blank(16, 12);
  rect(cv, 0, 0, 16, 12, 'a');
  if (pupil === null) {
    rect(cv, 1, 6, 14, 1, 't');
    plot(cv, 0, 6, 'u');
    plot(cv, 15, 6, 'u');
    // Lashes, so a blink is still a face and not a gap.
    for (const x of [3, 6, 9, 12]) plot(cv, x, 7, 'u');
    return rows(cv);
  }
  const top = [
    { y: 2, from: 5, to: 10, c: 't' },
    { y: 3, from: 3, to: 12, c: 'C', edge: 2 },
    { y: 4, from: 2, to: 13, c: 'C', edge: 1 },
    { y: 5, from: 1, to: 14, c: 'C', edge: 1 },
    { y: 6, from: 1, to: 14, c: 'C', edge: 1 },
    { y: 7, from: 2, to: 13, c: 'C', edge: 1 },
    { y: 8, from: 3, to: 12, c: 'C', edge: 2 },
    { y: 9, from: 5, to: 10, c: 't' },
  ];
  for (const r of top) {
    rect(cv, r.from, r.y, r.to - r.from + 1, 1, r.c);
    if (r.edge) {
      rect(cv, r.from, r.y, r.edge, 1, 't');
      rect(cv, r.to - r.edge + 1, r.y, r.edge, 1, 't');
    }
  }
  rect(cv, pupil, 4, 4, 4, 'a');
  rect(cv, pupil, 4, 4, 1, 'u');
  plot(cv, pupil + 1, 4, 't'); // the glint
  return rows(cv);
}

const NOTE_BASE = (lines: number[]): string[] => {
  const cv = blank(10, 12);
  rect(cv, 0, 0, 10, 12, 'p');
  rect(cv, 0, 0, 10, 1, 'a');
  rect(cv, 0, 11, 10, 1, 'a');
  rect(cv, 0, 0, 1, 12, 'a');
  rect(cv, 9, 0, 1, 12, 'a');
  rect(cv, 2, 0, 6, 1, 'C'); // tape
  rect(cv, 1, 10, 8, 1, 'q');
  for (const y of lines) rect(cv, 2, y, y % 4 === 0 ? 6 : 5, 1, 'q');
  return rows(cv);
};

const NOTE_ONE = NOTE_BASE([2, 4, 6, 8]);
const NOTE_TWO = (() => {
  const g = NOTE_BASE([2, 4, 6]);
  // A torn corner and a scribble that trails off.
  const cv: Canvas = g.map((r) => r.split(''));
  rect(cv, 7, 8, 3, 4, '.');
  plot(cv, 7, 7, 'a');
  plot(cv, 8, 8, 'a');
  plot(cv, 9, 9, 'a');
  rect(cv, 2, 8, 3, 1, 'q');
  return rows(cv);
})();

/** The routing board: five routers, a link that is down, and the route round it. */
const ROUTER_NODES = {
  a: { x: 7, y: 8 },
  b: { x: 16, y: 6 },
  c: { x: 25, y: 9 },
  d: { x: 9, y: 18 },
  e: { x: 22, y: 19 },
} as const;

const routerBuild = (() => {
  const cv = blank(32, 36);
  rect(cv, 0, 0, 32, 28, 'e');
  rect(cv, 1, 1, 30, 26, 'g');
  rect(cv, 1, 1, 30, 1, 'h');
  rect(cv, 1, 1, 1, 26, 'h');
  rect(cv, 3, 3, 26, 22, 'a');
  for (let y = 4; y < 24; y += 4) {
    for (let x = 4; x < 28; x += 4) plot(cv, x, y, 'b');
  }
  for (const x of [4, 24]) {
    rect(cv, x, 28, 4, 8, 'e');
    rect(cv, x + 1, 28, 2, 7, 'f');
  }

  const { a, b, c, d, e } = ROUTER_NODES;
  line(cv, a.x, a.y, b.x, b.y, 'B');
  line(cv, b.x, b.y, c.x, c.y, 'B');
  line(cv, b.x, b.y, d.x, d.y, 'B');
  line(cv, c.x, c.y, e.x, e.y, 'B');
  line(cv, b.x, b.y, e.x, e.y, 'k', 2); // the broken link
  const route = [
    ...line(cv, a.x, a.y, d.x, d.y, 't'),
    ...line(cv, d.x, d.y, e.x, e.y, 't'),
  ];

  for (const [key, n] of Object.entries(ROUTER_NODES)) {
    const onRoute = key === 'a' || key === 'd' || key === 'e';
    rect(cv, n.x - 1, n.y - 1, 3, 3, onRoute ? 't' : 'A');
    plot(cv, n.x, n.y, 'C');
  }
  // The cross over the dead link.
  const mid = { x: 19, y: 12 };
  for (const [dx, dy] of [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]]) {
    plot(cv, mid.x + dx, mid.y + dy, 'k');
  }

  return { grid: rows(cv), route };
})();

/** Every pixel a packet visits going round the broken link, in order, in sprite space. */
export const ROUTER_PACKET_PATH: readonly { x: number; y: number }[] = routerBuild.route;
export const ROUTER_FAILED_LINK = { x: 19, y: 12 } as const;

const ARCH = (() => {
  const w = 24;
  const h = 40;
  const cv = blank(w, h);
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const mortar = y % 4 === 0 || (x + (Math.floor(y / 4) % 2) * 3) % 6 === 0;
      cv[y][x] = mortar ? 'b' : y % 4 === 1 ? 'd' : 'c';
    }
  }
  // A round-topped opening that is simply ink: the lantern cannot help here.
  const cx = 11.5;
  const cy = 14;
  const r = 7.2;
  for (let y = 0; y < h; y += 1) {
    for (let x = 4; x < 20; x += 1) {
      const inside = y >= cy ? Math.abs(x + 0.5 - 12) < 7.5 : Math.hypot(x + 0.5 - cx - 0.5, y - cy) < r;
      if (inside) cv[y][x] = 'a';
    }
  }
  // Keystone.
  rect(cv, 10, 3, 4, 3, 'd');
  return rows(cv);
})();

const EXIT = (() => {
  const cv = blank(24, 40);
  rect(cv, 0, 0, 24, 40, 'a');
  rect(cv, 1, 1, 22, 38, 'd');
  rect(cv, 2, 2, 20, 38, 'b');
  rect(cv, 4, 3, 16, 35, 'a');
  rect(cv, 1, 38, 22, 2, 'd');
  rect(cv, 0, 39, 24, 1, 'a');
  return rows(cv);
})();

/** The warm room beyond the door, drawn bright because it makes its own light. */
const EXIT_GLOW = (() => {
  const w = 16;
  const h = 35;
  const cv = blank(w, h);
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const d = Math.abs(x - 7.5);
      const check = (x + y) % 2 === 0;
      let c: string;
      if (d < 2) c = 's';
      else if (d < 4) c = check ? 's' : 'r';
      else if (d < 6) c = 'r';
      else if (d < 7) c = check ? 'r' : 'i';
      else c = 'i';
      if (y % 7 === 6) c = d < 4 ? 'r' : 'h'; // the joints between boards
      cv[y][x] = c;
    }
  }
  return rows(cv);
})();

const AJAR = DOOR_GRIDS.doorClosed.map(
  (row, i) => row.slice(0, 12) + DOOR_GRIDS.doorOpen[i].slice(12),
);

export const DARK_PROP_GRIDS: Record<string, string[]> = {
  darkExit: EXIT,
  darkExitGlow: EXIT_GLOW,
  darkDoorAjar: AJAR,
  darkMonitor: MONITOR,
  darkEyeCenter: eye(6),
  darkEyeLeft: eye(3),
  darkEyeRight: eye(9),
  darkEyeBlink: eye(null),
  darkNote0: NOTE_ONE,
  darkNote1: NOTE_TWO,
  darkRouter: routerBuild.grid,
  darkArch: ARCH,
};
