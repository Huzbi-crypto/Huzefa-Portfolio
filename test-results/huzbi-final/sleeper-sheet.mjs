// Contact sheet of every Huzbi frame. Run: node --experimental-strip-types test-results/huzbi-final/sleeper-sheet.mjs
import { sheet } from '../../scripts/pixelSheet.mjs';
import { PALETTES } from '../../src/game/art/palette.ts';
import { SLEEPER_GRIDS } from '../../src/game/art/sprites/sleeper.ts';
const names = Object.keys(SLEEPER_GRIDS);
sheet('test-results/huzbi-final/sleeper-sheet.png', names.map((n) => SLEEPER_GRIDS[n]), PALETTES['cozy-crt'], { scale: 6, perRow: 6 });
console.log(names.join(' '));
