// Concept sketches for the Huzbi redesign. Run: node test-results/huzbi-redesign/concepts.mjs
import { sheet } from '../../scripts/pixelSheet.mjs';
import { PALETTES } from '../../src/game/art/palette.ts';
const mir = (halves) => halves.map((h) => h + [...h].reverse().join(''));
const set = (g, x, y, c) => { const r = [...g[y]]; r[x] = c; g[y] = r.join(''); };

// A "Lanky slouch": tall, narrow, tuft that never lies flat, oversized violet
// cups, drawstrings, a cat pin, a manga under one arm.
const A = mir([
  '........','.....aab','...aabbb','..abbbbb','..aAAAAA',
  '.aEEabbv','.aEEavvv','.aEEavav','.aEEavwv','.aaaavvv','....aaww',
  '...axzzx','..axaxxx','..axaxxx','..axaxxx','..axaxxy','..avaxyy','...aaaaa',
  '....aBBa','....aBBa','....aBBa','....aBBa','...aCCCa','...aaaaa',
]);
set(A,8,0,'a');set(A,9,0,'a');
set(A,7,1,'a');set(A,8,1,'b');set(A,9,1,'b');set(A,10,1,'a');set(A,12,1,'a');
set(A,10,6,'b'); set(A,10,5,'b');
set(A,6,12,'C');set(A,6,13,'C');set(A,9,12,'C');set(A,9,13,'C');set(A,9,14,'C');set(A,10,14,'r');
set(A,8,9,'v');
for (let y=13;y<=17;y+=1){ set(A,13,y,'a'); set(A,14,y,y%2?'p':'q'); set(A,15,y,'a'); }
set(A,14,12,'a'); set(A,14,18,'a');

// B "Hood-up bean": the hood is the silhouette, cups sit over the hood, short and round.
const B = mir([
  '........','........','.....aaa','...aaxxx','..axxzzz','..axxxxx',
  '.aEEaxxx','.aEEavvv','.aEEavav','.aaaavvv','..axxawa',
  '.axxxxxx','.axzxxxC','.axxxxxC','.avaxxxx','..aayyyy','...axxxx',
  '...aBBBa','...aBBBa','...aCCCa','...aaaaa','........','........','........',
]);
set(B,9,12,'r');

// C "Oversized noodle": hoodie as a tent, hands in the pocket, long side-swept
// fringe over one eye, no manga.
const C = mir([
  '.....abb','....abbb','...abbbc','...abbbb','...aEavb',
  '..aEEavv','..aEEavv','..aEEavw','...aaaaw','....axxx','...axxxx',
  '..axxxCx','..axxxCx','..axxxxx','..axyvvv','..axyyyy','..aaxxxx',
  '....aBBa','....aBBa','....aBBa','....aCCa','...aaaaa','........','........',
]);
set(C,9,5,'b');set(C,9,6,'b');set(C,10,6,'b');set(C,9,7,'a');set(C,6,7,'a');set(C,6,7,'a');
set(C,12,12,'r');

sheet('test-results/huzbi-redesign/concepts-draft.png', [A, B, C], PALETTES['cozy-crt'], { scale: 14, perRow: 3 });
