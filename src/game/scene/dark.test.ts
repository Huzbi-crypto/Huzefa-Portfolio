import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { projects } from '@/data/projects';
import { SPRITES } from '@/game/art';
import { copy } from '@/game/content/copy';
import { createStore } from '@/game/state/store';
import { findPath, TILE } from '@/game/world/grid';
import type { Input } from '@/game/core/input';
import { createDarkScene, darkLights, LANTERN_RADIUS } from './dark';
import { navMap } from './nav';
import type { GameApi, Hotspot, SceneCtx } from './types';
import { createEntity, type Facing } from '@/game/world/entity';

/**
 * The scene draws every sprite through drawSprite. Recording those calls,
 * plus the canvas blits used to keep the visitor in front of the glow, gives
 * the exact paint order without needing a real rasteriser in Node.
 */
const recorder = vi.hoisted(() => ({
  events: [] as Array<
    | { kind: 'sprite'; sprite: { w: number; h: number }; x: number; y: number }
    | { kind: 'image'; source: { width: number; height: number }; args: number[] }
    | { kind: 'fill'; x: number; y: number; w: number; h: number; color: string }
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

type RecordedEvent = (typeof recorder.events)[number];

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
    fillRect: (x, y, w, h) => {
      recorder.events.push({
        kind: 'fill',
        x,
        y,
        w,
        h,
        color: String(context.fillStyle),
      });
    },
    drawImage: (source, ...args) => {
      recorder.events.push({ kind: 'image', source, args });
    },
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

function setup() {
  const store = createStore(null);
  const scene = createDarkScene(store);
  const api: GameApi = {
    store,
    goTo: vi.fn(),
    openTerminal: vi.fn(),
    showProject: vi.fn(async () => undefined),
  };
  return { store, scene, api };
}

async function interact(hotspot: Hotspot, api: GameApi, choice?: string): Promise<string[]> {
  const said: string[] = [];
  let finished = false;
  const done = Promise.resolve(hotspot.onInteract(api)).then(() => {
    finished = true;
  });
  for (let guard = 0; !finished && guard < 200; guard += 1) {
    await new Promise((resolve) => setTimeout(resolve, 0));
    const d = api.store.getState().dialogue;
    if (d) {
      said.push(...d.lines);
      api.store.advance(choice);
    }
  }
  await done;
  return [...new Set(said)];
}

const byId = (scene: ReturnType<typeof setup>['scene'], id: string): Hotspot => {
  const found = scene.hotspots.find((h) => h.id === id);
  if (!found) throw new Error(`no hotspot ${id}`);
  return found;
};

describe('dark layout', () => {
  it('map_matches_world_size', () => {
    const { scene } = setup();
    expect(scene.map.w * TILE).toBe(scene.worldW);
    expect(scene.map.h * TILE).toBe(scene.worldH);
  });

  it('spawn_not_solid_and_next_to_the_way_back', () => {
    const { scene } = setup();
    expect(scene.map.solid[scene.spawn.y * scene.map.w + scene.spawn.x]).toBe(0);
    const exit = byId(scene, 'exit');
    expect(Math.abs(scene.spawn.x - exit.stand.x) + Math.abs(scene.spawn.y - exit.stand.y)).toBeLessThanOrEqual(2);
  });

  it('has_the_first_dark_space_and_nothing_from_phase_two', () => {
    const { scene } = setup();
    expect(scene.hotspots.map((h) => h.id).sort()).toEqual(
      ['arch', 'cat', 'exit', 'eye', 'note-one', 'note-two', 'routing-sim'],
    );
  });

  it('all_dark_hotspots_reachable', () => {
    const { scene } = setup();
    const nav = navMap(scene.map);
    for (const h of scene.hotspots) {
      expect(nav.solid[h.stand.y * nav.w + h.stand.x], `${h.id} stand is blocked`).toBe(0);
      const path = findPath(nav, scene.spawn, h.stand);
      const last = path[path.length - 1] ?? scene.spawn;
      expect(last, h.id).toEqual(h.stand);
    }
  });

  it('every_stand_is_close_enough_to_use_its_hotspot', () => {
    const { scene } = setup();
    for (const h of scene.hotspots) {
      const px = h.stand.x * TILE + TILE / 2;
      const py = h.stand.y * TILE + TILE / 2;
      const dx = Math.max(h.rect.x - px, 0, px - (h.rect.x + h.rect.w));
      const dy = Math.max(h.rect.y - py, 0, py - (h.rect.y + h.rect.h));
      expect(Math.hypot(dx, dy), h.id).toBeLessThanOrEqual(14);
    }
  });
});

describe('dark hotspots', () => {
  it('exit_hotspot_returns_to_room', async () => {
    const { scene, api } = setup();
    await interact(byId(scene, 'exit'), api, 'back');
    expect(api.goTo).toHaveBeenCalledWith('room');
  });

  it('exit_hotspot_can_be_declined_and_nothing_happens', async () => {
    const { scene, api } = setup();
    await interact(byId(scene, 'exit'), api, 'stay');
    expect(api.goTo).not.toHaveBeenCalled();
  });

  it('routing_board_shows_real_project_details_and_awards_its_star', async () => {
    const { scene, api, store } = setup();
    const project = projects.find((p) => p.id === 'routing-sim')!;
    const said = await interact(byId(scene, 'routing-sim'), api);
    const text = said.join('\n');
    expect(text).toContain(project.title);
    expect(text).toContain(project.tagline);
    expect(text).toContain(project.githubUrl!.replace('https://', ''));
    expect(store.getState().found).toContain('project:routing-sim');
  });

  it('routing_board_star_is_awarded_only_once', async () => {
    const { scene, api, store } = setup();
    await interact(byId(scene, 'routing-sim'), api);
    const once = store.getState().found.length;
    const again = await interact(byId(scene, 'routing-sim'), api);
    expect(store.getState().found.length).toBe(once);
    expect(again.join(' ')).toContain(copy.dark.routing.again);
  });

  it('notes_continue_the_story_and_can_be_reread', async () => {
    const { scene, api } = setup();
    const first = await interact(byId(scene, 'note-one'), api);
    expect(first.join(' ')).toContain('Sorry about the dark');
    const again = await interact(byId(scene, 'note-one'), api);
    expect(again.join(' ')).toContain(copy.dark.noteOne.again[0]);
  });

  it('the_eye_and_the_arch_and_the_cat_all_talk', async () => {
    const { scene, api } = setup();
    for (const id of ['eye', 'arch', 'cat']) {
      const said = await interact(byId(scene, id), api);
      expect(said.length, id).toBeGreaterThan(0);
    }
  });
});

function ctxFor(over: Partial<SceneCtx> & { mode?: Input['mode']; pointer?: Input['pointer'] }): SceneCtx {
  const player = createEntity(100, 120);
  const input: Input = {
    move: { x: 0, y: 0 },
    pointer: over.pointer ?? null,
    mode: over.mode ?? 'keyboard',
    drain: () => [],
    dispose: () => undefined,
  };
  return {
    t: 0,
    player,
    input,
    camera: { x: 10, y: 4 },
    viewW: 342,
    viewH: 192,
    scale: 4,
    drag: null,
    reducedMotion: false,
    found: [],
    ...over,
  };
}

describe('the lantern', () => {
  it('keyboard_keeps_the_light_on_the_player', () => {
    const ctx = ctxFor({ mode: 'keyboard' });
    const lantern = darkLights(ctx)[0];
    expect(lantern.x).toBe(ctx.player.x);
    expect(Math.abs(lantern.y - ctx.player.y)).toBeLessThanOrEqual(14);
    expect(lantern.tint).toBe('warm');
  });

  it('mouse_makes_the_cursor_the_light_in_world_pixels', () => {
    const ctx = ctxFor({ mode: 'mouse', pointer: { x: 400, y: 200 } });
    const lantern = darkLights(ctx)[0];
    expect(lantern.x).toBe(400 / 4 + 10);
    expect(lantern.y).toBe(200 / 4 + 4);
  });

  it('touch_uses_the_last_drag_then_the_player', () => {
    const dragged = darkLights(ctxFor({ mode: 'touch', drag: { x: 80, y: 40 } }))[0];
    expect(dragged.x).toBe(80 / 4 + 10);
    const resting = ctxFor({ mode: 'touch', drag: null });
    expect(darkLights(resting)[0].x).toBe(resting.player.x);
  });

  it('lantern_is_on_whole_pixels', () => {
    const lantern = darkLights(ctxFor({ mode: 'mouse', pointer: { x: 401, y: 203 } }))[0];
    expect(Number.isInteger(lantern.x) && Number.isInteger(lantern.y)).toBe(true);
  });

  it('flickers_gently_and_never_by_more_than_a_pixel_or_two', () => {
    const radii = new Set<number>();
    for (let t = 0; t < 4000; t += 50) {
      radii.add(darkLights(ctxFor({ t }))[0].radius);
    }
    expect(radii.size).toBeGreaterThan(1);
    for (const r of radii) expect(Math.abs(r - LANTERN_RADIUS)).toBeLessThanOrEqual(2);
  });

  it('reduced_motion_holds_the_flame_steady', () => {
    const radii = new Set<number>();
    for (let t = 0; t < 4000; t += 50) {
      radii.add(darkLights(ctxFor({ t, reducedMotion: true }))[0].radius);
    }
    expect(radii.size).toBe(1);
  });

  it('the_monitor_and_the_doorway_glow_by_themselves', () => {
    const lights = darkLights(ctxFor({ mode: 'keyboard' }));
    expect(lights.length).toBeGreaterThanOrEqual(3);
    expect(lights.some((l) => l.tint === 'cool')).toBe(true);
  });
});

function drawDarkAt(x: number, y: number, facing: Facing = 'up', t = 0): RecordedEvent[] {
  recorder.events.length = 0;
  const scene = createDarkScene(createStore(null));
  const player = createEntity(x, y);
  player.facing = facing;
  const ctx = ctxFor({ player, t });
  const canvas = fakeCanvas();
  scene.draw(canvas.getContext() as unknown as CanvasRenderingContext2D, ctx);
  return [...recorder.events];
}

function spriteIndex(events: RecordedEvent[], sprite: { w: number; h: number }): number {
  return events.findIndex((event) => event.kind === 'sprite' && event.sprite === sprite);
}

/** The blit of the lit visitor pixels back over any glow that is behind it. */
function visitorRestoreIndex(events: RecordedEvent[]): number {
  return events.findIndex(
    (event) => event.kind === 'image' && event.source.width === 16 && event.source.height === 24,
  );
}

function fillIndex(
  events: RecordedEvent[],
  x: number,
  y: number,
  w = 1,
  h = 1,
): number {
  return events.findIndex(
    (event) => event.kind === 'fill' && event.x === x && event.y === y && event.w === w && event.h === h,
  );
}

describe('the dark paints the visitor in front of the things that glow', () => {
  it('the_visitor_is_drawn_after_the_doorway_glow_when_standing_below_it', () => {
    const events = drawDarkAt(36, 52, 'up');
    const glow = spriteIndex(events, SPRITES.darkExitGlow);
    const restore = visitorRestoreIndex(events);

    expect(glow).toBeGreaterThanOrEqual(0);
    expect(restore).toBeGreaterThanOrEqual(0);
    expect(restore, 'the visitor must be painted after the doorway glow').toBeGreaterThan(glow);
    expect(spriteIndex(events, SPRITES['visitor-up-0'])).toBeLessThan(glow);
  });

  it('the_monitor_eye_stays_behind_the_visitor_in_front_of_the_monitor', () => {
    const events = drawDarkAt(156, 60, 'down', 1000);
    const eye = spriteIndex(events, SPRITES.darkEyeCenter);
    const restore = visitorRestoreIndex(events);

    expect(eye).toBeGreaterThanOrEqual(0);
    expect(restore).toBeGreaterThan(eye);
  });

  it('the_broken_link_and_packet_stay_behind_the_visitor_in_front_of_the_board', () => {
    const events = drawDarkAt(236, 140, 'down');
    const packet = fillIndex(events, 231, 100, 2, 2);
    const brokenLink = fillIndex(events, 243, 104);
    const restore = visitorRestoreIndex(events);

    expect(packet).toBeGreaterThanOrEqual(0);
    expect(brokenLink).toBeGreaterThanOrEqual(0);
    expect(restore).toBeGreaterThan(packet);
    expect(restore).toBeGreaterThan(brokenLink);
  });

  it('the_cat_eyes_stay_behind_the_visitor_in_front_of_the_cat', () => {
    const events = drawDarkAt(36, 148, 'up', 1000);
    const eyes = fillIndex(events, 42, 140);
    const restore = visitorRestoreIndex(events);

    expect(eyes).toBeGreaterThanOrEqual(0);
    expect(restore).toBeGreaterThan(eyes);
  });

  it('the_visitor_still_passes_behind_the_routing_board_from_above', () => {
    const events = drawDarkAt(236, 108, 'down');
    expect(spriteIndex(events, SPRITES['visitor-down-0'])).toBeLessThan(
      spriteIndex(events, SPRITES.darkRouter),
    );
  });

  it('the_broken_link_and_cat_eyes_show_when_the_visitor_stands_behind_them', () => {
    const behindBoard = drawDarkAt(220, 124, 'down');
    expect(fillIndex(behindBoard, 243, 104)).toBeGreaterThan(visitorRestoreIndex(behindBoard));

    const behindCat = drawDarkAt(36, 140, 'up', 1000);
    expect(fillIndex(behindCat, 42, 140)).toBeGreaterThan(visitorRestoreIndex(behindCat));
  });
});
