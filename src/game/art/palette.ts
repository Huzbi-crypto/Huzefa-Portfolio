import type { Theme } from '@/types/portfolio';

/**
 * One limited palette (31 colors, cap is 32). Every sprite grid uses these
 * single-character keys. `.` is reserved for transparent.
 *
 * Ramps, dark to light:
 *   night wall   a b c d      wood   e f g h i      rug   j k l
 *   teal sofa    m n o        paper  p q            lamp  r s
 *   terminal     u t          skin   w v            hoodie y x z
 *   lavender-grey (cat, metal) B A    white C        sky D    violet E
 */
const COZY_CRT: Record<string, string> = {
  a: '#1b1428', // ink: outlines, deepest shadow
  b: '#2a2040', // wall shadow
  c: '#3d3160', // wall
  d: '#54487f', // wall light
  e: '#2a1810', // wood outline
  f: '#4a2c1e', // wood dark
  g: '#6b4228', // wood
  h: '#8f5e38', // wood light
  i: '#b88450', // wood highlight
  j: '#7a2a35', // rug dark
  k: '#b04448', // rug
  l: '#d9715a', // rug light
  m: '#1d4a58', // teal dark
  n: '#2f7585', // teal
  o: '#52a3a8', // teal light
  p: '#e8d9b0', // cream paper
  q: '#bba682', // cream shadow
  r: '#f0a93c', // lamp amber
  s: '#ffd97a', // lamp highlight
  t: '#7fdc8a', // terminal glow
  u: '#2d7a4a', // terminal dark
  v: '#e0a77c', // skin
  w: '#b57654', // skin shadow
  x: '#3f5fa8', // hoodie
  y: '#2a3f78', // hoodie shadow
  z: '#7a97d6', // hoodie light
  A: '#8d8aa0', // lavender grey light
  B: '#5d5a73', // lavender grey dark
  C: '#f4f1ea', // warm white
  D: '#141a3a', // night sky
  E: '#8e5fb5', // violet (spines)
};

// Phase 2 will redraw the other themes. Until then they alias cozy-crt.
export const PALETTES: Record<Theme, Record<string, string>> = {
  'cozy-crt': COZY_CRT,
  'warm-apartment': { ...COZY_CRT },
  'moonlit-terminal': { ...COZY_CRT },
};
