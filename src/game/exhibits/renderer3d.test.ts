// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { VECTOR_SCREEN } from '@/game/art/sprites/archive';
import { createInput, type Input } from '@/game/core/input';
import { createEntity } from '@/game/world/entity';
import type { GameApi, SceneCtx } from '@/game/scene/types';
import { createStore } from '@/game/state/store';
import { createRenderer3d } from './renderer3d';

const AT = { x: 304, y: 88 };
const CAMERA = { x: 300, y: 80 };
const SCALE = 2;
const GLASS = {
  x: AT.x + VECTOR_SCREEN.x,
  y: AT.y + VECTOR_SCREEN.y,
  w: VECTOR_SCREEN.w,
  h: VECTOR_SCREEN.h,
};

const RECT = {
  left: 0,
  top: 0,
  right: 400,
  bottom: 300,
  width: 400,
  height: 300,
  x: 0,
  y: 0,
  toJSON: () => ({}),
} as DOMRect;

function setup(): { target: HTMLDivElement; input: Input } {
  document.body.innerHTML = '';
  const target = document.createElement('div');
  target.getBoundingClientRect = () => RECT;
  document.body.appendChild(target);
  return { target, input: createInput(target, { isBlocked: () => false }) };
}

function ctx(input: Input, over: Partial<SceneCtx> = {}): SceneCtx {
  return {
    t: 0,
    player: createEntity(320, 150),
    input,
    camera: CAMERA,
    viewW: 342,
    viewH: 192,
    scale: SCALE,
    drag: null,
    reducedMotion: true,
    found: [],
    ...over,
  };
}

/** CSS position of a world point under this test's camera. */
function css(wx: number, wy: number): { x: number; y: number } {
  return { x: (wx - CAMERA.x) * SCALE, y: (wy - CAMERA.y) * SCALE };
}

function dispatch(
  target: EventTarget,
  type: 'pointerdown' | 'pointermove' | 'pointerup',
  point: { x: number; y: number },
  pointerType: 'mouse' | 'touch' = 'mouse',
): void {
  target.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      clientX: point.x,
      clientY: point.y,
      pointerType,
    }),
  );
}

describe('3d-renderer dragging', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('drag_on_glass_changes_rotation', () => {
    const { target, input } = setup();
    const screen = createRenderer3d(AT);
    const glass = { x: GLASS.x + GLASS.w / 2, y: GLASS.y + GLASS.h / 2 };
    const start = css(glass.x, glass.y);

    dispatch(target, 'pointerdown', start);
    screen.update(16, ctx(input));
    expect(input.pointerDown).not.toBeNull();

    dispatch(target, 'pointermove', { x: start.x + 42, y: start.y + 22 });
    screen.update(16, ctx(input));

    const moved = screen.view();
    expect(moved.yaw).not.toBeCloseTo(0.7, 4);
    expect(moved.pitch).not.toBeCloseTo(0.45, 4);

    // Still calm: once the finger is gone the shape holds the angle it was left at.
    dispatch(target, 'pointerup', { x: start.x + 42, y: start.y + 22 });
    screen.update(16, ctx(input));
    const held = screen.view();
    for (let i = 0; i < 20; i += 1) screen.update(16, ctx(input));
    expect(screen.view()).toEqual(held);
  });

  it('drag_on_glass_does_not_walk', () => {
    const { target, input } = setup();
    const screen = createRenderer3d(AT);
    const glass = { x: GLASS.x + GLASS.w / 2, y: GLASS.y + GLASS.h / 2 };
    const start = css(glass.x, glass.y);

    dispatch(target, 'pointerdown', start);
    screen.update(16, ctx(input));
    dispatch(target, 'pointermove', { x: start.x + 30, y: start.y });
    screen.update(16, ctx(input));
    dispatch(target, 'pointerup', { x: start.x + 30, y: start.y });

    // The press that began on the glass was spent turning it, not walking.
    expect(input.drain()).toEqual([]);
    expect(input.pointerDown).toBeNull();
  });

  it('a_click_elsewhere_still_walks', () => {
    const { target, input } = setup();

    dispatch(target, 'pointerdown', { x: 12, y: 12 });
    dispatch(target, 'pointerup', { x: 12, y: 12 });

    expect(input.drain()).toEqual([{ type: 'tap', x: 12, y: 12 }]);
  });

  it('walking_away_without_spinning_earns_nothing', async () => {
    setup();
    const store = createStore(null);
    store.setReducedMotion(true);
    const api: GameApi = {
      store,
      goTo: vi.fn(),
      openTerminal: vi.fn(),
      showProject: vi.fn(async () => undefined),
    };
    const screen = createRenderer3d(AT);
    const run = screen.use(api);
    await new Promise((resolve) => setTimeout(resolve, 0));
    for (let guard = 0; store.getState().dialogue && guard < 100; guard += 1) {
      store.advance('leave');
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    await run;

    expect(store.getState().found).not.toContain('project:3d-renderer');
  });

  it('arrow_keys_turn_the_screen_while_its_dialogue_is_focused', async () => {
    const { input } = setup();
    const store = createStore(null);
    store.setReducedMotion(true);
    const api: GameApi = {
      store,
      goTo: vi.fn(),
      openTerminal: vi.fn(),
      showProject: vi.fn(async () => undefined),
    };
    const screen = createRenderer3d(AT);
    const run = screen.use(api);
    await new Promise((resolve) => setTimeout(resolve, 0));

    input.arrows = { x: 1, y: 0 };
    const before = screen.view();
    for (let i = 0; i < 10; i += 1) {
      screen.update(16, ctx(input, { reducedMotion: true }));
    }
    expect(screen.view().yaw).toBeGreaterThan(before.yaw);

    for (let guard = 0; guard < 100; guard += 1) {
      if (!store.getState().dialogue) break;
      store.advance('leave');
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    await run;
  });
});
