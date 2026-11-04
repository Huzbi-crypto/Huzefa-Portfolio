import { ACTIVE_PALETTE, SPRITES } from '@/game/art';
import { TANK, TANK_INSIDE } from '@/game/art/sprites/archive';
import { copy } from '@/game/content/copy';
import type { Light } from '@/game/render/lighting';
import { drawSprite } from '@/game/render/sprite';
import { TILE } from '@/game/world/grid';
import { createField, stepField, type Field } from './logic/particles';
import { tryExhibit } from './exhibit';
import { createLantern, projectFor, type ArchiveExhibit, type At } from './archiveKit';

const COLORS = ACTIVE_PALETTE;
const PROJECT_ID = 'creative-coding';
const SPECKS = 90;
/** The lantern only calls the dust when it is this close to the case, in world pixels. */
export const CALL_REACH = 64;
/** How wide the pull circles the lantern, in world pixels. */
const SWIRL = 7;
/** Each speck's colour, round and round, so the swarm sparkles instead of smudging. */
const SPECK_COLORS = [COLORS.t, COLORS.s, COLORS.o, COLORS.z, COLORS.l, COLORS.C] as const;
/** A little head start, so the case is already full of scattered dust when first seen. */
const WARM_UP_STEPS = 20;

export type DustExhibit = ArchiveExhibit & {
  /** The live specks, so a test can watch them follow the light. */
  field(): Field;
};

/**
 * A glass case of drifting specks. The lantern is the attractor, so they
 * gather and swirl around it whoever holds it; with the light far away they
 * simply drift. With motion off they hang still, in a nicely scattered pose.
 */
export function createCreativeCoding(at: At): DustExhibit {
  const project = projectFor(PROJECT_ID);
  const lantern = createLantern();
  const field = createField(SPECKS, TANK_INSIDE.w, TANK_INSIDE.h, 7);
  for (let i = 0; i < WARM_UP_STEPS; i += 1) stepField(field, 50, null);

  const originX = at.x + TANK_INSIDE.x;
  const originY = at.y + TANK_INSIDE.y;
  const centre = { x: originX + TANK_INSIDE.w / 2, y: originY + TANK_INSIDE.h / 2 };
  const attractor = { x: 0, y: 0 };

  const light: Light = { x: centre.x, y: centre.y, radius: 24, tint: 'cool' };

  return {
    id: PROJECT_ID,
    projectId: PROJECT_ID,
    rect: { x: at.x, y: at.y, w: TANK.w, h: TANK.h },
    hitRects: [{ x: at.x, y: at.y, w: TANK.w, h: TANK.h }],
    stand: { x: Math.floor((at.x + TANK.w / 2) / TILE), y: Math.floor((at.y + TANK.h) / TILE) },
    footY: at.y + TANK.h,
    label: copy.archive.particles.label,
    light,
    field: () => field,

    update(ms, ctx) {
      if (ctx.reducedMotion) return;
      const held = lantern(ctx);
      const near = Math.hypot(held.x - centre.x, held.y - centre.y) <= CALL_REACH;
      // The pull circles the light a little, so the swarm swirls instead of balling up.
      const angle = (ctx.t / 1100) * Math.PI * 2;
      attractor.x = held.x - originX + Math.cos(angle) * SWIRL;
      attractor.y = held.y - originY + Math.sin(angle) * SWIRL;
      stepField(field, ms, near ? attractor : null);
    },

    draw(g) {
      drawSprite(g, SPRITES.archDustCase, at.x, at.y);
    },

    glow(g) {
      for (let i = 0; i < field.n; i += 1) {
        g.fillStyle = SPECK_COLORS[i % SPECK_COLORS.length];
        // Every third speck is a little brighter, drawn two pixels wide.
        g.fillRect(
          originX + Math.floor(field.x[i]),
          originY + Math.floor(field.y[i]),
          i % 3 === 0 ? 2 : 1,
          1,
        );
      }
    },

    async use(api) {
      await api.store.say([...copy.archive.particles.lines]);
      await tryExhibit(api, project.id);
    },
  };
}
