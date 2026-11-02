import { projects } from '@/data/projects';
import { PALETTES, SPRITES } from '@/game/art';
import { chalkPixels } from '@/game/art/sprites/darkGlyphs';
import {
  MONITOR_SCREEN,
  ROUTER_FAILED_LINK,
  ROUTER_PACKET_PATH,
} from '@/game/art/sprites/darkProps';
import { copy } from '@/game/content/copy';
import { projectStarId } from '@/game/content/stars';
import { tryExhibit } from '@/game/exhibits/exhibit';
import type { Exhibit } from '@/game/exhibits/types';
import type { Light } from '@/game/render/lighting';
import { drawSprite } from '@/game/render/sprite';
import type { GameStore } from '@/game/state/store';
import { TILE } from '@/game/world/grid';
import {
  createDarkSpace,
  createSpaceLights,
  LANTERN_RADIUS,
  type SpaceDef,
  type SpaceProp,
} from './space';
import type { GameApi, Scene, SceneCtx } from './types';

export { LANTERN_RADIUS };

const WORLD_W = 320;
const WORLD_H = 192;
const WALL_BOTTOM = 48; // rows 0..5 are wall, floor starts at y = 48

const INK = PALETTES['cozy-crt'].a;
const CHALK = PALETTES['cozy-crt'].q;
const SOLID_COLORS = PALETTES['cozy-crt'];

/** Where everything stands, in world pixels. */
const AT = {
  exit: { x: 24, y: 8 },
  noteOne: { x: 104, y: 22 },
  monitor: { x: 136, y: 24 },
  noteTwo: { x: 196, y: 22 },
  arch: { x: 272, y: 8 },
  router: { x: 224, y: 92 },
  cat: { x: 40, y: 136 },
  chalkOne: { x: 56, y: 24 },
  chalkTwo: { x: 216, y: 24 },
  hatch: { x: 112, y: 140 },
  archiveDoor: { x: 268, y: 128 },
} as const;

const ROUTER_FEET_ROW = 14;

function sprite(name: string) {
  const found = SPRITES[name];
  if (!found) throw new Error(`Missing sprite: ${name}`);
  return found;
}

// --- lights ----------------------------------------------------------------

const monitorLight: Light = { x: 0, y: 0, radius: 34, tint: 'cool' };
const doorLight: Light = { x: 0, y: 0, radius: 30, tint: 'warm' };
const packetLight: Light = { x: 0, y: 0, radius: 13, tint: 'cool' };
const hatchLight: Light = { x: AT.hatch.x + 16, y: AT.hatch.y + 11, radius: 22, tint: 'warm' };
const archiveLight: Light = { x: AT.archiveDoor.x + 12, y: AT.archiveDoor.y + 24, radius: 26, tint: 'warm' };
const LIGHTS: Light[] = [monitorLight, doorLight, packetLight, hatchLight, archiveLight];

monitorLight.x = AT.monitor.x + MONITOR_SCREEN.x + MONITOR_SCREEN.w / 2;
monitorLight.y = AT.monitor.y + MONITOR_SCREEN.y + MONITOR_SCREEN.h / 2;
doorLight.x = AT.exit.x + 12;
doorLight.y = AT.exit.y + 30;

const PACKET_PAUSE_STEPS = 10;
const PACKET_STEP_MS = 70;

/** The packet's spot on the routing board in world pixels, held still when motion is off. */
function packetAt(t: number, reducedMotion: boolean): { x: number; y: number } {
  const path = ROUTER_PACKET_PATH;
  const step = reducedMotion
    ? Math.floor(path.length / 2)
    : Math.floor(t / PACKET_STEP_MS) % (path.length + PACKET_PAUSE_STEPS);
  const at = path[Math.min(step, path.length - 1)];
  return { x: AT.router.x + at.x, y: AT.router.y + at.y };
}

{
  const packet = packetAt(0, false);
  packetLight.x = packet.x;
  packetLight.y = packet.y;
}

