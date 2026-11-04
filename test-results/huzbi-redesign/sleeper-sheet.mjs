import { sheet } from '../../scripts/pixelSheet.mjs';
import { PALETTES } from '../../src/game/art/palette.ts';
import { SLEEPER_GRIDS } from '../../src/game/art/sprites/sleeper.ts';
const bad = Object.entries(SLEEPER_GRIDS).filter(([, g]) => g.length !== 46 || g.some((r) => r.length !== 64));
if (bad.length) console.log('BAD', bad.map(([k]) => k));
const theme = process.argv[2] ?? 'cozy-crt';
const per = Number(process.argv[3] ?? 3);
sheet(`test-results/huzbi-redesign/sleeper-sheet-${theme}.png`, Object.values(SLEEPER_GRIDS), PALETTES[theme], { scale: 6, perRow: per, pad: 2, bg: '#3d3160' });
console.log(Object.keys(SLEEPER_GRIDS).join(' '));
