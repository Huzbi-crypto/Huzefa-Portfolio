import { ACTIVE_PALETTE, SPRITES } from '@/game/art';
import { chalkPixels } from '@/game/art/sprites/darkGlyphs';
import { FLOW_PADS } from '@/game/art/sprites/workshop';
import { copy } from '@/game/content/copy';
import type { Light } from '@/game/render/lighting';
import { drawSprite } from '@/game/render/sprite';
import type { GameApi } from '@/game/scene/types';
import type { Tile } from '@/game/world/grid';
import { tryExhibit } from './exhibit';
import { createFlow, giveNote, HOP_MS, stepFlow, type Flow } from './logic/agents';
import { createPlayback } from './playback';
import type { Exhibit } from './types';

type Point = { x: number; y: number };

/**
 * Where the paper note is, in world pixels, given where each robot holds it.
 * It rests on the robot it was last handed to and arcs over to the next.
 */
export function noteAt(flow: Flow, anchors: readonly Point[]): Point | null {
  const note = flow.note;
  if (!note) return null;
  const from = anchors[Math.min(note.at, anchors.length - 1)];
  if (note.done || note.at >= anchors.length - 1) return { x: from.x, y: from.y };
  const to = anchors[note.at + 1];
  const frac = Math.min(1, Math.max(0, note.waitMs / HOP_MS));
  return {
    x: Math.round(from.x + (to.x - from.x) * frac),
    y: Math.round(from.y + (to.y - from.y) * frac - 5 * Math.sin(Math.PI * frac)),
  };
}

const RING: readonly Point[] = [
  { x: 0, y: -4 },
  { x: 3, y: -3 },
  { x: 4, y: 0 },
  { x: 3, y: 3 },
  { x: 0, y: 4 },
  { x: -3, y: 3 },
  { x: -4, y: 0 },
  { x: -3, y: -3 },
];

/** The dot chasing round the loop robot's thought ring. Wraps in both directions. */
export function loopArrowDot(step: number): Point {
  const n = RING.length;
  return RING[((Math.floor(step) % n) + n) % n];
}

const C = ACTIVE_PALETTE;
const BOARD = { w: 152, h: 62 } as const;
const ROBOT = { w: 14, h: 20 } as const;
/** The robots' eyes, one colour each: curious, busy, dizzy, writing. */
const EYES = [C.r, C.t, C.k, C.z] as const;
const FEET_ON_PAD = 8;
const COUNTER = 'workshop-lang-notes';

function sprite(name: string) {
  const found = SPRITES[name];
  if (!found) throw new Error(`Missing sprite: ${name}`);
  return found;
}

function chalk(g: CanvasRenderingContext2D, text: string, x: number, y: number): void {
  g.fillStyle = C.B;
  for (const p of chalkPixels(text).points) g.fillRect(x + p.x, y + p.y, 1, 1);
}

