import { personalInfo } from '@/data/personal';
import { ACTIVE_PALETTE, ANIMS, SPRITES } from '@/game/art';
import { copy } from '@/game/content/copy';
import { readStarId, starTotal } from '@/game/content/stars';
import { drawSprite } from '@/game/render/sprite';
import type { GameStore } from '@/game/state/store';
import { drawPos } from '@/game/world/entity';
import { parseCollision, TILE } from '@/game/world/grid';
import type { GameApi, Hotspot, Scene, SceneCtx } from './types';

const WORLD_W = 336;
const WORLD_H = 192;
const COLS = WORLD_W / TILE;
const ROWS = WORLD_H / TILE;

/** Where everything stands, in world pixels. Sprites keep their own size. */
const AT = {
  window: { x: 24, y: 4 },
  windowTwo: { x: 232, y: 4 },
  shelf: { x: 96, y: 8 },
  desk: { x: 152, y: 24 },
  crt: { x: 166, y: 8 },
  note: { x: 156, y: 26 },
  clueNote: { x: 212, y: 26 },
  tea: { x: 188, y: 26 },
  door: { x: 288, y: 8 },
  doorLight: { x: 286, y: 48 },
  rug: { x: 144, y: 96 },
  sofa: { x: 24, y: 96 },
  lampGlow: { x: 246, y: 90 },
  lamp: { x: 260, y: 92 },
  cat: { x: 212, y: 124 },
} as const;

/** The two windows share one night sky; every star lights in both. */
const WINDOW_SPOTS = [AT.window, AT.windowTwo] as const;

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
  solid(19, 6, 24, 6); // desk
  solid(3, 12, 7, 15); // sofa
  solid(32, 14, 33, 15); // lamp base

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
  store.increment('door-stay');
  if (store.count('door-stay') === 3 && store.award('silly:door-chicken')) {
    await store.say([...copy.doorChicken.lines]);
    return;
  }
  if (store.count('door-stay') > 3) {
    await store.say([...copy.doorChicken.again]);
    return;
  }
  await store.say([...copy.door.stayReply]);
}

type Book = (typeof personalInfo.readingList)[number];

/** The shelf is three rows; the reading list splits across them in order. */
const SHELF_ROWS = 3;

function shelfRows(): Book[][] {
  const list = personalInfo.readingList;
  const per = Math.ceil(list.length / SHELF_ROWS);
  return Array.from({ length: SHELF_ROWS }, (_, row) => list.slice(row * per, (row + 1) * per)).filter(
    (row) => row.length > 0,
  );
}

/** Take one book down: its star the first time, and Huzbi's opinion every time. */
async function readBook(api: GameApi, book: Book): Promise<void> {
  api.store.award(readStarId(book.title));
  const lines = [copy.shelf.pull(book.title)];
  if (book.note) lines.push(book.note);
  await api.store.say(lines);
}

/** The next book nobody has read yet, then back round the list again. */
async function readNext(api: GameApi): Promise<void> {
  const { store } = api;
  const list = personalInfo.readingList;
  const found = new Set(store.getState().found);
  let pick = list.find((item) => !found.has(readStarId(item.title)));

  if (!pick) {
    const visit = store.count('shelf-browse');
    store.increment('shelf-browse');
    pick = list[visit % list.length];
  }
  await readBook(api, pick);
}

/**
 * The whole shelf, browsable: the first choice is always "whatever is next",
 * so a single press still works; the rows let anyone pick a spine; the last
 * choice leaves, which is also what Esc takes.
 */
