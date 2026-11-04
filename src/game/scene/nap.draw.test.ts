import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { SPRITES } from '@/game/art';
import type { Input } from '@/game/core/input';
import { createStore } from '@/game/state/store';
import { createEntity } from '@/game/world/entity';
import { createNap, RETURN_DOOR_AT } from './nap';
import type { SceneCtx } from './types';

const recorder = vi.hoisted(() => ({
  events: [] as Array<{ sprite: { w: number; h: number }; x: number; y: number }>,
}));

vi.mock('@/game/render/sprite', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/game/render/sprite')>();
  return {
    ...actual,
    drawSprite: (
      _ctx: unknown,
      sprite: { w: number; h: number },
      x: number,
      y: number,
    ) => {
      recorder.events.push({ sprite, x, y });
    },
  };
});

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
  context = {
    canvas,
    imageSmoothingEnabled: false,
    globalCompositeOperation: 'source-over',
    fillStyle: '#000000',
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

const input: Input = {
  move: { x: 0, y: 0 },
  pointer: null,
  mode: 'keyboard',
  drain: () => [],
  dispose: () => undefined,
};

describe('the nap room door', () => {
  it('draws_the_observatory_moon_door_at_the_exit', () => {
    recorder.events.length = 0;
    const scene = createNap(createStore(null));
    const ctx: SceneCtx = {
      t: 0,
      player: createEntity(3 * 8 + 4, 6 * 8 + 4),
      input,
      camera: { x: 0, y: 0 },
      viewW: 336,
      viewH: 192,
      scale: 1,
      drag: null,
      reducedMotion: false,
      found: [],
    };

    scene.draw(fakeCanvas().getContext() as unknown as CanvasRenderingContext2D, ctx);

    const door = recorder.events.find(
      (event) =>
        event.sprite === SPRITES.obsNapDoor &&
        event.x === RETURN_DOOR_AT.x &&
        event.y === RETURN_DOOR_AT.y,
    );
    expect(door, 'the return door is never drawn').toBeDefined();
  });
});