export function createLangProjects(at: Point, stand: Tile): { exhibit: Exhibit; light: Light } {
  const play = createPlayback();
  let reduced = false;
  let flow: Flow = createFlow();

  const light: Light = { x: at.x + BOARD.w / 2, y: at.y + 12, radius: 40, tint: 'cool' };

  const robotAt = (i: number): Point => ({
    x: at.x + FLOW_PADS[i].x - ROBOT.w / 2,
    y: at.y + FLOW_PADS[i].y + FEET_ON_PAD - ROBOT.h,
  });
  /** Where each robot holds the note: above its head, so it is easy to follow. */
  const handAt = (i: number): Point => {
    const r = robotAt(i);
    return { x: r.x + ROBOT.w / 2, y: r.y - 3 };
  };
  const anchors = FLOW_PADS.map((_, i) => handAt(i));

  const holder = (): number => (flow.note ? flow.note.at : -1);

  const exhibit: Exhibit = {
    id: 'lang-projects',
    projectId: 'lang-projects',
    rect: { x: at.x, y: at.y - 12, w: BOARD.w, h: BOARD.h + 12 },
    // Only the drafting board itself is clickable; the table air above it is not.
    hitRects: [{ x: at.x, y: at.y, w: BOARD.w, h: BOARD.h }],
    stand,
    footY: at.y + BOARD.h,
    label: copy.workshop.lang.label,

    update(ms, ctx) {
      reduced = ctx.reducedMotion;
      play.update(ms);
      // A calm visitor's robots stay put; a note is still carried to the end on request.
      if (!reduced) flow = stepFlow(flow, ms);
    },

    draw(g, ctx) {
      drawSprite(g, sprite('workshopFlowBoard'), at.x, at.y);
      flow.robots.forEach((_, i) => {
        const r = robotAt(i);
        const carrying = holder() === i && !flow.note?.done && !ctx.reducedMotion;
        drawSprite(g, sprite('workshopRobot'), r.x, r.y + (carrying ? -1 : 0));
      });
      // Chalked under each robot: part of the lit board, so only the lantern shows it.
      copy.workshop.lang.labels.forEach((label, i) => {
        const r = robotAt(i);
        const w = chalkPixels(label).w;
        chalk(g, label, r.x + Math.floor((ROBOT.w - w) / 2), r.y + ROBOT.h + 4);
      });

    },

    glow(g, ctx) {
      const t = ctx.reducedMotion ? 0 : ctx.t;
      const tick = Math.floor(t / 250);
      flow.robots.forEach((_, i) => {
        const r = robotAt(i);
        const looper = i === flow.loopIndex;
        const lift = holder() === i && !flow.note?.done && !ctx.reducedMotion ? -1 : 0;
        // Eyes. The looper's wander left and right as it thinks round in circles.
        const wander = looper && !ctx.reducedMotion ? [0, 1, 2, 1][tick % 4] - 1 : 0;
        g.fillStyle = EYES[i];
        g.fillRect(r.x + 4 + wander, r.y + 7 + lift, 2, 2);
        g.fillRect(r.x + 8 + wander, r.y + 7 + lift, 2, 2);
        // The antenna lamp blinks in turn.
        const lit = ctx.reducedMotion || tick % flow.robots.length === i;
        g.fillStyle = lit ? EYES[i] : C.B;
        g.fillRect(r.x + 6, r.y + lift, 2, 1);
      });

      // The loop robot's thought: a ring with a dot that never stops chasing its tail.
      const looper = robotAt(flow.loopIndex);
      const cx = looper.x + ROBOT.w / 2;
      const cy = looper.y - 8;
      g.fillStyle = C.B;
      for (const p of RING) g.fillRect(cx + p.x, cy + p.y, 1, 1);
      const dot = loopArrowDot(ctx.reducedMotion ? 0 : flow.loops);
      g.fillStyle = C.C;
      g.fillRect(cx + dot.x, cy + dot.y, 1, 1);
      g.fillStyle = C.k;
      g.fillRect(cx - 1, cy - 1, 2, 2);

      // The note, hopping from hand to hand.
      const note = noteAt(flow, anchors);
      if (note) {
        g.fillStyle = C.a;
        g.fillRect(note.x - 4, note.y - 5, 8, 7);
        g.fillStyle = C.p;
        g.fillRect(note.x - 3, note.y - 4, 6, 5);
        g.fillStyle = C.q;
        g.fillRect(note.x - 2, note.y - 3, 4, 1);
        g.fillRect(note.x - 2, note.y - 1, 3, 1);
      }
    },

    async use(api: GameApi) {
      const given = api.store.count(COUNTER);
      api.store.increment(COUNTER);
      flow = giveNote(flow, copy.workshop.lang.notes[given % copy.workshop.lang.notes.length]);
      const hops = flow.robots.length - 1;
      const finished = await play.start(HOP_MS * hops + 800, reduced);
      if (!finished) return;
      if (reduced) flow = stepFlow(flow, HOP_MS * hops + 1);

      const text = copy.workshop.lang;
      await api.store.say([
        given === 0 ? text.passed : text.again,
        `${text.loopBefore} ${Math.max(1, flow.loops)} ${text.loopAfter}`,
      ]);
      await tryExhibit(api, 'lang-projects');
    },

    cancel() {
      play.cancel();
    },
  };

  return { exhibit, light };
}
