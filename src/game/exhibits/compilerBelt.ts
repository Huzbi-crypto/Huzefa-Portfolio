import { ACTIVE_PALETTE, SPRITES } from '@/game/art';
import { BELT_STATIONS, BELT_SURFACE_Y, STATION_LAMP } from '@/game/art/sprites/workshop';
import { copy } from '@/game/content/copy';
import { projectStarId } from '@/game/content/stars';
import type { Light } from '@/game/render/lighting';
import { drawSprite } from '@/game/render/sprite';
import type { GameApi } from '@/game/scene/types';
import type { Tile } from '@/game/world/grid';
import { tryExhibit } from './exhibit';
import { compileLine, jamAt, STAGES, type Stage } from './logic/compilerBelt';
import { createPlayback } from './playback';
import type { Exhibit } from './types';

type Point = { x: number; y: number };

const TRAVEL_MS = 380;
const PAUSE_MS = 380;

export type BeltPlan = {
  /** Station where the belt stops (a fussy error or a rare jam), or null for a clean run. */
  stopAt: number | null;
  message: string | null;
  /** When the item reaches each station. */
  arrivals: number[];
  endAt: number;
  durationMs: number;
};

/** Work out the whole trip in advance: when each station is reached, and where it ends. */
export function planBelt(
  stages: readonly Stage[],
  jam: { station: number; message: string } | null,
): BeltPlan {
  const arrivals = STAGES.map((_, i) => TRAVEL_MS + i * (TRAVEL_MS + PAUSE_MS));
  const endAt = arrivals[arrivals.length - 1] + PAUSE_MS + TRAVEL_MS;

  const fussy = stages.findIndex((s) => s.error);
  let stopAt: number | null = null;
  let message: string | null = null;
  if (fussy >= 0) {
    stopAt = fussy;
    message = stages[fussy].error ?? null;
  } else if (jam) {
    stopAt = Math.max(0, Math.min(STAGES.length - 1, jam.station));
    message = jam.message;
  }

  return {
    stopAt,
    message,
    arrivals,
    endAt,
    durationMs: stopAt === null ? endAt + 400 : arrivals[stopAt] + 900,
  };
}

/** The item's x along the belt in whole pixels, held still where the belt stopped. */
export function beltItemX(
  plan: BeltPlan,
  elapsedMs: number,
  stationsX: readonly number[],
  startX: number,
  endX: number,
): number {
  const t = Math.max(0, Number.isFinite(elapsedMs) ? elapsedMs : 0);
  let fromX = startX;
  let fromT = 0;
  const lastStation = plan.stopAt ?? stationsX.length - 1;
  for (let i = 0; i <= lastStation; i += 1) {
    const arrive = plan.arrivals[i];
    if (t < arrive) return Math.round(fromX + ((stationsX[i] - fromX) * (t - fromT)) / (arrive - fromT));
    const leave = arrive + PAUSE_MS;
    if (plan.stopAt === i) return stationsX[i];
    if (t < leave) return stationsX[i];
    fromX = stationsX[i];
    fromT = leave;
  }
  if (t >= plan.endAt) return endX;
  return Math.round(fromX + ((endX - fromX) * (t - fromT)) / (plan.endAt - fromT));
}

/** How many stations have changed the item by now (0 raw ... 4 assembly). */
export function beltLook(plan: BeltPlan, elapsedMs: number): number {
  let arrived = 0;
  for (const at of plan.arrivals) if (elapsedMs >= at) arrived += 1;
  return plan.stopAt === null ? arrived : Math.min(arrived, plan.stopAt);
}

const C = ACTIVE_PALETTE;
const BELT = { w: 148, h: 22 } as const;
const STATION = { w: 26, h: 40 } as const;
const ICONS = ['workshopIconTokens', 'workshopIconTree', 'workshopIconCode', 'workshopIconAsm'] as const;
const START_X = 8;
const COUNTER = 'workshop-belt-runs';

function sprite(name: string) {
  const found = SPRITES[name];
  if (!found) throw new Error(`Missing sprite: ${name}`);
  return found;
}

function drawItem(g: CanvasRenderingContext2D, x: number, y: number, look: number, jammed: boolean, t: number): void {
  const px = (dx: number, dy: number, w: number, h: number, c: string): void => {
    g.fillStyle = c;
    g.fillRect(x + dx, y + dy, w, h);
  };
  if (jammed) {
    // Crumpled, red and fizzing.
    px(-5, -3, 10, 7, C.a);
    px(-4, -2, 8, 5, C.k);
    px(-2, -1, 4, 1, C.j);
    if (Math.floor(t / 120) % 2 === 0) px(-6, -5, 1, 1, C.s);
    else px(5, -5, 1, 1, C.s);
    return;
  }
  switch (look) {
    case 0:
      px(-5, -3, 10, 7, C.a);
      px(-4, -2, 8, 5, C.p);
      px(-3, -1, 6, 1, C.q);
      px(-3, 1, 4, 1, C.q);
      break;
    case 1:
      px(-6, -2, 3, 5, C.o);
      px(-1, -2, 3, 5, C.r);
      px(4, -2, 3, 5, C.z);
      break;
    case 2:
      px(-1, -4, 3, 3, C.t);
      px(-4, -1, 3, 1, C.t);
      px(2, -1, 3, 1, C.t);
      px(-5, 0, 3, 3, C.t);
      px(3, 0, 3, 3, C.t);
      break;
    case 3:
      for (let i = 0; i < 4; i += 1) px(-4, -4 + i * 2, 8, 1, i % 2 === 0 ? C.x : C.z);
      break;
    default:
      px(-5, -3, 10, 7, C.a);
      px(-4, -2, 8, 5, C.r);
      px(-3, -1, 6, 1, C.s);
      px(-3, 1, 6, 1, C.s);
  }
}

