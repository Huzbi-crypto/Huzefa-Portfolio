import { personalInfo } from '@/data/personal';
import { ANIMS, SPRITES } from '@/game/art';
import { copy } from '@/game/content/copy';
import { readStarId, starTotal } from '@/game/content/stars';
import { drawSprite } from '@/game/render/sprite';
import type { GameStore } from '@/game/state/store';
import { drawPos } from '@/game/world/entity';
import { parseCollision, TILE } from '@/game/world/grid';
import type { GameApi, Hotspot, Scene, SceneCtx } from './types';

const WORLD_W = 288;
const WORLD_H = 208;
const COLS = WORLD_W / TILE;
const ROWS = WORLD_H / TILE;

/** Where everything stands, in world pixels. Sprites keep their own size. */
const AT = {
  window: { x: 24, y: 4 },
  shelf: { x: 88, y: 8 },
  desk: { x: 136, y: 24 },
  crt: { x: 150, y: 8 },
  note: { x: 140, y: 26 },
  tea: { x: 172, y: 26 },
  door: { x: 240, y: 8 },
  doorLight: { x: 238, y: 48 },
  rug: { x: 120, y: 112 },
  sofa: { x: 16, y: 104 },
  lampGlow: { x: 200, y: 98 },
  lamp: { x: 214, y: 100 },
  cat: { x: 176, y: 136 },
} as const;

/** Eight slots in the window's four panes; stars light up as visitors find things. */
const STAR_SLOTS = [
  [5, 5], [10, 8], [5, 16], [10, 19],
  [18, 5], [23, 8], [18, 16], [23, 19],
] as const;

const WALL_ROWS = 6; // rows 0..5 are wall, rows 6.. are floor

function buildCollision() {
  const grid: string[][] = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => '.'),
  );
  const solid = (x0: number, y0: number, x1: number, y1: number): void => {
    for (let y = y0; y <= y1; y += 1) {
      for (let x = x0; x <= x1; x += 1) grid[y][x] = '#';
    }
  };

  solid(0, 0, COLS - 1, WALL_ROWS - 1);
  solid(0, 0, 0, ROWS - 1);
  solid(COLS - 1, 0, COLS - 1, ROWS - 1);
  solid(0, ROWS - 1, COLS - 1, ROWS - 1);
  solid(17, 6, 22, 6); // desk
  solid(2, 13, 6, 16); // sofa
  solid(26, 15, 27, 16); // lamp base

  return parseCollision(grid.map((row) => row.join('')));
}

function sprite(name: string) {
  const found = SPRITES[name];
  if (!found) throw new Error(`Missing sprite: ${name}`);
  return found;
}

function litSlotCount(found: number, total: number): number {
  if (found <= 0 || total <= 0) return 0;
  return Math.min(STAR_SLOTS.length, Math.ceil((found / total) * STAR_SLOTS.length));
}

function frameOf(anim: string, index: number): string {
  const frames = ANIMS[anim];
  return frames[index % frames.length];
}

async function openDoor(api: GameApi): Promise<void> {
  const { store } = api;
  const opened = store.getState().doorOpened;
  const choice = await store.say(
    opened ? [...copy.door.again] : [...copy.door.lines],
    [
      { id: 'open', label: opened ? copy.door.enterLabel : copy.door.openLabel },
      { id: 'stay', label: copy.door.stayLabel },
    ],
  );

  if (choice === 'open') {
    store.setDoorOpened();
    api.goTo('dark');
    return;
  }
  await store.say([...copy.door.stayReply]);
}

/** One shelf opinion per visit: the first unread book, then back round again. */
async function browseShelf(api: GameApi): Promise<void> {
  const { store } = api;
  const list = personalInfo.readingList;
  const found = new Set(store.getState().found);
  let pick = list.find((item) => !found.has(readStarId(item.title)));

  if (pick) {
    store.award(readStarId(pick.title));
  } else {
    const visit = store.count('shelf-browse');
    store.increment('shelf-browse');
    pick = list[visit % list.length];
  }

  const lines = [copy.shelf.pull(pick.title)];
  if (pick.note) lines.push(pick.note);
  await store.say(lines);
}

async function petCat(api: GameApi): Promise<void> {
  const { store } = api;
  store.increment('pet-cat');
  const pets = store.count('pet-cat');

  if (pets === 10) {
    store.award('silly:pet-cat');
    await store.say([...copy.cat.tenth]);
    return;
  }
  if (pets > 10) {
    await store.say([...copy.cat.afterTenth]);
    return;
  }
  await store.say([copy.cat.pets[(pets - 1) % copy.cat.pets.length]]);
}

async function readWindow(api: GameApi): Promise<void> {
  const { found, total } = api.store.getState();
  if (found.length === 0) {
    await api.store.say([...copy.window.none]);
  } else if (found.length >= total) {
    await api.store.say([...copy.window.all]);
  } else {
    await api.store.say(copy.window.some(found.length, total));
  }
}

