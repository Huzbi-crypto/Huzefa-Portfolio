import { projects } from '@/data/projects';
import { ANIMS, PALETTES, SPRITES } from '@/game/art';
import { chalkPixels } from '@/game/art/sprites/darkGlyphs';
import {
  MONITOR_SCREEN,
  ROUTER_FAILED_LINK,
  ROUTER_PACKET_PATH,
} from '@/game/art/sprites/darkProps';
import { copy } from '@/game/content/copy';
import { projectStarId } from '@/game/content/stars';
import {
  applyLighting,
  lanternPosition,
  type Light,
} from '@/game/render/lighting';
import { drawSprite } from '@/game/render/sprite';
import type { GameStore } from '@/game/state/store';
import { drawPos } from '@/game/world/entity';
import { parseCollision, TILE } from '@/game/world/grid';
import type { GameApi, Hotspot, Scene, SceneCtx } from './types';

const WORLD_W = 320;
const WORLD_H = 192;
const COLS = WORLD_W / TILE;
const ROWS = WORLD_H / TILE;
const WALL_BOTTOM = 48; // rows 0..5 are wall, floor starts at y = 48

export const LANTERN_RADIUS = 46;
/** A gentle shimmer in whole pixels, one step at a time. */
const FLICKER = [0, 1, 0, -1, 0, 1, 1, 0, -1, 0] as const;
const FLICKER_MS = 160;

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
} as const;

const ROUTER_FEET_ROW = 14;

function sprite(name: string) {
  const found = SPRITES[name];
  if (!found) throw new Error(`Missing sprite: ${name}`);
  return found;
}

function buildCollision() {
  const grid: string[][] = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => '.'),
  );
  const solid = (x0: number, y0: number, x1: number, y1: number): void => {
    for (let y = y0; y <= y1; y += 1) {
      for (let x = x0; x <= x1; x += 1) grid[y][x] = '#';
    }
  };
  solid(0, 0, COLS - 1, WALL_BOTTOM / TILE - 1);
  solid(0, 0, 0, ROWS - 1);
  solid(COLS - 1, 0, COLS - 1, ROWS - 1);
  solid(0, ROWS - 1, COLS - 1, ROWS - 1);
  solid(17, 6, 20, 6); // the crate under the monitor
  solid(28, ROUTER_FEET_ROW, 31, ROUTER_FEET_ROW + 1); // the routing board's feet
  return parseCollision(grid.map((row) => row.join('')));
}

// --- the lantern -----------------------------------------------------------

const lantern: Light = { x: 0, y: 0, radius: LANTERN_RADIUS, tint: 'warm' };
const monitorLight: Light = { x: 0, y: 0, radius: 34, tint: 'cool' };
const doorLight: Light = { x: 0, y: 0, radius: 30, tint: 'warm' };
const packetLight: Light = { x: 0, y: 0, radius: 13, tint: 'cool' };
const LIGHTS: Light[] = [lantern, monitorLight, doorLight, packetLight];

const pointerWorld = { x: 0, y: 0 };
const dragWorld = { x: 0, y: 0 };
const bodyPoint = { x: 0, y: 0 };

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

/**
 * Every light in the dark, in world pixels: the lantern first, then the
 * things that glow on their own. The array and its lights are reused, so a
 * frame allocates nothing.
 */
export function darkLights(ctx: SceneCtx): Light[] {
  const { input, player, camera, scale, drag, t, reducedMotion } = ctx;

  const pointer = input.pointer;
  if (pointer) {
    pointerWorld.x = Math.floor(pointer.x / scale + camera.x);
    pointerWorld.y = Math.floor(pointer.y / scale + camera.y);
  }
  if (drag) {
    dragWorld.x = Math.floor(drag.x / scale + camera.x);
    dragWorld.y = Math.floor(drag.y / scale + camera.y);
  }
  // The flame sits around the chest, not the feet.
  bodyPoint.x = Math.floor(player.x);
  bodyPoint.y = Math.floor(player.y) - 10;

  const at = lanternPosition(
    input.mode,
    pointer ? pointerWorld : null,
    bodyPoint,
    drag ? dragWorld : null,
  );
  lantern.x = at.x;
  lantern.y = at.y;
  lantern.radius =
    LANTERN_RADIUS + (reducedMotion ? 0 : FLICKER[Math.floor(t / FLICKER_MS) % FLICKER.length]);

  const packet = packetAt(t, reducedMotion);
  packetLight.x = packet.x;
  packetLight.y = packet.y;
  return LIGHTS;
}

// --- hotspots --------------------------------------------------------------

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