const spaceLights = createSpaceLights(LIGHTS);

/** Every light in the dark: the lantern first, then the things that glow. */
export function darkLights(ctx: SceneCtx): Light[] {
  return spaceLights(ctx);
}

// --- props and exhibits ----------------------------------------------------

function routingProject() {
  const found = projects.find((p) => p.id === 'routing-sim');
  if (!found) throw new Error('The routing simulation project is missing from the data');
  return found;
}

async function sayOnce(
  api: GameApi,
  counter: string,
  first: readonly string[],
  again: readonly string[],
): Promise<void> {
  const seen = api.store.count(counter);
  api.store.increment(counter);
  await api.store.say([...(seen === 0 ? first : again)]);
}

/**
 * The routing board keeps its phase-one dialogue, then opens the shared
 * project panel. The star is still awarded only once.
 */
async function inspectBoard(api: GameApi): Promise<void> {
  const project = routingProject();
  const first = api.store.award(projectStarId(project.id));
  const lines: string[] = first
    ? [copy.dark.routing.flavour, `${project.title}.`, `${project.tagline}.`]
    : [copy.dark.routing.again, `${project.title}.`];
  if (project.githubUrl) {
    lines.push(`${copy.dark.routing.sourceLead} ${project.githubUrl.replace(/^https?:\/\//, '')}`);
  }
  await api.store.say(lines);
  await tryExhibit(api, project.id);
}

function buildProps(): SpaceProp[] {
  return [
    {
      id: 'exit-glow',
      footY: AT.exit.y + 40,
      glow: (g) => drawSprite(g, sprite('darkExitGlow'), AT.exit.x + 4, AT.exit.y + 3),
    },
    {
      id: 'hatch-art',
      // Flat on the floor: everything standing on it is drawn over it.
      footY: AT.hatch.y,
      draw: (g) => drawSprite(g, sprite('workshopHatch'), AT.hatch.x, AT.hatch.y),
    },
    {
      id: 'archive-door-art',
      footY: AT.archiveDoor.y + 40,
      draw: (g) => drawSprite(g, sprite('archDoor'), AT.archiveDoor.x, AT.archiveDoor.y),
      glow: (g) => drawSprite(g, sprite('archDoorGlow'), AT.archiveDoor.x + 4, AT.archiveDoor.y + 5),
    },
    {
      id: 'note-one',
      footY: WALL_BOTTOM,
      interact: {
        rect: { x: AT.noteOne.x - 4, y: 20, w: 18, h: 30 },
        stand: { x: 13, y: 6 },
        label: copy.dark.noteOne.label,
        use: (api) => sayOnce(api, 'dark-note-one', copy.dark.noteOne.lines, copy.dark.noteOne.again),
      },
    },
    {
      id: 'eye',
      footY: AT.monitor.y + 32,
      draw: (g) => drawSprite(g, sprite('darkMonitor'), AT.monitor.x, AT.monitor.y),
      glow: (g, ctx) => {
        const lantern = darkLights(ctx)[0];
        const eyeAt =
          lantern.x - (AT.monitor.x + MONITOR_SCREEN.x + MONITOR_SCREEN.w / 2);
        const eyeName =
          !ctx.reducedMotion && ctx.t % 3400 < 150
            ? 'darkEyeBlink'
            : eyeAt < -22
              ? 'darkEyeLeft'
              : eyeAt > 22
                ? 'darkEyeRight'
                : 'darkEyeCenter';
        drawSprite(
          g,
          sprite(eyeName),
          AT.monitor.x + MONITOR_SCREEN.x,
          AT.monitor.y + MONITOR_SCREEN.y,
        );
      },
      interact: {
        rect: { x: AT.monitor.x, y: AT.monitor.y, w: 32, h: 40 },
        stand: { x: 19, y: 7 },
        label: copy.dark.monitor.label,
        use: (api) => sayOnce(api, 'dark-eye', copy.dark.monitor.lines, copy.dark.monitor.again),
      },
    },
    {
      id: 'note-two',
      footY: WALL_BOTTOM,
      interact: {
        rect: { x: AT.noteTwo.x - 6, y: 20, w: 22, h: 30 },
        stand: { x: 24, y: 6 },
        label: copy.dark.noteTwo.label,
        use: (api) => sayOnce(api, 'dark-note-two', copy.dark.noteTwo.lines, copy.dark.noteTwo.again),
      },
    },
    {
      id: 'arch',
      footY: WALL_BOTTOM,
      interact: {
        rect: { x: AT.arch.x, y: AT.arch.y, w: 24, h: 40 },
        stand: { x: 35, y: 6 },
        label: copy.dark.arch.label,
        use: async (api) => {
          await api.store.say([...copy.dark.arch.lines]);
        },
      },
    },
    {
      id: 'cat',
      footY: AT.cat.y + 14,
      draw: (g) => drawSprite(g, sprite('cat-sitting'), AT.cat.x, AT.cat.y),
      glow: (g, ctx) => {
        // Two amber eyes in the corner.
        if (ctx.reducedMotion || ctx.t % 4100 > 200) {
          g.fillStyle = SOLID_COLORS.s;
          g.fillRect(AT.cat.x + 2, AT.cat.y + 4, 1, 1);
          g.fillRect(AT.cat.x + 8, AT.cat.y + 4, 1, 1);
        }
      },
      interact: {
        rect: { x: AT.cat.x, y: AT.cat.y, w: 16, h: 14 },
        stand: { x: 4, y: 17 },
        label: copy.dark.cat.label,
        use: (api) => sayOnce(api, 'dark-cat', copy.dark.cat.lines, copy.dark.cat.again),
      },
    },
  ];
}