/**
 * The compiler as a small conveyor factory. The visitor drops a line of code
 * onto the belt; it passes four stations, each changing what it looks like,
 * and sometimes a station gets fussy and the belt stops.
 */
export function createCompilerBelt(at: Point, stand: Tile): { exhibit: Exhibit; light: Light } {
  const play = createPlayback();
  let reduced = false;
  let plan: BeltPlan | null = null;
  /** After a run the item stays where it ended until the next one. */
  let resting: { plan: BeltPlan; t: number } | null = null;

  const stationsX = BELT_STATIONS.map((x) => x + STATION.w / 2);
  const endX = BELT.w - 12;
  const itemY = at.y + BELT_SURFACE_Y;
  const stationTop = at.y - 18;

  const light: Light = { x: at.x + START_X, y: itemY - 6, radius: 16, tint: 'warm' };

  /** The run being shown: live, resting after it, or none. */
  const shown = (): { plan: BeltPlan; t: number } | null =>
    plan && play.active ? { plan, t: play.elapsed } : resting;

  const exhibit: Exhibit = {
    id: 'compiler-project',
    projectId: 'compiler-project',
    rect: { x: at.x, y: stationTop, w: BELT.w, h: BELT.h + 18 + 4 },
    stand,
    footY: at.y + 20,
    label: copy.workshop.compiler.label,

    update(ms, ctx) {
      reduced = ctx.reducedMotion;
      play.update(ms);
      const run = shown();
      const x = run ? beltItemX(run.plan, run.t, stationsX, START_X, endX) : START_X;
      light.x = at.x + x;
      light.radius = run ? 22 : 16;
    },

    draw(g, ctx) {
      const moving = play.active && !ctx.reducedMotion && plan !== null && play.elapsed < plan.durationMs;
      const frame = moving && Math.floor(play.elapsed / 140) % 2 === 1 ? 'workshopBelt1' : 'workshopBelt0';
      drawSprite(g, sprite(frame), at.x, at.y);

      const run = shown();
      const x = run ? beltItemX(run.plan, run.t, stationsX, START_X, endX) : START_X;
      const look = run ? beltLook(run.plan, run.t) : 0;
      const jammed =
        run !== null &&
        run.plan.stopAt !== null &&
        run.t >= run.plan.arrivals[run.plan.stopAt];
      drawItem(g, at.x + x, itemY - 2, look, jammed, ctx.reducedMotion ? 0 : ctx.t);

      // The stations straddle the belt, so the item rides under their boxes.
      BELT_STATIONS.forEach((sx, i) => {
        drawSprite(g, sprite('workshopStation'), at.x + sx, stationTop);
        drawSprite(g, sprite(ICONS[i]), at.x + sx + 6, stationTop + 8);
      });
    },

    glow(g, ctx) {
      const run = shown();
      BELT_STATIONS.forEach((sx, i) => {
        const jam = run?.plan.stopAt === i && run.t >= run.plan.arrivals[i];
        const done = run !== null && run.t >= run.plan.arrivals[i];
        let lamp: string = C.B;
        if (jam) lamp = ctx.reducedMotion || Math.floor(ctx.t / 200) % 2 === 0 ? C.k : C.l;
        else if (done) lamp = C.t;
        else if (!ctx.reducedMotion && Math.floor(ctx.t / 700) % 4 === i) lamp = C.r;
        g.fillStyle = lamp;
        g.fillRect(at.x + sx + STATION_LAMP.x, stationTop + STATION_LAMP.y, STATION_LAMP.w, STATION_LAMP.h);
      });
    },

    async use(api: GameApi) {
      const text = copy.workshop.compiler;
      const runs = api.store.count(COUNTER);
      api.store.increment(COUNTER);
      const choice = await api.store.say(
        [text.prompt],
        text.lines.map((l) => ({ id: l.id, label: l.text })),
      );
      const line = text.lines.find((l) => l.id === choice) ?? text.lines[0];
      const stages = compileLine(line.text);

      // Now and then a station jams all by itself, on a clean line.
      let jam: { station: number; message: string } | null = null;
      for (let station = 0; station < STAGES.length && !jam; station += 1) {
        const message = jamAt(7, runs * STAGES.length + station);
        if (message) jam = { station, message };
      }

      const next = planBelt(stages, jam);
      plan = next;
      resting = null;
      api.store.award(projectStarId('compiler-project'));

      const finished = await play.start(next.durationMs, reduced);
      if (!finished) return;
      resting = { plan: next, t: next.durationMs };

      if (next.message) {
        await api.store.say([text.jam, next.message, text.jamAfter]);
      } else {
        await api.store.say([text.ok, `${text.out} ${stages[3].lines.join(' / ')}`]);
      }
      await tryExhibit(api, 'compiler-project');
    },
  };

  return { exhibit, light };
}