async function leave(api: GameApi): Promise<void> {
  const { store } = api;
  const choice = await store.say([...copy.dark.exit.lines], [
    { id: 'back', label: copy.dark.exit.backLabel },
    { id: 'stay', label: copy.dark.exit.stayLabel },
  ]);
  if (choice === 'back') {
    api.goTo('room');
    return;
  }
  await store.say([...copy.dark.exit.stayReply]);
}

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
}

function buildHotspots(): Hotspot[] {
  return [
    {
      id: 'exit',
      rect: { x: AT.exit.x, y: AT.exit.y, w: 24, h: 40 },
      stand: { x: 4, y: 6 },
      label: copy.dark.exit.label,
      onInteract: leave,
    },
    {
      id: 'note-one',
      rect: { x: AT.noteOne.x - 4, y: 20, w: 18, h: 30 },
      stand: { x: 13, y: 6 },
      label: copy.dark.noteOne.label,
      onInteract: (api) => sayOnce(api, 'dark-note-one', copy.dark.noteOne.lines, copy.dark.noteOne.again),
    },
    {
      id: 'eye',
      rect: { x: AT.monitor.x, y: AT.monitor.y, w: 32, h: 40 },
      stand: { x: 19, y: 7 },
      label: copy.dark.monitor.label,
      onInteract: (api) => sayOnce(api, 'dark-eye', copy.dark.monitor.lines, copy.dark.monitor.again),
    },
    {
      id: 'note-two',
      rect: { x: AT.noteTwo.x - 6, y: 20, w: 22, h: 30 },
      stand: { x: 24, y: 6 },
      label: copy.dark.noteTwo.label,
      onInteract: (api) => sayOnce(api, 'dark-note-two', copy.dark.noteTwo.lines, copy.dark.noteTwo.again),
    },
    {
      id: 'arch',
      rect: { x: AT.arch.x, y: AT.arch.y, w: 24, h: 40 },
      stand: { x: 35, y: 6 },
      label: copy.dark.arch.label,
      async onInteract(api) {
        await api.store.say([...copy.dark.arch.lines]);
      },
    },
    {
      id: 'routing-sim',
      rect: { x: AT.router.x, y: AT.router.y, w: 32, h: 36 },
      stand: { x: 29, y: 16 },
      label: copy.dark.routing.label,
      onInteract: inspectBoard,
    },
    {
      id: 'cat',
      rect: { x: AT.cat.x, y: AT.cat.y, w: 16, h: 14 },
      stand: { x: 4, y: 17 },
      label: copy.dark.cat.label,
      onInteract: (api) => sayOnce(api, 'dark-cat', copy.dark.cat.lines, copy.dark.cat.again),
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

function frameOf(anim: string, index: number, frames: Record<string, string[]>): string {
  const list = frames[anim];
  return list[index % list.length];
}

type Layers = {
  canvas: HTMLCanvasElement;
  g: CanvasRenderingContext2D;
  src: ImageData;
  dst: ImageData;
  viewLights: Light[];
};

function makeLayers(w: number, h: number): Layers {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext('2d', { willReadFrequently: true });
  if (!g) throw new Error('2D canvas is not available');
  g.imageSmoothingEnabled = false;
  return {
    canvas,
    g,
    src: g.createImageData(w, h),
    dst: g.createImageData(w, h),
    viewLights: LIGHTS.map((l) => ({ ...l })),
  };
}

export function createDarkScene(_store: GameStore): Scene {
  const map = buildCollision();
  let layers: Layers | null = null;

  /** Pieces with height, sorted by the line they stand on, with the player among them. */
  function drawWorld(
    s: CanvasRenderingContext2D,
    ctx: SceneCtx,
    anims: Record<string, string[]>,
  ): void {
    drawShell(s);

    drawSprite(s, sprite('darkExit'), AT.exit.x, AT.exit.y);
    drawSprite(s, sprite('darkArch'), AT.arch.x, AT.arch.y);
    drawChalk(s, copy.dark.chalk[0], AT.chalkOne.x, AT.chalkOne.y);
    drawChalk(s, copy.dark.chalk[1], AT.chalkTwo.x, AT.chalkTwo.y);
    drawSprite(s, sprite('darkNote0'), AT.noteOne.x, AT.noteOne.y);
    drawSprite(s, sprite('darkNote1'), AT.noteTwo.x, AT.noteTwo.y);
    for (const x of [176, 188, 200]) drawChalk(s, '>', x, 108);

    const p = drawPos(ctx.player);
    const walkFrame = Math.floor(ctx.player.walkMs / 130);
    const playerName = ctx.player.moving
      ? frameOf(`visitor-${ctx.player.facing}`, walkFrame, anims)
      : `visitor-${ctx.player.facing}-0`;

    const things: { y: number; draw: () => void }[] = [
      {
        y: AT.monitor.y + 32,
        draw: () => drawSprite(s, sprite('darkMonitor'), AT.monitor.x, AT.monitor.y),
      },
      {
        y: AT.router.y + 36,
        draw: () => drawSprite(s, sprite('darkRouter'), AT.router.x, AT.router.y),
      },
      {
        y: AT.cat.y + 14,
        draw: () => drawSprite(s, sprite('cat-sitting'), AT.cat.x, AT.cat.y),
      },
      {
        y: p.y + 3,
        draw: () => drawSprite(s, sprite(playerName), p.x - 8, p.y + 3 - 24),
      },
    ];
    things.sort((a, b) => a.y - b.y);
    for (const thing of things) thing.draw();
  }

  /** What makes its own light is drawn after the dark, at full brightness. */
  function drawGlow(s: CanvasRenderingContext2D, ctx: SceneCtx, eyeAt: number): void {
    const { t, reducedMotion } = ctx;
    drawSprite(s, sprite('darkExitGlow'), AT.exit.x + 4, AT.exit.y + 3);

    const eyeName =
      !reducedMotion && t % 3400 < 150
        ? 'darkEyeBlink'
        : eyeAt < -22
          ? 'darkEyeLeft'
          : eyeAt > 22
            ? 'darkEyeRight'
            : 'darkEyeCenter';
    drawSprite(s, sprite(eyeName), AT.monitor.x + MONITOR_SCREEN.x, AT.monitor.y + MONITOR_SCREEN.y);

    // The packet, and the link that is down.
    const packet = packetAt(t, reducedMotion);
    s.fillStyle = SOLID_COLORS.C;
    s.fillRect(packet.x, packet.y, 2, 2);
    if (reducedMotion || Math.floor(t / 600) % 2 === 0) {
      s.fillStyle = SOLID_COLORS.k;
      const fx = AT.router.x + ROUTER_FAILED_LINK.x;
      const fy = AT.router.y + ROUTER_FAILED_LINK.y;
      for (const [dx, dy] of [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]]) {
        s.fillRect(fx + dx, fy + dy, 1, 1);
      }
    }

    // Two amber eyes in the corner.
    if (reducedMotion || t % 4100 > 200) {
      s.fillStyle = SOLID_COLORS.s;
      s.fillRect(AT.cat.x + 2, AT.cat.y + 4, 1, 1);
      s.fillRect(AT.cat.x + 8, AT.cat.y + 4, 1, 1);
    }
  }

  return {
    id: 'dark',
    worldW: WORLD_W,
    worldH: WORLD_H,
    map,
    spawn: { x: 4, y: 7 },
    hotspots: buildHotspots(),

    update() {
      // Motion is drawn from ctx.t; the lantern reads the input at draw time.
    },

    draw(g, ctx) {
      const { viewW, viewH, camera } = ctx;
      if (!layers || layers.canvas.width !== viewW || layers.canvas.height !== viewH) {
        layers = makeLayers(viewW, viewH);
      }
      const l = layers;
      const s = l.g;

      // 1. The world, unlit, into a scratch canvas the size of the view.
      s.setTransform(1, 0, 0, 1, 0, 0);
      s.fillStyle = INK;
      s.fillRect(0, 0, viewW, viewH);
      s.setTransform(1, 0, 0, 1, -camera.x, -camera.y);
      drawWorld(s, ctx, ANIMS);

      // 2. Light it in hard, dithered steps.
      const lights = darkLights(ctx);
      for (let i = 0; i < lights.length; i += 1) {
        const v = l.viewLights[i];
        v.x = lights[i].x - camera.x;
        v.y = lights[i].y - camera.y;
        v.radius = lights[i].radius;
        v.tint = lights[i].tint;
      }
      s.setTransform(1, 0, 0, 1, 0, 0);
      l.src = s.getImageData(0, 0, viewW, viewH);
      applyLighting(l.src, l.dst, l.viewLights);
      s.putImageData(l.dst, 0, 0);

      // 3. What glows by itself, at full brightness.
      s.setTransform(1, 0, 0, 1, -camera.x, -camera.y);
      drawGlow(s, ctx, lights[0].x - (AT.monitor.x + MONITOR_SCREEN.x + MONITOR_SCREEN.w / 2));
      s.setTransform(1, 0, 0, 1, 0, 0);

      // 4. Onto the game canvas, which is already translated by the camera.
      g.drawImage(l.canvas, camera.x, camera.y);
    },
  };
}
