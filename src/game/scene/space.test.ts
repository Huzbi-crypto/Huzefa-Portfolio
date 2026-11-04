import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { SPRITES } from '@/game/art';
import type { Input } from '@/game/core/input';
import { createStore } from '@/game/state/store';
import { createEntity } from '@/game/world/entity';
import { findPath, TILE } from '@/game/world/grid';
import { navMap } from './nav';
import { createDarkSpace, type SpaceDef } from './space';
import type { GameApi, SceneCtx } from './types';

const recorder = vi.hoisted(() => ({
  events: [] as Array<{ kind: 'sprite'; sprite: { w: number; h: number } } | string>,
}));

vi.mock('@/game/render/sprite', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/game/render/sprite')>();
  return {
    ...actual,
    drawSprite: (_ctx: unknown, sprite: { w: number; h: number }) => {
      recorder.events.push({ kind: 'sprite', sprite });
    },
  };
});

type FakeCanvas = {
  width: number;
  height: number;
  getContext: () => FakeContext;
};

type FakeContext = {
  canvas: FakeCanvas;
  imageSmoothingEnabled: boolean;
  fillStyle: string;
  globalCompositeOperation: string;
  setTransform: (...args: number[]) => void;
  fillRect: (x: number, y: number, w: number, h: number) => void;
  createPattern: () => CanvasPattern | null;
  drawImage: (source: { width: number; height: number }, ...args: number[]) => void;
  getImageData: (x: number, y: number, w: number, h: number) => ImageData;
  createImageData: (w: number, h: number) => ImageData;
  putImageData: (...args: unknown[]) => void;
  clearRect: (...args: number[]) => void;
  save: () => void;
  restore: () => void;
  translate: (...args: number[]) => void;
  scale: (...args: number[]) => void;
};

function imageData(width: number, height: number): ImageData {
  return {
    width,
    height,
    data: new Uint8ClampedArray(width * height * 4),
  } as ImageData;
}

function fakeCanvas(): FakeCanvas {
  let context: FakeContext;
  const canvas: FakeCanvas = {
    width: 0,
    height: 0,
    getContext: () => context,
  };
  context = {
    canvas,
    imageSmoothingEnabled: false,
    fillStyle: '#000000',
    globalCompositeOperation: 'source-over',
    setTransform: () => undefined,
    fillRect: () => undefined,
    createPattern: () => ({}) as CanvasPattern,
    drawImage: () => undefined,
    getImageData: (_x, _y, w, h) => imageData(w, h),
    createImageData: (w, h) => imageData(w, h),
    putImageData: () => undefined,
    clearRect: () => undefined,
    save: () => undefined,
    restore: () => undefined,
    translate: () => undefined,
    scale: () => undefined,
  };
  return canvas;
}

let realDocument: Document | undefined;

beforeAll(() => {
  const globals = globalThis as unknown as { document?: Document };
  realDocument = globals.document;
  globals.document = {
    createElement: (tag: string) => {
      expect(tag).toBe('canvas');
      return fakeCanvas();
    },
  } as unknown as Document;
});

afterAll(() => {
  const globals = globalThis as unknown as { document?: Document };
  if (realDocument === undefined) delete globals.document;
  else globals.document = realDocument;
});

function makeDef(over: Partial<SpaceDef> = {}): SpaceDef {
  return {
    id: 'workshop',
    worldW: 160,
    worldH: 128,
    solids: [{ x: 0, y: 0, w: 160, h: 24 }],
    spawn: { x: 3, y: 4 },
    entries: { fromHall: { x: 4, y: 5 } },
    exits: [
      {
        id: 'out',
        rect: { x: 8, y: 8, w: 16, h: 24 },
        stand: { x: 3, y: 4 },
        label: 'Way out',
        to: 'dark',
        entry: 'fromWorkshop',
      },
    ],
    props: [
      {
        id: 'lamp',
        footY: 60,
        draw: () => undefined,
        interact: {
          rect: { x: 24, y: 40, w: 8, h: 16 },
          stand: { x: 3, y: 6 },
          label: 'Check the lamp',
          use: () => undefined,
        },
      },
    ],
    exhibits: [
      {
        id: 'a',
        projectId: 'routing-sim',
        rect: { x: 48, y: 48, w: 16, h: 16 },
        stand: { x: 6, y: 8 },
        footY: 64,
        label: 'Exhibit A',
        update: () => undefined,
        draw: () => {
          recorder.events.push('exhibit-a');
        },
        use: async () => undefined,
      },
      {
        id: 'b',
        projectId: 'ai-anime',
        rect: { x: 96, y: 64, w: 16, h: 16 },
        stand: { x: 12, y: 10 },
        footY: 96,
        label: 'Exhibit B',
        update: () => undefined,
        draw: () => {
          recorder.events.push('exhibit-b');
        },
        use: async () => undefined,
      },
    ],
    lights: [],
    drawBackdrop: () => undefined,
    ...over,
  };
}

