// Dev tool: render palette-keyed pixel grids to a zoomed PNG contact sheet.
// Usage (from code): import { sheet } from './pixelSheet.mjs'
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const sum = Buffer.alloc(4);
  sum.writeUInt32BE(crc(body));
  return Buffer.concat([len, body, sum]);
};
export function writePng(file, w, h, rgb) {
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y += 1) {
    raw[y * (w * 3 + 1)] = 0;
    rgb.copy(raw, y * (w * 3 + 1) + 1, y * w * 3, (y + 1) * w * 3);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  writeFileSync(
    file,
    Buffer.concat([
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      chunk('IHDR', ihdr),
      chunk('IDAT', deflateSync(raw)),
      chunk('IEND', Buffer.alloc(0)),
    ]),
  );
}
const hex = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));

/** items: string[][] grids, laid out left to right in rows of `perRow`. */
export function sheet(file, items, palette, { scale = 10, perRow = 6, bg = '#54487f', pad = 3 } = {}) {
  const cw = Math.max(...items.map((g) => g[0].length)) + pad * 2;
  const ch = Math.max(...items.map((g) => g.length)) + pad * 2;
  const cols = Math.min(perRow, items.length);
  const rowsN = Math.ceil(items.length / cols);
  const W = cols * cw * scale;
  const H = rowsN * ch * scale;
  const buf = Buffer.alloc(W * H * 3);
  const b = hex(bg);
  for (let i = 0; i < W * H; i += 1) buf.set(b, i * 3);
  items.forEach((g, n) => {
    const ox = (n % cols) * cw + pad;
    const oy = Math.floor(n / cols) * ch + pad;
    g.forEach((row, y) => {
      [...row].forEach((c, x) => {
        if (c === '.') return;
        if (!palette[c]) throw new Error(`bad key ${c}`);
        const rgb = hex(palette[c]);
        for (let dy = 0; dy < scale; dy += 1)
          for (let dx = 0; dx < scale; dx += 1)
            buf.set(rgb, (((oy + y) * scale + dy) * W + (ox + x) * scale + dx) * 3);
      });
    });
  });
  writePng(file, W, H, buf);
}