function buildExhibits(): Exhibit[] {
  return [
    {
      id: 'routing-sim',
      projectId: 'routing-sim',
      rect: { x: AT.router.x, y: AT.router.y, w: 32, h: 36 },
      stand: { x: 29, y: 16 },
      footY: AT.router.y + 36,
      label: copy.dark.routing.label,
      update(_ms, ctx) {
        const packet = packetAt(ctx.t, ctx.reducedMotion);
        packetLight.x = packet.x;
        packetLight.y = packet.y;
      },
      draw(g) {
        drawSprite(g, sprite('darkRouter'), AT.router.x, AT.router.y);
      },
      glow(g, ctx) {
        // The packet, and the link that is down.
        const packet = packetAt(ctx.t, ctx.reducedMotion);
        g.fillStyle = SOLID_COLORS.C;
        g.fillRect(packet.x, packet.y, 2, 2);
        if (ctx.reducedMotion || Math.floor(ctx.t / 600) % 2 === 0) {
          g.fillStyle = SOLID_COLORS.k;
          const fx = AT.router.x + ROUTER_FAILED_LINK.x;
          const fy = AT.router.y + ROUTER_FAILED_LINK.y;
          for (const [dx, dy] of [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]]) {
            g.fillRect(fx + dx, fy + dy, 1, 1);
          }
        }
      },
      use: inspectBoard,
    },
  ];
}

// --- drawing ---------------------------------------------------------------

function drawChalk(g: CanvasRenderingContext2D, text: string, x: number, y: number): void {
  g.fillStyle = CHALK;
  for (const p of chalkPixels(text).points) {
    // Chalk skips a pixel here and there.
    if (((p.x + x) * 7 + (p.y + y) * 13) % 5 === 0) continue;
    g.fillRect(x + p.x, y + p.y, 1, 1);
  }
}