function buildHotspots(): Hotspot[] {
  return [
    {
      id: 'note',
      rect: { x: AT.note.x, y: AT.note.y, w: 10, h: 11 },
      stand: { x: 17, y: 7 },
      label: 'Read the note',
      async onInteract(api) {
        const first = api.store.award('silly:read-note');
        await api.store.say([...(first ? copy.note.lines : copy.note.again)]);
      },
    },
    {
      id: 'tea',
      rect: { x: AT.tea.x, y: AT.tea.y, w: 12, h: 10 },
      stand: { x: 21, y: 7 },
      label: 'Check the tea',
      async onInteract(api) {
        const first = api.store.award('silly:cold-tea');
        await api.store.say([...(first ? copy.tea.lines : copy.tea.again)]);
      },
    },
    {
      id: 'monitor',
      rect: { x: AT.crt.x, y: AT.crt.y, w: 20, h: 20 },
      stand: { x: 19, y: 7 },
      label: 'Use the monitor',
      async onInteract(api) {
        await api.store.say([...copy.monitor.lines]);
        api.openTerminal();
      },
    },
    {
      id: 'shelf',
      rect: { x: AT.shelf.x, y: AT.shelf.y, w: 32, h: 40 },
      stand: { x: 12, y: 6 },
      label: 'Browse the shelf',
      onInteract: browseShelf,
    },
    {
      id: 'cat',
      rect: { x: AT.cat.x, y: AT.cat.y, w: 16, h: 14 },
      stand: { x: 21, y: 17 },
      label: 'Pet the cat',
      onInteract: petCat,
    },
    {
      id: 'window',
      rect: { x: AT.window.x, y: AT.window.y, w: 32, h: 32 },
      stand: { x: 4, y: 6 },
      label: 'Look outside',
      onInteract: readWindow,
    },
    {
      id: 'door',
      rect: { x: AT.door.x, y: AT.door.y, w: 24, h: 40 },
      stand: { x: 31, y: 6 },
      label: 'Check the door',
      onInteract: openDoor,
    },
  ];
}

function drawShell(g: CanvasRenderingContext2D): void {
  for (let x = 0; x < WORLD_W; x += 16) {
    drawSprite(g, sprite('wall'), x, 0);
    drawSprite(g, sprite('wall'), x, 16);
    drawSprite(g, sprite('wallBase'), x, 32);
    drawSprite(g, sprite('floorUnderWall'), x, 48);
    for (let y = 64, row = 0; y < WORLD_H; y += 16, row += 1) {
      drawSprite(g, sprite((x / 16 + row) % 2 ? 'floorAlt' : 'floor'), x, y);
    }
  }
}

function drawWindowStars(g: CanvasRenderingContext2D, ctx: SceneCtx): void {
  const lit = litSlotCount(ctx.found.length, starTotal());
  STAR_SLOTS.forEach(([dx, dy], index) => {
    drawSprite(
      g,
      sprite(index < lit ? 'starLit' : 'starDim'),
      AT.window.x + dx,
      AT.window.y + dy,
    );
  });
}

export function createRoomScene(store: GameStore): Scene {
  const map = buildCollision();

  return {
    id: 'room',
    worldW: WORLD_W,
    worldH: WORLD_H,
    map,
    spawn: { x: 16, y: 15 },
    hotspots: buildHotspots(),

    update() {
      // The room has no per-frame logic of its own: motion is drawn from ctx.t.
    },

    draw(g, ctx) {
      const { t, reducedMotion } = ctx;
      drawShell(g);

      // Wall pieces.
      drawSprite(g, sprite('window'), AT.window.x, AT.window.y);
      drawWindowStars(g, ctx);
      drawSprite(g, sprite('shelfFull'), AT.shelf.x, AT.shelf.y);
      drawSprite(
        g,
        sprite(store.getState().doorOpened ? 'doorOpen' : 'doorClosed'),
        AT.door.x,
        AT.door.y,
      );
      drawSprite(g, sprite('desk'), AT.desk.x, AT.desk.y);
      const flicker = !reducedMotion && t % 2300 < 120;
      drawSprite(g, sprite(flicker ? 'crt-1' : 'crt'), AT.crt.x, AT.crt.y);
      drawSprite(g, sprite('note'), AT.note.x, AT.note.y);
      drawSprite(g, sprite('tea'), AT.tea.x, AT.tea.y);

      // Floor decals.
      drawSprite(g, sprite('rug'), AT.rug.x, AT.rug.y);
      drawSprite(g, sprite('lampGlow'), AT.lampGlow.x, AT.lampGlow.y);
      const shimmer = !reducedMotion && Math.floor(t / 700) % 2 === 1;
      drawSprite(g, sprite('doorLight'), AT.doorLight.x, AT.doorLight.y, {
        flipX: shimmer,
      });

      // Everything with height, sorted by the line it stands on.
      const catFrame = !reducedMotion && t % 2600 < 320 ? 1 : 0;
      const p = drawPos(ctx.player);
      const walkFrame = Math.floor(ctx.player.walkMs / 130);
      const playerName = ctx.player.moving
        ? frameOf(`visitor-${ctx.player.facing}`, walkFrame)
        : `visitor-${ctx.player.facing}-0`;

      const things: { y: number; draw: () => void }[] = [
        {
          y: AT.sofa.y + 26,
          draw: () => drawSprite(g, sprite('sofa'), AT.sofa.x, AT.sofa.y),
        },
        {
          y: AT.lamp.y + 30,
          draw: () => drawSprite(g, sprite('lamp'), AT.lamp.x, AT.lamp.y),
        },
        {
          y: AT.cat.y + 14,
          draw: () =>
            drawSprite(g, sprite(frameOf('cat-sit', catFrame)), AT.cat.x, AT.cat.y),
        },
        {
          y: p.y + 3,
          draw: () => drawSprite(g, sprite(playerName), p.x - 8, p.y + 3 - 24),
        },
      ];
      things.sort((a, b) => a.y - b.y);
      for (const thing of things) thing.draw();
    },
  };
}
