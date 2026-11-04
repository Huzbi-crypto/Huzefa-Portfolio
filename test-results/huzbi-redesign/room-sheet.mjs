import { sheet } from '../../scripts/pixelSheet.mjs';
import { PALETTES } from '../../src/game/art/palette.ts';
import { VISITOR_GRIDS } from '../../src/game/art/sprites/visitor.ts';
const bad = Object.entries(VISITOR_GRIDS).filter(([, g]) => g.length !== 24 || g.some((r) => r.length !== 16));
if (bad.length) console.log('BAD', bad.map(([k, g]) => k + ':' + g.map((r) => r.length).join(',')));
const names = [];
for (const d of ['down', 'up', 'right', 'left']) for (const f of ['0', '1', '2', 'idle']) names.push(`visitor-${d}-${f}`);
const theme = process.argv[2] ?? 'cozy-crt';
sheet(`test-results/huzbi-redesign/room-sheet-${theme}.png`, names.map((n) => VISITOR_GRIDS[n]), PALETTES[theme], { scale: 16, perRow: 8, pad: 1 });
