import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { PALETTES, SPRITES } from '@/game/art';
import { copy } from '@/game/content/copy';
import { projectStarId } from '@/game/content/stars';
import type { Input } from '@/game/core/input';
import { createStore, type GameStore } from '@/game/state/store';
import { createEntity } from '@/game/world/entity';
import { findPath, TILE } from '@/game/world/grid';
import { createLantern } from '@/game/exhibits/archiveKit';
import { ASCII_REACH, litAsciiCells } from '@/game/exhibits/asciiArt';
import { CALL_REACH, createCreativeCoding } from '@/game/exhibits/creativeCoding';
import { createRenderer3d, shapePixels } from '@/game/exhibits/renderer3d';
import { createReadCookies } from '@/game/exhibits/readCookies';
import {
  closeTermPrompt,
  createTermExp,
  submitTermPrompt,
  termPromptState,
} from '@/game/exhibits/termExp';
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

/** The archive's exhibits by project id, with the choices a visitor makes to try each one. */
const PICKS: Record<string, string[]> = {
  'term-exp': ['ls'],
  'read-cookies': ['unlock'],
  'ascii-art-tui': [],
  'creative-coding': [],
  '3d-renderer': ['left', 'right'],
};
const EXHIBITS = Object.keys(PICKS);

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
 * is always the way out). Plain lines are clicked through. The terminal's DOM
 * prompt is driven the same way: submit the picked command, then close it.
 */
