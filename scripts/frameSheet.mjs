// Dev tool: zoomed contact sheets of the Huzbi sleeper frames and the player.
// Run: node --experimental-strip-types scripts/frameSheet.mjs <huzbi|player> <scale> <perRow> <out.png> [frameName ...]
import { sheet } from './pixelSheet.mjs';
import { PALETTES } from '../src/game/art/palette.ts';
import { SLEEPER_GRIDS } from '../src/game/art/sprites/sleeper.ts';
import { VISITOR_GRIDS } from '../src/game/art/sprites/visitor.ts';
const [kind, scale, perRow, out, ...picked] = process.argv.slice(2);
const grids = kind === 'player' ? VISITOR_GRIDS : SLEEPER_GRIDS;
const names = picked.length ? picked : Object.keys(grids);
sheet(out, names.map((n) => grids[n]), PALETTES['cozy-crt'], { scale: Number(scale), perRow: Number(perRow) });
console.log(names.join(' '));