async function browseShelf(api: GameApi): Promise<void> {
  const { store } = api;
  const rows = shelfRows();

  for (let guard = 0; guard < 200; guard += 1) {
    const choice = await store.say(
      [...copy.shelf.menu],
      [
        { id: 'next', label: copy.shelf.nextLabel },
        ...rows.map((_, index) => ({ id: `row:${index}`, label: copy.shelf.rowLabels[index] })),
        { id: 'leave', label: copy.shelf.leaveLabel },
      ],
    );

    if (choice === 'next') return readNext(api);
    if (!choice || !choice.startsWith('row:')) return;

    const books = rows[Number(choice.slice(4))] ?? [];
    const found = new Set(store.getState().found);
    const pick = await store.say(
      [copy.shelf.which],
      [
        ...books.map((book) => {
          const id = readStarId(book.title);
          return { id, label: found.has(id) ? `${book.title} ${copy.shelf.readMark}` : book.title };
        }),
        { id: 'back', label: copy.shelf.backLabel },
      ],
    );
    const book = books.find((item) => readStarId(item.title) === pick);
    if (book) return readBook(api, book);
    // 'back', or Esc, goes round to the rows again.
  }
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

/** The second note: the first scrap of the trail through the dark. */
async function readClueNote(api: GameApi): Promise<void> {
  const first = !api.store.hasClue('clue:note');
  api.store.markClue('clue:note');
  await api.store.say([...(first ? copy.clues.note.lines : copy.clues.note.again)]);
}

async function readWindow(api: GameApi): Promise<void> {
  api.store.increment('window-look');
  if (api.store.count('window-look') === 5 && api.store.award('silly:wave-at-sky')) {
    await api.store.say([...copy.waveAtSky.lines]);
    return;
  }
  const { found, total } = api.store.getState();
  if (found.length === 0) {
    await api.store.say([...copy.window.none]);
  } else if (found.length >= total) {
    await api.store.say([...copy.window.all]);
  } else {
    await api.store.say(copy.window.some(found.length, total));
  }
}

/**
 * A window's stand tile sits on the first floor row, so its rect reaches down
 * to the wall base. Otherwise the visitor walks there and drops out of range
 * before the interaction can fire.
 */
function windowHotspot(id: string, at: { x: number; y: number }, standX: number): Hotspot {
  return {
    id,
    rect: { x: at.x, y: at.y, w: 32, h: 44 },
    stand: { x: standX, y: 6 },
    label: 'Look outside',
    onInteract: readWindow,
  };
}

/** A thing in the room whose only job is to be a joke worth a star. */
function silly(
  id: string,
  rect: Hotspot['rect'],
  stand: Hotspot['stand'],
  text: { label: string; lines: readonly string[]; again: readonly string[] },
  star: string,
): Hotspot {
  return {
    id,
    rect,
    stand,
    label: text.label,
    async onInteract(api) {
      const first = api.store.award(star);
      await api.store.say([...(first ? text.lines : text.again)]);
    },
  };
}

function buildHotspots(): Hotspot[] {
  return [
    {
      id: 'note',
      rect: { x: AT.note.x, y: AT.note.y, w: 10, h: 26 },
      stand: { x: 19, y: 7 },
      label: 'Read the note',
      async onInteract(api) {
        const first = api.store.award('silly:read-note');
        api.store.increment('note-read');
        if (api.store.count('note-read') === 3 && api.store.award('silly:note-thrice')) {
          await api.store.say([...copy.noteThrice.lines]);
          return;
        }
        await api.store.say([...(first ? copy.note.lines : copy.note.again)]);
      },
    },
    {
      id: 'clue:note',
      rect: { x: AT.clueNote.x, y: AT.clueNote.y, w: 10, h: 22 },
      stand: { x: 27, y: 7 },
      label: copy.clues.note.label,
      onInteract: readClueNote,
    },
    {
      id: 'tea',
      rect: { x: AT.tea.x, y: AT.tea.y, w: 12, h: 26 },
      stand: { x: 24, y: 7 },
      label: 'Check the tea',
      async onInteract(api) {
        const first = api.store.award('silly:cold-tea');
        api.store.increment('tea-check');
        if (api.store.count('tea-check') === 3 && api.store.award('silly:drink-tea')) {
          await api.store.say([...copy.drinkTea.lines]);
          return;
        }
        if (api.store.count('tea-check') > 3) {
          await api.store.say([...copy.drinkTea.again]);
          return;
        }
        await api.store.say([...(first ? copy.tea.lines : copy.tea.again)]);
      },
    },
    {
      id: 'monitor',
      rect: { x: AT.crt.x, y: AT.crt.y, w: 20, h: 44 },
      stand: { x: 21, y: 7 },
      label: 'Use the monitor',
      async onInteract(api) {
        await api.store.say([...copy.monitor.lines]);
        api.openTerminal();
      },
    },
    {
      id: 'shelf',
      rect: { x: AT.shelf.x, y: AT.shelf.y, w: 32, h: 40 },
      stand: { x: 13, y: 6 },
      label: 'Browse the shelf',
      onInteract: browseShelf,
    },
    {
      id: 'cat',
      rect: { x: AT.cat.x, y: AT.cat.y, w: 16, h: 14 },
      stand: { x: 25, y: 16 },
      label: 'Pet the cat',
      onInteract: petCat,
    },
    silly('sofa', { x: AT.sofa.x, y: AT.sofa.y, w: 40, h: 26 }, { x: 5, y: 16 }, copy.sofa, 'silly:sofa'),
    silly('lamp', { x: AT.lamp.x, y: AT.lamp.y, w: 12, h: 34 }, { x: 33, y: 16 }, copy.lamp, 'silly:lamp'),
    silly('rug', { x: AT.rug.x, y: AT.rug.y, w: 48, h: 32 }, { x: 22, y: 16 }, copy.rug, 'silly:rug'),
    windowHotspot('window', AT.window, 4),
    windowHotspot('window-two', AT.windowTwo, 30),
    {
      id: 'door',
      rect: { x: AT.door.x, y: AT.door.y, w: 24, h: 40 },
      stand: { x: 37, y: 6 },
      label: 'Check the door',
      onInteract: openDoor,
    },
  ];
}

/** One row of the shell at world y, for any y: walls above, boards below. */
function drawShellRow(g: CanvasRenderingContext2D, y: number, x0: number, x1: number): void {
  const row = Math.floor((y - 64) / 16);
  for (let x = Math.floor(x0 / 16) * 16; x < x1; x += 16) {
    if (y === 32) drawSprite(g, sprite('wallBase'), x, y);
    else if (y === 48) drawSprite(g, sprite('floorUnderWall'), x, y);
    else if (y < 32) drawSprite(g, sprite('wall'), x, y);
    else {
      // Boards run the width of the room; only an occasional end joint shows.
      const joint = (Math.floor(x / 16) * 7 + row * 5) % 9 === 0;
      drawSprite(g, sprite(joint ? 'floorAlt' : 'floor'), x, y);
    }
  }
}

/**
 * The room fills the world; where the view is bigger (a tall phone, a wide
 * monitor) the walls and boards carry on and fade out in dithered steps, so
 * the room is never a small picture floating in a void.
 */
function drawShell(g: CanvasRenderingContext2D, ctx: SceneCtx): void {
  const { camera, viewW, viewH } = ctx;
  const top = Math.min(0, Math.floor(camera.y / 16) * 16);
  const bottom = Math.max(WORLD_H, camera.y + viewH);
  for (let y = top; y < bottom; y += 16) {
    drawShellRow(g, y, Math.min(0, camera.x), Math.max(WORLD_W, camera.x + viewW));
  }
  drawFade(g, ctx);
}

/** Plain extension first, then seven dithered steps of this width fade to ink. */
const FADE_LEAD = 6;
const FADE_STEP = 14;
const FADE_LEVELS = 7;
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const fadePatterns = new WeakMap<CanvasRenderingContext2D, CanvasPattern[]>();

function fadePatternsFor(g: CanvasRenderingContext2D): CanvasPattern[] {
  const cached = fadePatterns.get(g);
  if (cached) return cached;

  const patterns: CanvasPattern[] = [];
  for (let level = 1; level <= FADE_LEVELS; level += 1) {
    const tile = document.createElement('canvas');
    tile.width = 4;
    tile.height = 4;
    const t = tile.getContext('2d');
    if (!t) continue;
    t.fillStyle = ACTIVE_PALETTE.a;
    BAYER.forEach((threshold, index) => {
      if (threshold < level * 2) t.fillRect(index % 4, Math.floor(index / 4), 1, 1);
    });
    const pattern = g.createPattern(tile, 'repeat');
    if (pattern) patterns.push(pattern);
  }
  fadePatterns.set(g, patterns);
  return patterns;
}

function drawFade(g: CanvasRenderingContext2D, ctx: SceneCtx): void {
  const { camera, viewW, viewH } = ctx;
  const outsideX = camera.x < 0 || camera.x + viewW > WORLD_W;
  const outsideY = camera.y < 0 || camera.y + viewH > WORLD_H;
  if (!outsideX && !outsideY) return;

  const patterns = fadePatternsFor(g);
  const reach = 4000;
  const ring = (grow: number, inner: number, fill: string | CanvasPattern): void => {
    const path = new Path2D();
    path.rect(-grow, -grow, WORLD_W + grow * 2, WORLD_H + grow * 2);
    path.rect(-inner, -inner, WORLD_W + inner * 2, WORLD_H + inner * 2);
    g.fillStyle = fill;
    g.fill(path, 'evenodd');
  };

  patterns.forEach((pattern, index) => {
    ring(FADE_LEAD + FADE_STEP * (index + 1), FADE_LEAD + FADE_STEP * index, pattern);
  });
  ring(reach, FADE_LEAD + FADE_STEP * patterns.length, ACTIVE_PALETTE.a);
}

function drawWindowStars(g: CanvasRenderingContext2D, ctx: SceneCtx): void {
  const lit = litSlotCount(ctx.found.length, starTotal());
  for (const spot of WINDOW_SPOTS) {
    STAR_SLOTS.forEach(([dx, dy], index) => {
      drawSprite(
        g,
        sprite(index < lit ? 'starLit' : 'starDim'),
        spot.x + dx,
        spot.y + dy,
      );
    });
  }
}

export function createRoomScene(store: GameStore): Scene {
  const map = buildCollision();

  return {
    id: 'room',
    worldW: WORLD_W,
    worldH: WORLD_H,
    map,
    spawn: { x: 20, y: 11 },
    hotspots: buildHotspots(),

    update() {
      // The room has no per-frame logic of its own: motion is drawn from ctx.t.
    },

    draw(g, ctx) {
      const { t, reducedMotion } = ctx;
      drawShell(g, ctx);

      // Wall pieces.
      drawSprite(g, sprite('window'), AT.window.x, AT.window.y);
      drawSprite(g, sprite('window'), AT.windowTwo.x, AT.windowTwo.y);
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
      drawSprite(g, sprite('note'), AT.clueNote.x, AT.clueNote.y);
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
