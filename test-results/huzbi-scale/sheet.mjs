// Contact sheet of Huzbi frames. Run: node --experimental-strip-types test-results/huzbi-scale/sheet.mjs <scale> <perRow> [frameName ...]
import { sheet } from '../../scripts/pixelSheet.mjs';
import { PALETTES } from '../../src/game/art/palette.ts';
import { SLEEPER_GRIDS } from '../../src/game/art/sprites/sleeper.ts';
const picked = process.argv.slice(4);
const names = picked.length ? picked : Object.keys(SLEEPER_GRIDS);
sheet('test-results/huzbi-scale/sleeper-sheet.png', names.map((n) => SLEEPER_GRIDS[n]), PALETTES['cozy-crt'], { scale: Number(process.argv[2] ?? 6), perRow: Number(process.argv[3] ?? 4) });