async function play(store: GameStore, run: Promise<void>, picks: string[] = []): Promise<void> {
  let finished = false;
  void run.then(() => {
    finished = true;
  });
  for (let guard = 0; !finished && guard < 400; guard += 1) {
    await tick();
    const prompt = termPromptState();
    if (prompt) {
      const pick = picks.shift();
      const choice = pick ? prompt.choices.find((item) => item.id === pick) : undefined;
      if (choice?.line) {
        submitTermPrompt(choice.line);
      } else {
        closeTermPrompt();
      }
      continue;
    }
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

  it('every_exhibit_declares_tight_pointer_targets_inside_its_bounds', () => {
    const scene = createArchive(createStore(null));
    for (const id of EXHIBITS) {
      const h = hotspot(scene, id);
      expect(h.hitRects, `${id} has no hitRects`).toBeDefined();
      expect(h.hitRects!.length, `${id} has no pointer target`).toBeGreaterThan(0);
      for (const rect of h.hitRects!) {
        expect(rect.x, id).toBeGreaterThanOrEqual(h.rect.x);
        expect(rect.y, id).toBeGreaterThanOrEqual(h.rect.y);
        expect(rect.x + rect.w, id).toBeLessThanOrEqual(h.rect.x + h.rect.w);
        expect(rect.y + rect.h, id).toBeLessThanOrEqual(h.rect.y + h.rect.h);
      }
    }
  });

  it('the_scrap_in_the_file_box_carries_the_archive_clue', async () => {
    const store = createStore(null);
    const scene = createArchive(store);
    const api = fakeApi(store);
    const run = Promise.resolve(hotspot(scene, 'clue:archive').onInteract(api)).then(() => undefined);
    await play(store, run);
    expect(store.hasClue('clue:archive')).toBe(true);
    expect(copy.clues.archive.lines[1]).toBeTruthy();
    expect(scene.hotspots.map((spot) => spot.id)).toContain('clue:archive');
  });

  it('each_exhibit_awards_its_star_when_tried', async () => {
    for (const id of EXHIBITS) {
      const store = createStore(null);
      const scene = createArchive(store);
      const api = fakeApi(store);
      expect(store.getState().found).not.toContain(projectStarId(id));

      await play(store, Promise.resolve(hotspot(scene, id).onInteract(api)), [...PICKS[id]]);

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

      await play(store, Promise.resolve(hotspot(scene, id).onInteract(api)), [...PICKS[id]]);
      // Still drawn and updated calmly with motion off.
      const g = fakeCanvas().getContext() as unknown as CanvasRenderingContext2D;
      scene.update(16, ctxFor({ reducedMotion: true }));
      scene.draw(g, ctxFor({ reducedMotion: true }));

      expect(store.getState().found, id).toContain(projectStarId(id));
    }
  });

  it('phone_can_use_terminal_with_on_screen_choices', async () => {
    // No key events anywhere: the visitor only taps what the prompt offers.
    const store = createStore(null);
    const api = fakeApi(store);
    const term = createTermExp({ x: 56, y: 92 });
    expect(term.shell().trying).toBe(false);

    const run = term.use(api);
    await tick();
    const offered = termPromptState()?.choices.map((choice) => choice.id) ?? [];
    expect(offered).toEqual(expect.arrayContaining(['help', 'ls', 'cat', 'whoami', 'leave']));

    submitTermPrompt('help');
    submitTermPrompt('cat secrets.txt');
    expect(termPromptState()?.history.map((entry) => entry.command)).toEqual([
      'help',
      'cat secrets.txt',
    ]);
    closeTermPrompt();
    await run;

    expect(term.shell().trying).toBe(true);
    expect(term.shell().history).toEqual(['help', 'cat secrets.txt']);
    expect(store.getState().found).toContain(projectStarId('term-exp'));
  });

  it('walking_away_from_the_jar_unopened_earns_nothing', async () => {
    const store = createStore(null);
    const api = fakeApi(store);
    const jar = createReadCookies({ x: 152, y: 72 });

    await play(store, jar.use(api), ['leave']);

    expect(jar.jar().unlocked).toBe(false);
    expect(store.getState().found).not.toContain(projectStarId('read-cookies'));
    expect(api.shown).toEqual([]);
  });

  it('eating_every_cookie_ends_cleanly_and_keeps_the_star', async () => {
    const store = createStore(null);
    const api = fakeApi(store);
    const jar = createReadCookies({ x: 152, y: 72 });
    const ids = jar.jar().cookies.map((cookie) => cookie.id);

    await play(store, jar.use(api), ['unlock', ...ids]);

    expect(jar.jar().cookies).toHaveLength(0);
    expect(store.getState().found).toContain(projectStarId('read-cookies'));
    expect(api.shown).toEqual(['read-cookies']);

    // Back again: an empty jar is still fine to open.
    await play(store, jar.use(api), []);
    expect(jar.jar().cookies).toHaveLength(0);
    expect(api.shown).toEqual(['read-cookies', 'read-cookies']);
  });

  it('ascii_converts_only_the_cells_the_light_touches', () => {
    const origin = { x: 240, y: 14 };
    expect(litAsciiCells(origin, { x: 400, y: 200 })).toEqual([]);

    const left = litAsciiCells(origin, { x: 242, y: 28 });
    const all = litAsciiCells(origin, { x: 256, y: 28 });
    expect(left.length).toBeGreaterThan(0);
    expect(all.length).toBeGreaterThan(left.length);
    for (const cell of left) {
      expect(Math.hypot(cell.x + 1.5 - 242, cell.y + 1.5 - 28)).toBeLessThanOrEqual(ASCII_REACH);
      expect(cell.x, 'no cell far from the light').toBeLessThan(260);
      expect(cell.ch).toHaveLength(1);
    }
    // Not the whole picture: the dark part stays a picture.
    expect(all.length).toBeLessThan(12 * 10);
  });

  it('a_keyboard_visitors_lantern_reaches_the_frame_too', () => {
    // Standing where the exhibit says to stand, with no pointer at all.
    const player = createEntity(32 * TILE + TILE / 2, 6 * TILE + TILE / 2);
    const lantern = createLantern()(ctxFor({ player }));

    expect(litAsciiCells({ x: 240, y: 14 }, lantern).length).toBeGreaterThan(0);
  });

  it('particles_follow_the_lantern_and_rest_when_motion_is_off', () => {
    const at = { x: 232, y: 96 };
    const mouseCtx = (
      pointer: { x: number; y: number },
      over: Partial<SceneCtx> = {},
    ): SceneCtx => {
      const base = ctxFor({ scale: 1, ...over });
      base.input = { ...base.input, mode: 'mouse', pointer };
      return base;
    };
    const near = { x: 262, y: 106 };
    const lantern = { x: 262 - (at.x + 4), y: 106 - (at.y + 3) }; // in the case's own space
    const meanDistance = (dust: ReturnType<typeof createCreativeCoding>): number => {
      const f = dust.field();
      let total = 0;
      for (let i = 0; i < f.n; i += 1) total += Math.hypot(f.x[i] - lantern.x, f.y[i] - lantern.y);
      return total / f.n;
    };

    const following = createCreativeCoding(at);
    const wandering = createCreativeCoding(at);
    const before = meanDistance(following);
    for (let i = 0; i < 120; i += 1) {
      following.update(16, mouseCtx(near));
      // The same case with the light kept far away only drifts.
      wandering.update(16, mouseCtx({ x: 20, y: 190 }));
    }
    expect(meanDistance(following)).toBeLessThan(before - 4);
    expect(meanDistance(following)).toBeLessThan(meanDistance(wandering) - 4);

    const still = createCreativeCoding(at);
    const frozen = Array.from(still.field().x);
    for (let i = 0; i < 30; i += 1) still.update(16, mouseCtx(near, { reducedMotion: true }));
    expect(Array.from(still.field().x)).toEqual(frozen);
    expect(CALL_REACH).toBeGreaterThan(40);
  });

  it('the_spin_choices_turn_the_shape_and_pixels_stay_whole_and_on_the_glass', async () => {
    const store = createStore(null);
    const api = fakeApi(store);
    const screen = createRenderer3d({ x: 304, y: 88 });
    const control = createRenderer3d({ x: 304, y: 88 });

    await play(store, screen.use(api), ['right']);
    for (let i = 0; i < 30; i += 1) screen.update(16, ctxFor());

    for (let i = 0; i < 30; i += 1) control.update(16, ctxFor());
    expect(screen.view().yaw - control.view().yaw, 'the nudge left it spun further').toBeGreaterThan(0.2);
    for (const [yaw, pitch, inner] of [[0, 0, 0.62], [1.2, 0.5, 1.28], [3, -1, 0.62]]) {
      const pixels = shapePixels(yaw, pitch, inner);
      expect(pixels.length).toBeGreaterThan(20);
      for (const p of pixels) {
        expect(Number.isInteger(p.x) && Number.isInteger(p.y)).toBe(true);
        expect(p.x >= 0 && p.x < 24 && p.y >= 0 && p.y < 20).toBe(true);
      }
    }
  });

  it('the_shape_holds_still_in_a_calm_pose_when_motion_is_off', () => {
    const screen = createRenderer3d({ x: 304, y: 88 });
    for (let i = 0; i < 20; i += 1) screen.update(16, ctxFor({ reducedMotion: true }));
    const first = screen.view();
    for (let i = 0; i < 20; i += 1) screen.update(16, ctxFor({ reducedMotion: true }));
    expect(screen.view()).toEqual(first);
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
