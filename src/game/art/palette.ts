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

/**
 * Warm Apartment: golden-hour terracotta, honeyed timber and tea steam.
 * Same 31 roles as Cozy CRT, so every sprite and page reads the same, but the
 * room now sits in late afternoon instead of midnight.
 *
 * Ramps, dark to light:
 *   wall a b c d   wood e f g h i   rug j k l   sofa m n o   paper p q
 *   lamp r s       terminal u t     skin w v    hoodie y x z
 *   warm grey A B  white C          sky D       rose E
 */
const WARM_APARTMENT: Record<string, string> = {
  a: '#1c1110', // ink: outlines, deepest shadow
  b: '#2e1d18', // wall shadow
  c: '#46291f', // wall: terracotta
  d: '#61382a', // wall light
  e: '#2a150d', // wood outline
  f: '#4f2a17', // wood dark
  g: '#774020', // wood
  h: '#a05b2e', // wood light
  i: '#c9854a', // wood highlight
  j: '#6b2a22', // rug dark
  k: '#a3402f', // rug
  l: '#cf6a4a', // rug light
  m: '#3e4a24', // olive sofa dark
  n: '#5f7036', // olive sofa
  o: '#879a54', // olive sofa light
  p: '#f6e6c3', // cream paper
  q: '#cfb488', // cream shadow
  r: '#ffad42', // lamp amber
  s: '#ffd98a', // lamp highlight
  t: '#b6e06a', // terminal glow (warm lime)
  u: '#527a24', // terminal dark
  v: '#e8b184', // skin
  w: '#bb7c53', // skin shadow
  x: '#b95a37', // hoodie: terracotta
  y: '#8a3b23', // hoodie shadow
  z: '#e08a5f', // hoodie light
  A: '#b3a48f', // warm greige light
  B: '#776955', // warm greige dark
  C: '#fff5e0', // warm white
  D: '#2a1b36', // plum night sky
  E: '#b56a76', // dusty rose (spines)
};

/**
 * Moonlit Terminal: cold blue phosphor, mint glow and violet starlight.
 * The same 31 roles again, so the whole world can swap palettes at once.
 *
 * Ramps, dark to light:
 *   wall a b c d   wood e f g h i   rug j k l   sofa m n o   paper p q
 *   lamp r s       terminal u t     skin w v    hoodie y x z
 *   blue grey A B  white C          sky D       violet E
 */
const MOONLIT_TERMINAL: Record<string, string> = {
  a: '#080c16', // ink: outlines, deepest shadow
  b: '#0f1626', // wall shadow
  c: '#182238', // wall: midnight blue
  d: '#23304d', // wall light
  e: '#131a2a', // wood outline
  f: '#24304a', // wood dark
  g: '#38496a', // wood
  h: '#53688d', // wood light
  i: '#7a90b5', // wood highlight
  j: '#2c1f45', // rug dark
  k: '#45306b', // rug
  l: '#64508c', // rug light
  m: '#173845', // sofa dark
  n: '#245a6d', // sofa
  o: '#3f8499', // sofa light
  p: '#dfeaf6', // paper
  q: '#a6b8cd', // paper shadow
  r: '#79d2ff', // cool lamp
  s: '#c2f1ff', // lamp highlight
  t: '#8af0c8', // terminal glow (mint phosphor)
  u: '#2b8168', // terminal dark
  v: '#e3b699', // skin
  w: '#ad7f68', // skin shadow
  x: '#3d5aa3', // hoodie
  y: '#273a72', // hoodie shadow
  z: '#7591d1', // hoodie light
  A: '#9aa7c0', // blue grey light
  B: '#5f6d88', // blue grey dark
  C: '#f3f8ff', // cool white
  D: '#060b1f', // night sky
  E: '#9c7cf0', // violet (spines)
};

export const PALETTES: Record<Theme, Record<string, string>> = {
  'cozy-crt': COZY_CRT,
  'warm-apartment': WARM_APARTMENT,
  'moonlit-terminal': MOONLIT_TERMINAL,
};