function drawShell(g: CanvasRenderingContext2D): void {
  for (let y = 0; y < WORLD_H; y += 16) {
    for (let x = 0; x < WORLD_W; x += 16) {
      let name: string;
      if (y < 32) name = 'darkWall';
      else if (y === 32) name = 'darkWallBase';
      else name = ((x / 16) * 5 + (y / 16) * 3) % 7 === 0 ? 'darkFloorAlt' : 'darkFloor';
      drawSprite(g, sprite(name), x, y);
    }
  }
  g.fillStyle = INK;
  g.fillRect(0, WALL_BOTTOM, TILE, WORLD_H - WALL_BOTTOM);
  g.fillRect(WORLD_W - TILE, WALL_BOTTOM, TILE, WORLD_H - WALL_BOTTOM);
  g.fillRect(0, WORLD_H - TILE, WORLD_W, TILE);
}

function drawBackdrop(g: CanvasRenderingContext2D): void {
  drawShell(g);

  drawSprite(g, sprite('darkExit'), AT.exit.x, AT.exit.y);
  drawSprite(g, sprite('darkExitSpill'), AT.exit.x, WALL_BOTTOM);
  drawSprite(g, sprite('darkArch'), AT.arch.x, AT.arch.y);
  drawChalk(g, copy.dark.chalk[0], AT.chalkOne.x, AT.chalkOne.y);
  drawChalk(g, copy.dark.chalk[1], AT.chalkTwo.x, AT.chalkTwo.y);
  drawSprite(g, sprite('darkNote0'), AT.noteOne.x, AT.noteOne.y);
  drawSprite(g, sprite('darkNote1'), AT.noteTwo.x, AT.noteTwo.y);
  for (const x of [176, 188, 200]) drawChalk(g, '>', x, 108);
}

function buildSpaceDef(): SpaceDef {
  return {
    id: 'dark',
    worldW: WORLD_W,
    worldH: WORLD_H,
    solids: [
      { x: 0, y: 0, w: WORLD_W, h: WALL_BOTTOM },
      { x: 17 * TILE, y: 6 * TILE, w: 4 * TILE, h: TILE },
      { x: 28 * TILE, y: ROUTER_FEET_ROW * TILE, w: 4 * TILE, h: 2 * TILE },
      { x: AT.archiveDoor.x, y: AT.archiveDoor.y + 24, w: 24, h: 16 },
    ],
    spawn: { x: 4, y: 7 },
    entries: { fromRoom: { x: 4, y: 7 }, fromWorkshop: { x: 16, y: 21 }, fromArchive: { x: 35, y: 21 } },
    exits: [
      {
        id: 'exit',
        rect: { x: AT.exit.x, y: AT.exit.y, w: 24, h: 40 },
        stand: { x: 4, y: 6 },
        label: copy.dark.exit.label,
        to: 'room',
        entry: '',
        lines: copy.dark.exit.lines,
        goLabel: copy.dark.exit.backLabel,
        stayLabel: copy.dark.exit.stayLabel,
        stayReply: copy.dark.exit.stayReply,
      },
      {
        id: 'workshop-hatch',
        rect: { x: AT.hatch.x, y: AT.hatch.y, w: 32, h: 22 },
        stand: { x: 16, y: 20 },
        label: copy.workshop.hatch.label,
        to: 'workshop',
        entry: 'fromHall',
        lines: copy.workshop.hatch.lines,
        goLabel: copy.workshop.hatch.goLabel,
        stayLabel: copy.workshop.hatch.stayLabel,
        stayReply: copy.workshop.hatch.stayReply,
      },
      {
        id: 'archive-door',
        rect: { x: AT.archiveDoor.x, y: AT.archiveDoor.y, w: 24, h: 40 },
        stand: { x: 35, y: 21 },
        label: copy.archive.door.label,
        to: 'archive',
        entry: 'fromHall',
        lines: copy.archive.door.lines,
        goLabel: copy.archive.door.goLabel,
        stayLabel: copy.archive.door.stayLabel,
        stayReply: copy.archive.door.stayReply,
      },
    ],
    props: buildProps(),
    exhibits: buildExhibits(),
    lights: LIGHTS,
    drawBackdrop,
  };
}

const SPACE = buildSpaceDef();

export function createDarkScene(_store: GameStore): Scene {
  return createDarkSpace(SPACE, _store);
}
