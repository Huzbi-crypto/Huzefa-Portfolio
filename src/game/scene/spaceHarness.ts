import { vi } from 'vitest';
import type { Input } from '@/game/core/input';
import { createStore, type GameStore } from '@/game/state/store';
import { createEntity } from '@/game/world/entity';
import { TILE } from '@/game/world/grid';
import type { GameApi, Hotspot, Scene, SceneCtx } from './types';

/**
 * Test-only kit for the dark spaces: a canvas that records every fill colour,
 * a scene clock, and an `interact` that dismisses dialogue the way a visitor
 * would. Nothing here ships in the game.
 */

export const painted = { colors: new Set<string>() };

type FakeContext = {
  canvas: { width: number; height: number; getContext: () => FakeContext };
  imageSmoothingEnabled: boolean;
  fillStyle: string;
  globalCompositeOperation: string;
  [method: string]: unknown;
};

function imageData(width: number, height: number): ImageData {
  return { width, height, data: new Uint8ClampedArray(width * height * 4) } as ImageData;
}

export function fakeCanvas(): FakeContext['canvas'] {
  let context: FakeContext;
  const canvas: FakeContext['canvas'] = { width: 0, height: 0, getContext: () => context };
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

export function fakeGraphics(): CanvasRenderingContext2D {
  return fakeCanvas().getContext() as unknown as CanvasRenderingContext2D;
}

/** Give the code under test a `document` that can make canvases. Returns the undo. */
export function installFakeDocument(): () => void {
  const globals = globalThis as unknown as { document?: Document };
  const real = globals.document;
  globals.document = { createElement: () => fakeCanvas() } as unknown as Document;
  return () => {
    if (real === undefined) delete globals.document;
    else globals.document = real;
  };
}

const idle: Input = {
  move: { x: 0, y: 0 },
  pointer: null,
  mode: 'keyboard',
  drain: () => [],
  dispose: () => undefined,
};

export type Harness = {
  store: GameStore;
  scene: Scene;
  api: GameApi;
  ctx(): SceneCtx;
  tick(ms: number): void;
};

export function harness(
  make: (store: GameStore) => Scene,
  opts: { reducedMotion?: boolean; store?: GameStore } = {},
): Harness {
  const store = opts.store ?? createStore(null);
  const scene = make(store);
  const api: GameApi = {
    store,
    goTo: vi.fn(),
    openTerminal: vi.fn(),
    showProject: vi.fn(async () => undefined),
  };
  let t = 0;
  const ctx = (): SceneCtx => ({
    t,
    player: createEntity(scene.spawn.x * TILE + 8, scene.spawn.y * TILE + 16),
    input: idle,
    camera: { x: 0, y: 0 },
    viewW: 240,
    viewH: 135,
    scale: 4,
    drag: null,
    reducedMotion: opts.reducedMotion ?? false,
    found: store.getState().found,
  });
  const tick = (ms: number): void => {
    t += ms;
    scene.update(ms, ctx());
  };
  return { store, scene, api, ctx, tick };
}

export function byId(scene: Scene, id: string): Hotspot {
  const found = scene.hotspots.find((h) => h.id === id);
  if (!found) throw new Error(`no hotspot ${id}`);
  return found;
}

/** True when a pointer at this world pixel would select the hotspot. */
export function coversPointer(h: Hotspot, x: number, y: number): boolean {
  const targets = h.hitRects && h.hitRects.length > 0 ? h.hitRects : [h.rect];
  return targets.some(
    (rect) => x >= rect.x && x < rect.x + rect.w && y >= rect.y && y < rect.y + rect.h,
  );
}

/**
 * Use a hotspot, stepping the scene clock and dismissing every dialogue until
 * it finishes. `choice` answers each question; `choices` answers in order.
 * Returns every line said, once each.
 */
export async function interact(
  env: Harness,
  hotspot: Hotspot,
  choice?: string | readonly string[],
): Promise<string[]> {
  const said: string[] = [];
  const answers = typeof choice === 'string' || choice === undefined ? null : [...choice];
  let finished = false;
  const done = Promise.resolve(hotspot.onInteract(env.api)).then(() => {
    finished = true;
  });
  for (let guard = 0; !finished && guard < 900; guard += 1) {
    await new Promise((resolve) => setTimeout(resolve, 0));
    env.tick(100);
    const d = env.api.store.getState().dialogue;
    if (d) {
      said.push(...d.lines);
      const pick = answers ? answers.shift() : typeof choice === 'string' ? choice : undefined;
      env.api.store.advance(d.choices.length > 0 ? pick ?? d.choices[0].id : undefined);
    }
  }
  await done;
  return [...new Set(said)];
}