function ctxFor(player = createEntity(80, 80)): SceneCtx {
  const input: Input = {
    move: { x: 0, y: 0 },
    pointer: null,
    mode: 'keyboard',
    drain: () => [],
    dispose: () => undefined,
  };
  return {
    t: 0,
    player,
    input,
    camera: { x: 0, y: 0 },
    viewW: 342,
    viewH: 192,
    scale: 4,
    drag: null,
    reducedMotion: false,
    found: [],
  };
}

function fakeApi(store = createStore(null)): GameApi {
  return {
    store,
    goTo: vi.fn(),
    openTerminal: vi.fn(),
    showProject: vi.fn(async () => undefined),
  };
}

async function clickThrough(store: GameApi['store'], choice?: string): Promise<void> {
  for (let guard = 0; store.getState().dialogue && guard < 64; guard += 1) {
    store.advance(choice);
    await Promise.resolve();
  }
}

describe('createDarkSpace', () => {
  it('space_builds_a_scene_from_a_def', () => {
    const def = makeDef();
    const scene = createDarkSpace(def, createStore(null));

    expect(scene.id).toBe('workshop');
    expect(scene.worldW).toBe(def.worldW);
    expect(scene.worldH).toBe(def.worldH);
    expect(scene.spawn).toEqual(def.spawn);
    expect(scene.entries).toEqual(def.entries);
    expect(scene.map.w * TILE).toBe(def.worldW);
    expect(scene.map.h * TILE).toBe(def.worldH);

    // The wall from the def, and the safety border every space gets.
    expect(scene.map.solid[0]).toBe(1);
    expect(scene.map.solid[4 * scene.map.w]).toBe(1);
    expect(scene.map.solid[8 * scene.map.w + 8]).toBe(0);

    expect(scene.hotspots.map((hotspot) => hotspot.id).sort()).toEqual([
      'a',
      'b',
      'lamp',
      'out',
    ]);
  });

  it('exits_go_to_named_entry', async () => {
    const store = createStore(null);
    store.setReducedMotion(true);
    const scene = createDarkSpace(makeDef(), store);
    const api = fakeApi(store);
    const exit = scene.hotspots.find((hotspot) => hotspot.id === 'out');
    if (!exit) throw new Error('no exit hotspot');

    const done = Promise.resolve(exit.onInteract(api));
    await clickThrough(store, 'back');
    await done;

    expect(api.goTo).toHaveBeenCalledWith('dark', 'fromWorkshop');
  });

  it('every_entry_and_exhibit_stand_is_reachable', () => {
    const def = makeDef();
    const scene = createDarkSpace(def, createStore(null));
    const nav = navMap(scene.map);
    const stands = [...Object.values(def.entries), ...def.exhibits.map((exhibit) => exhibit.stand)];

    for (const stand of stands) {
      expect(nav.solid[stand.y * nav.w + stand.x], `stand ${stand.x},${stand.y}`).toBe(0);
      const path = findPath(nav, scene.spawn, stand);
      const last = path[path.length - 1] ?? scene.spawn;
      expect(last, `stand ${stand.x},${stand.y}`).toEqual(stand);
    }
  });

  it('scene_cancel_stops_every_exhibit_beat', () => {
    const cancelA = vi.fn();
    const cancelB = vi.fn();
    const def = makeDef();
    def.exhibits[0].cancel = cancelA;
    def.exhibits[1].cancel = cancelB;
    const scene = createDarkSpace(def, createStore(null));

    scene.cancel?.();

    expect(cancelA).toHaveBeenCalledTimes(1);
    expect(cancelB).toHaveBeenCalledTimes(1);
  });

  it('exhibits_sort_with_the_player_by_footY', () => {
    recorder.events.length = 0;
    const scene = createDarkSpace(makeDef(), createStore(null));
    const canvas = fakeCanvas();
    scene.draw(canvas.getContext() as unknown as CanvasRenderingContext2D, ctxFor());

    const order = recorder.events.map((event) => {
      if (typeof event === 'string') return event;
      return event.sprite === SPRITES['visitor-down-0'] ? 'player' : 'other';
    });

    const first = order.indexOf('exhibit-a');
    const player = order.indexOf('player');
    const second = order.indexOf('exhibit-b');
    expect(first).toBeGreaterThanOrEqual(0);
    expect(player).toBeGreaterThanOrEqual(0);
    expect(second).toBeGreaterThanOrEqual(0);
    expect(first).toBeLessThan(player);
    expect(player).toBeLessThan(second);
  });
});
