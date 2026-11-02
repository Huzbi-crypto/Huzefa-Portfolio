import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { PALETTES, SPRITES } from '@/game/art';
import { projectStarId } from '@/game/content/stars';
import type { Input } from '@/game/core/input';
import { createStore, type GameStore } from '@/game/state/store';
import { createEntity } from '@/game/world/entity';
import { findPath, TILE } from '@/game/world/grid';
import { createTermExp } from '@/game/exhibits/termExp';
import { createArchive, MONSTER_POSTER } from './archive';
import { navMap } from './nav';
import type { GameApi, Scene, SceneCtx } from './types';

/** Every fill colour the scene paints, so the palette rule is checked on real draws. */
const painted = vi.hoisted(() => ({ colors: new Set<string>() }));

type FakeCanvas = { width: number; height: number; getContext: () => FakeContext };

type FakeContext = {
  canvas: FakeCanvas;
  imageSmoothingEnabled: boolean;
  fillStyle: string;
  globalCompositeOperation: string;
  [method: string]: unknown;
};

function imageData(width: number, height: number): ImageData {
  return { width, height, data: new Uint8ClampedArray(width * height * 4) } as ImageData;
}

function fakeCanvas(): FakeCanvas {
  let context: FakeContext;
  const canvas: FakeCanvas = { width: 0, height: 0, getContext: () => context };
  let fill = '#000000';
  context = {
    canvas,
    imageSmoothingEnabled: false,
    globalCompositeOperation: 'source-over',
    get fillStyle() {
      return fill;
    },
    set fillStyle(value: string) {
      fill = value;
      painted.colors.add(value.toLowerCase());
    },
    setTransform: () => undefined,
    fillRect: () => undefined,
    drawImage: () => undefined,
    getImageData: (_x: number, _y: number, w: number, h: number) => imageData(w, h),
    createImageData: (w: number, h: number) => imageData(w, h),
    putImageData: () => undefined,
    clearRect: () => undefined,
    save: () => undefined,
    restore: () => undefined,
    translate: () => undefined,
    scale: () => undefined,
  } as FakeContext;
  return canvas;
}

let realDocument: Document | undefined;

beforeAll(() => {
  const globals = globalThis as unknown as { document?: Document };
  realDocument = globals.document;
  globals.document = { createElement: () => fakeCanvas() } as unknown as Document;
});

afterAll(() => {
  const globals = globalThis as unknown as { document?: Document };
  if (realDocument === undefined) delete globals.document;
  else globals.document = realDocument;
});

/** The archive's exhibits, by project id. Each exhibit adds its id here. */
const EXHIBITS = ['term-exp'] as const;

function ctxFor(over: Partial<SceneCtx> = {}): SceneCtx {
  const input: Input = {
    move: { x: 0, y: 0 },
    pointer: null,
    mode: 'keyboard',
    drain: () => [],
    dispose: () => undefined,
  };
  return {
    t: 0,
    player: createEntity(40, 70),
    input,
    camera: { x: 0, y: 0 },
    viewW: 342,
    viewH: 192,
    scale: 4,
    drag: null,
    reducedMotion: false,
    found: [],
    ...over,
  };
}

function fakeApi(store: GameStore): GameApi & { shown: string[] } {
  const shown: string[] = [];
  return {
    store,
    shown,
    goTo: vi.fn(),
    openTerminal: vi.fn(),
    showProject: vi.fn(async (id: string) => {
      shown.push(id);
    }),
  };
}

const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Play an exhibit like a visitor: each time a dialogue with choices appears,
 * take the next pick from `picks` (the last choice once they run out, which
 * is always the way out). Plain lines are clicked through.
 */
async function play(store: GameStore, run: Promise<void>, picks: string[] = []): Promise<void> {
  let finished = false;
  void run.then(() => {
    finished = true;
  });
  for (let guard = 0; !finished && guard < 400; guard += 1) {
    await tick();
    const dialogue = store.getState().dialogue;
    if (!dialogue) continue;
    const lastLine = dialogue.line >= dialogue.lines.length - 1;
    const finishedTyping = dialogue.typed >= (dialogue.lines[dialogue.line]?.length ?? 0);
    if (!dialogue.choices.length || !lastLine || !finishedTyping) {
      store.advance();
      continue;
    }
    store.advance(picks.shift() ?? dialogue.choices[dialogue.choices.length - 1].id);
  }
  expect(finished, 'the exhibit finished without getting stuck').toBe(true);
}

function hotspot(scene: Scene, id: string) {
  const found = scene.hotspots.find((spot) => spot.id === id);
  if (!found) throw new Error(`no hotspot ${id}`);
  return found;
}

