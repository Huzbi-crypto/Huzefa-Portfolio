import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { SPRITES } from '@/game/art';
import type { Input } from '@/game/core/input';
import { createStore } from '@/game/state/store';
import { createEntity } from '@/game/world/entity';
import { createObservatory } from './observatory';
import type { SceneCtx } from './types';

/**
 * Record the paint order without a rasteriser: sprite draws, the visitor blit
 * and the plaque's engraved pixels are enough to see who is in front.
 */
const recorder = vi.hoisted(() => ({
  events: [] as Array<
    | { kind: 'sprite'; sprite: { w: number; h: number }; x: number; y: number }
    | { kind: 'image'; source: { width: number; height: number } }
    | { kind: 'fill'; x: number; y: number; w: number; h: number }
  >,
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
      recorder.events.push({ kind: 'sprite', sprite, x, y });
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
    fillRect: (x: number, y: number, w: number, h: number) => {
      recorder.events.push({ kind: 'fill', x, y, w, h });
    },
    drawImage: (source: { width: number; height: number }) => {
      recorder.events.push({ kind: 'image', source });
    },
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

function drawAt(x: number, y: number): (typeof recorder.events)[number][] {
  recorder.events.length = 0;
  const scene = createObservatory(createStore(null));
  const ctx: SceneCtx = {
    t: 0,
    player: createEntity(x, y),
    input,
    camera: { x: 0, y: 0 },
    viewW: 384,
    viewH: 224,
    scale: 1,
    drag: null,
    reducedMotion: false,
    found: [],
  };
  scene.draw(fakeCanvas().getContext() as unknown as CanvasRenderingContext2D, ctx);
  return [...recorder.events];
}

function spriteIndex(
  events: (typeof recorder.events)[number][],
  sprite: { w: number; h: number },
): number {
  return events.findIndex((event) => event.kind === 'sprite' && event.sprite === sprite);
}

/** The blit that puts the already-lit visitor back over the glow behind it. */
function visitorBlitIndex(events: (typeof recorder.events)[number][]): number {
  return events.findIndex(
    (event) => event.kind === 'image' && event.source.width === 16 && event.source.height === 24,
  );
}

function fillIndex(
  events: (typeof recorder.events)[number][],
  x: number,
  y: number,
): number {
  return events.findIndex(
    (event) => event.kind === 'fill' && event.x === x && event.y === y && event.w === 1 && event.h === 1,
  );
}

describe('the observatory paints the whole moon door', () => {
  it('the_moon_door_is_painted_after_the_sky_so_its_arch_is_not_cut_off', () => {
    const events = drawAt(14 * 8 + 4, 15 * 8 + 4);
    const sky = events.findIndex(
      (event) => event.kind === 'fill' && event.x === 0 && event.y === 0 && event.w === 384 && event.h === 56,
    );
    const door = spriteIndex(events, SPRITES.obsNapDoor);

    expect(sky, 'the sky pass must run').toBeGreaterThanOrEqual(0);
    expect(door).toBeGreaterThanOrEqual(0);
    expect(door, 'the moon door must be painted over the sky').toBeGreaterThan(sky);
  });

  it('the_visitor_in_front_of_the_moon_door_is_painted_after_it', () => {
    // The nap-door stand, just below the door's foot line.
    const events = drawAt(41 * 8 + 4, 9 * 8 + 4);
    const door = spriteIndex(events, SPRITES.obsNapDoor);
    const blit = visitorBlitIndex(events);

    expect(door).toBeGreaterThanOrEqual(0);
    expect(blit).toBeGreaterThanOrEqual(0);
    expect(blit).toBeGreaterThan(door);
  });
});

describe('the observatory paints the visitor in front of the plaque', () => {
  // The stats-plaque stand: the visitor's feet are below the plaque's base.
  const STAND = { x: 14 * 8 + 4, y: 15 * 8 + 4 };

  it('the_visitor_is_drawn_after_the_plaque_from_its_own_stand', () => {
    const events = drawAt(STAND.x, STAND.y);
    const plaque = spriteIndex(events, SPRITES.obsPlaque);
    const visitor = spriteIndex(events, SPRITES['visitor-down-0']);

    expect(plaque).toBeGreaterThanOrEqual(0);
    expect(visitor).toBeGreaterThanOrEqual(0);
    expect(visitor, 'the visitor must be painted after the plaque').toBeGreaterThan(plaque);
  });

  it('the_engraved_digits_also_stay_behind_the_visitor_from_the_stand', () => {
    const events = drawAt(STAND.x, STAND.y);
    // First pixel of the first digit ("3" in "38"), in plaque space (27, 8).
    const digits = fillIndex(events, 80 + 27, 84 + 8);
    const blit = visitorBlitIndex(events);

    expect(digits).toBeGreaterThanOrEqual(0);
    expect(blit).toBeGreaterThanOrEqual(0);
    expect(digits, 'the glow pass must paint the digits before the visitor').toBeLessThan(blit);
  });

  it('the_visitor_still_passes_behind_the_plaque_from_above', () => {
    const events = drawAt(STAND.x, 100);
    const plaque = spriteIndex(events, SPRITES.obsPlaque);
    const visitor = spriteIndex(events, SPRITES['visitor-down-0']);

    expect(visitor).toBeGreaterThanOrEqual(0);
    expect(plaque, 'walking behind the plaque must hide the visitor').toBeGreaterThan(visitor);
  });

  it('the_visitors_head_is_not_painted_over_when_they_stand_below', () => {
    const below = drawAt(STAND.x, STAND.y);
    const above = drawAt(STAND.x, 100);
    const belowBlit = visitorBlitIndex(below);
    const aboveBlit = visitorBlitIndex(above);
    const belowDigits = fillIndex(below, 80 + 27, 84 + 8);
    const aboveDigits = fillIndex(above, 80 + 27, 84 + 8);

    // Below the foot line the visitor is painted over the digits; above it the
    // digits are part of the plaque in front of the visitor.
    expect(belowDigits).toBeLessThan(belowBlit);
    expect(aboveDigits).toBeGreaterThan(aboveBlit);
  });
});
