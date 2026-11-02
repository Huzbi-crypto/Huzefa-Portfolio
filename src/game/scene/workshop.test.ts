import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { PALETTES } from '@/game/art';
import { projects } from '@/data/projects';
import { copy } from '@/game/content/copy';
import { projectStarId } from '@/game/content/stars';
import type { Input } from '@/game/core/input';
import { createStore } from '@/game/state/store';
import { createEntity } from '@/game/world/entity';
import { findPath, TILE } from '@/game/world/grid';
import { navMap } from './nav';
import { createWorkshop } from './workshop';
import type { GameApi, Hotspot, SceneCtx } from './types';

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

const input: Input = {
  move: { x: 0, y: 0 },
  pointer: null,
  mode: 'keyboard',
  drain: () => [],
  dispose: () => undefined,
};

function ctxFor(scene: ReturnType<typeof createWorkshop>, t: number, reducedMotion: boolean): SceneCtx {
  const player = createEntity(scene.spawn.x * TILE + 8, scene.spawn.y * TILE + 16);
  return {
    t,
    player,
    input,
    camera: { x: 0, y: 0 },
    viewW: 240,
    viewH: 135,
    scale: 4,
    drag: null,
    reducedMotion,
    found: [],
  };
}

function setup(reducedMotion = false) {
  const store = createStore(null);
  const scene = createWorkshop(store);
  const api: GameApi = {
    store,
    goTo: vi.fn(),
    openTerminal: vi.fn(),
    showProject: vi.fn(async () => undefined),
  };
  let t = 0;
  const ctx = (): SceneCtx => ctxFor(scene, t, reducedMotion);
  /** Run the scene's clock forward, as the game loop would. */
  const tick = (ms: number): void => {
    t += ms;
    scene.update(ms, ctx());
  };
  return { store, scene, api, ctx, tick };
}

/** Use a hotspot, stepping the scene clock and dismissing every dialogue until it finishes. */
async function interact(
  env: ReturnType<typeof setup>,
  hotspot: Hotspot,
  choice?: string,
): Promise<string[]> {
  const said: string[] = [];
  let finished = false;
  const done = Promise.resolve(hotspot.onInteract(env.api)).then(() => {
    finished = true;
  });
  for (let guard = 0; !finished && guard < 600; guard += 1) {
    await new Promise((resolve) => setTimeout(resolve, 0));
    env.tick(100);
    const d = env.api.store.getState().dialogue;
    if (d) {
      said.push(...d.lines);
      env.api.store.advance(choice);
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

describe('workshop layout', () => {
  it('map_matches_world_size', () => {
    const { scene } = setup();
    expect(scene.id).toBe('workshop');
    expect(scene.map.w * TILE).toBe(scene.worldW);
    expect(scene.map.h * TILE).toBe(scene.worldH);
  });

  it('arrival_from_the_hall_is_free_ground_beside_the_way_back', () => {
    const { scene } = setup();
    const at = scene.entries?.fromHall;
    expect(at).toBeDefined();
    expect(scene.map.solid[at!.y * scene.map.w + at!.x]).toBe(0);
    const exit = byId(scene, 'exit');
    expect(Math.abs(at!.x - exit.stand.x) + Math.abs(at!.y - exit.stand.y)).toBeLessThanOrEqual(2);
  });

  it('all_stands_reachable', () => {
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

  it('the_ladder_leads_back_to_the_hall_at_its_own_door', async () => {
    const env = setup();
    await interact(env, byId(env.scene, 'exit'), 'back');
    expect(env.api.goTo).toHaveBeenCalledWith('dark', 'fromWorkshop');
  });

  it('the_ladder_can_be_declined_so_nobody_is_pushed_out', async () => {
    const env = setup();
    await interact(env, byId(env.scene, 'exit'), 'stay');
    expect(env.api.goTo).not.toHaveBeenCalled();
  });
});

describe('workshop art', () => {
  it('art_uses_palette_only', () => {
    const { scene, ctx } = setup();
    painted.colors.clear();
    scene.draw(fakeCanvas().getContext() as unknown as CanvasRenderingContext2D, ctx());
    const allowed = new Set(Object.values(PALETTES['cozy-crt']).map((c) => c.toLowerCase()));
    allowed.add('#000000');
    for (const color of painted.colors) expect(allowed.has(color), color).toBe(true);
  });
});

/** The four exhibits the workshop holds, and a choice that makes each one play. */
const EXHIBITS: { id: string; choice?: string }[] = [{ id: 'ai-anime' }];

describe('workshop exhibits', () => {
  it('holds_exactly_its_exhibits_and_the_way_home', () => {
    const { scene } = setup();
    expect(scene.hotspots.map((h) => h.id).sort()).toEqual(
      ['exit', ...EXHIBITS.map((e) => e.id)].sort(),
    );
  });

  it.each(EXHIBITS)('each_exhibit_awards_its_star_when_tried: $id', async ({ id, choice }) => {
    const env = setup();
    await interact(env, byId(env.scene, id), choice);
    expect(env.store.getState().found).toContain(projectStarId(id));
    expect(env.api.showProject).toHaveBeenCalledWith(id);
  });

  it.each(EXHIBITS)('reduced_motion_exhibit_still_awards: $id', async ({ id, choice }) => {
    const env = setup(true);
    env.tick(16);
    let finished = false;
    const run = Promise.resolve(byId(env.scene, id).onInteract(env.api)).then(() => {
      finished = true;
    });
    // No more clock ticks: a calm visitor's exhibit must not wait on animation.
    for (let guard = 0; !finished && guard < 200; guard += 1) {
      await new Promise((resolve) => setTimeout(resolve, 0));
      if (env.api.store.getState().dialogue) env.api.store.advance(choice);
    }
    await run;
    expect(finished).toBe(true);
    expect(env.store.getState().found).toContain(projectStarId(id));
  });

  it.each(EXHIBITS)('the_star_is_awarded_once_however_often_it_is_tried: $id', async ({ id, choice }) => {
    const env = setup();
    await interact(env, byId(env.scene, id), choice);
    const once = env.store.getState().found.length;
    await interact(env, byId(env.scene, id), choice);
    expect(env.store.getState().found.length).toBe(once);
    expect(env.api.showProject).toHaveBeenCalledTimes(2);
  });

  it.each(EXHIBITS)('every_exhibit_belongs_to_a_real_project: $id', ({ id }) => {
    expect(projects.some((p) => p.id === id)).toBe(true);
  });
});

describe('ai-anime machine', () => {
  it('says_what_the_machine_got_wrong_in_huzbis_words', async () => {
    const env = setup();
    const said = (await interact(env, byId(env.scene, 'ai-anime'))).join(' ');
    const flaws = Object.values(copy.workshop.aiAnime.flaws);
    expect(flaws.some((line) => said.includes(line))).toBe(true);
  });

  it('pulling_again_does_not_double_open_the_panel_when_interrupted', async () => {
    const env = setup();
    const hotspot = byId(env.scene, 'ai-anime');
    const first = Promise.resolve(hotspot.onInteract(env.api));
    const second = interact(env, hotspot);
    await second;
    await first;
    expect(env.api.showProject).toHaveBeenCalledTimes(1);
  });
});