describe('createArchive', () => {
  it('all_stands_reachable', () => {
    const scene = createArchive(createStore(null));
    const nav = navMap(scene.map);
    const stands = [
      ...Object.values(scene.entries ?? {}),
      ...scene.hotspots.map((spot) => spot.stand),
    ];

    expect(scene.entries?.fromHall).toBeDefined();
    for (const stand of stands) {
      expect(nav.solid[stand.y * nav.w + stand.x], `stand ${stand.x},${stand.y}`).toBe(0);
      const path = findPath(nav, scene.spawn, stand);
      expect(path[path.length - 1] ?? scene.spawn, `stand ${stand.x},${stand.y}`).toEqual(stand);
    }
    expect(scene.hotspots.map((spot) => spot.id)).toEqual(
      expect.arrayContaining([...EXHIBITS, 'back-to-hall']),
    );
  });

  it('each_exhibit_awards_its_star_when_tried', async () => {
    for (const id of EXHIBITS) {
      const store = createStore(null);
      const scene = createArchive(store);
      const api = fakeApi(store);
      expect(store.getState().found).not.toContain(projectStarId(id));

      await play(store, Promise.resolve(hotspot(scene, id).onInteract(api)), ['ls']);

      expect(store.getState().found, id).toContain(projectStarId(id));
      expect(api.shown, id).toEqual([id]);
    }
  });

  it('reduced_motion_exhibit_still_awards', async () => {
    for (const id of EXHIBITS) {
      const store = createStore(null);
      store.setReducedMotion(true);
      const scene = createArchive(store);
      const api = fakeApi(store);

      await play(store, Promise.resolve(hotspot(scene, id).onInteract(api)), ['ls']);
      // Still drawn and updated calmly with motion off.
      const g = fakeCanvas().getContext() as unknown as CanvasRenderingContext2D;
      scene.update(16, ctxFor({ reducedMotion: true }));
      scene.draw(g, ctxFor({ reducedMotion: true }));

      expect(store.getState().found, id).toContain(projectStarId(id));
    }
  });

  it('phone_can_use_terminal_with_on_screen_choices', async () => {
    // No key events anywhere: the visitor only taps what the dialogue offers.
    const store = createStore(null);
    const api = fakeApi(store);
    const term = createTermExp({ x: 56, y: 92 });
    expect(term.shell().trying).toBe(false);

    const run = term.use(api);
    await tick();
    const offered = store.getState().dialogue?.choices.map((choice) => choice.id) ?? [];
    expect(offered).toEqual(expect.arrayContaining(['help', 'ls', 'cat', 'whoami', 'leave']));

    await play(store, run, ['help', 'cat']);

    expect(term.shell().trying).toBe(true);
    expect(term.shell().history).toEqual(['help', 'cat secrets.txt']);
    expect(store.getState().found).toContain(projectStarId('term-exp'));
  });

  it('monster_never_moves_toward_player', () => {
    const scene = createArchive(createStore(null));
    const before = { ...hotspot(scene, 'monster-poster').rect };
    expect(before).toEqual(MONSTER_POSTER.rect);

    const g = fakeCanvas().getContext() as unknown as CanvasRenderingContext2D;
    for (const at of [
      { x: 60, y: 70 },
      { x: MONSTER_POSTER.rect.x, y: MONSTER_POSTER.rect.y + 60 },
      { x: MONSTER_POSTER.rect.x + 4, y: MONSTER_POSTER.stand.y * TILE + 8 },
    ]) {
      const ctx = ctxFor({ player: createEntity(at.x, at.y), t: at.x * 37 });
      scene.update(16, ctx);
      scene.draw(g, ctx);
      expect(hotspot(scene, 'monster-poster').rect).toEqual(before);
    }
  });

  it('art_uses_palette_only', () => {
    const palette = new Set(Object.values(PALETTES['cozy-crt']).map((c) => c.toLowerCase()));
    painted.colors.clear();
    const scene = createArchive(createStore(null));
    const g = fakeCanvas().getContext() as unknown as CanvasRenderingContext2D;
    for (const t of [0, 400, 1300, 2700]) {
      const ctx = ctxFor({ t, drag: null });
      scene.update(16, ctx);
      scene.draw(g, ctx);
    }

    for (const color of painted.colors) {
      // The scene may reset to the backdrop's ink; anything else must be a palette colour.
      expect(palette.has(color), `colour ${color}`).toBe(true);
    }
    for (const [name, sprite] of Object.entries(SPRITES)) {
      if (!name.startsWith('arch')) continue;
      for (const px of sprite.pixels) {
        if (px !== null) expect(palette.has(px.toLowerCase()), name).toBe(true);
      }
    }
    expect(Object.keys(SPRITES).filter((name) => name.startsWith('arch')).length).toBeGreaterThan(0);
  });
});
