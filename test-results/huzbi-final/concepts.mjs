// Three genuinely different Huzbi concepts, drawn from his traits (not from the old sprites).
// Run: node --experimental-strip-types test-results/huzbi-final/concepts.mjs
import { sheet } from '../../scripts/pixelSheet.mjs';
import { PALETTES } from '../../src/game/art/palette.ts';

const W = 30, H = 36;
const blank = () => Array.from({ length: H }, () => Array(W).fill('.'));
const px = (cv, x, y, c) => { if (cv[y] && x >= 0 && x < W) cv[y][x] = c; };
const rect = (cv, x, y, w, h, c) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) px(cv, i, j, c); };
const ell = (cv, cx, cy, rx, ry, edge, fill) => {
  for (let y = -ry - 1; y <= ry + 1; y++) for (let x = -rx - 1; x <= rx + 1; x++) {
    const d = (x * x) / (rx * rx + 0.3) + (y * y) / (ry * ry + 0.3);
    if (d <= 1.0) px(cv, Math.round(cx + x), Math.round(cy + y), fill);
    else if (d <= 1.0 + 1.9 / Math.max(rx, ry)) px(cv, Math.round(cx + x), Math.round(cy + y), edge);
  }
};
const ring = (cv, cx, cy, r, c) => {
  for (let a = 0; a < 40; a++) px(cv, Math.round(cx + Math.cos(a / 40 * 6.283) * r), Math.round(cy + Math.sin(a / 40 * 6.283) * r), c);
};
const out = (cv) => cv.map((r) => r.join(''));
const hair = (cv, cx, cy, rx, ry) => {
  ell(cv, cx, cy, rx, ry, 'a', 'b');
  for (const [dx, dy] of [[-3, -3], [0, -4], [3, -3], [-5, -1], [5, -1], [1, -2]]) px(cv, cx + dx, cy + dy, 'c');
};
const face = (cv, cx, cy, rx, ry) => {
  ell(cv, cx, cy, rx, ry, 'a', 'v');
  rect(cv, cx - rx + 2, cy + ry - 2, rx * 2 - 3, 1, 'w');
};

// A  "Cardigan owl": round, soft, home-body. Amber round glasses, terracotta
// cardigan over a cream tee, headphones hung round the neck, tea mug, slippers.
const A = blank();
hair(A, 15, 7, 10, 7);
face(A, 15, 11, 8, 6);
ell(A, 15, 5, 8, 3, 'a', 'b'); // fringe
for (const [x, y] of [[8, 3], [10, 1], [14, 0], [18, 1], [21, 3], [22, 6], [8, 7]]) px(A, x, y, 'a');
for (const cx of [11, 19]) { ring(A, cx, 12, 3, 'r'); px(A, cx - 1, 11, 'C'); px(A, cx, 12, 'a'); px(A, cx + 1, 12, 'a'); }
rect(A, 14, 12, 2, 1, 'r');
rect(A, 14, 15, 3, 1, 'a'); px(A, 15, 14, 'w');
ell(A, 15, 25, 12, 9, 'j', 'k');
rect(A, 12, 18, 7, 14, 'p'); rect(A, 12, 18, 1, 14, 'j'); rect(A, 18, 18, 1, 14, 'j');
for (let y = 20; y < 31; y += 3) px(A, 15, y, 'q');
for (const cx of [6, 24]) { ell(A, cx, 21, 2, 3, 'a', 'B'); ell(A, cx, 21, 1, 2, 'B', 'A'); }
for (let x = 7; x < 24; x++) px(A, x, 17 + Math.round(Math.pow((x - 15) / 8, 2) * 3), 'B');
rect(A, 4, 28, 4, 5, 'k'); rect(A, 4, 32, 4, 2, 'v');
ell(A, 24, 28, 3, 3, 'a', 'C'); px(A, 27, 28, 'a'); px(A, 23, 24, 'C'); px(A, 25, 23, 'C');
rect(A, 9, 33, 5, 3, 'l'); rect(A, 17, 33, 5, 3, 'l');

// B  "Blanket heron": tall and narrow, hair twisted into a bun, tall rectangular
// glasses, wrapped in a checked throw with a book held up at the nose.
const B = blank();
ell(B, 15, 3, 3, 3, 'a', 'b'); ell(B, 15, 9, 7, 6, 'a', 'b');
ell(B, 15, 12, 6, 6, 'a', 'v');
for (const x of [11, 17]) { rect(B, x, 11, 4, 3, 'r'); rect(B, x + 1, 12, 2, 1, 'C'); }
rect(B, 15, 11, 1, 1, 'r'); rect(B, 14, 16, 3, 1, 'a');
rect(B, 8, 18, 14, 17, 'j'); rect(B, 9, 19, 12, 15, 'k');
for (let y = 20; y < 34; y += 4) rect(B, 9, y, 12, 1, 'l');
for (let x = 11; x < 21; x += 4) rect(B, x, 19, 1, 15, 'l');
rect(B, 11, 21, 8, 6, 'a'); rect(B, 12, 22, 6, 4, 'p'); rect(B, 14, 22, 2, 4, 'q');
rect(B, 10, 26, 2, 2, 'v'); rect(B, 18, 26, 2, 2, 'v');
rect(B, 11, 35, 3, 1, 'o'); rect(B, 17, 35, 3, 1, 'o');

// C  "Kotatsu loaf": sunk into a heap of blanket, only the head, a mug and a
// pair of mismatched socks poking out; headphones perched on the heap.
const C = blank();
hair(C, 15, 13, 9, 6); face(C, 15, 17, 7, 5);
for (const cx of [12, 18]) { ring(C, cx, 17, 2, 'r'); px(C, cx - 1, 16, 'C'); }
rect(C, 14, 17, 2, 1, 'r'); rect(C, 14, 20, 3, 1, 'a');
ell(C, 15, 29, 14, 7, 'j', 'k');
for (let x = 4; x < 27; x += 4) rect(C, x, 24, 1, 10, 'l');
rect(C, 3, 28, 24, 1, 'l');
ell(C, 15, 22, 7, 2, 'B', 'A'); ell(C, 7, 24, 3, 3, 'a', 'B'); ell(C, 23, 24, 3, 3, 'a', 'B');
ell(C, 22, 31, 3, 3, 'a', 'C'); px(C, 23, 28, 'C');
rect(C, 3, 33, 4, 3, 'o'); rect(C, 8, 33, 4, 3, 'l');

sheet('test-results/huzbi-final/concepts.png', [out(A), out(B), out(C)], PALETTES['cozy-crt'], { scale: 14, perRow: 3 });
console.log('ok');
