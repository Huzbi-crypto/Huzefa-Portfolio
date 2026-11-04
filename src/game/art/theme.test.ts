import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Sprite } from '@/game/render/sprite';

// The room draws through drawSprite; capture the exact sprite objects it hands
// to the canvas so the test proves what is drawn, not merely what is exported.
vi.mock('@/game/render/sprite', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/game/render/sprite')>();
  return { ...actual, drawSprite: vi.fn() };
});

import { drawSprite } from '@/game/render/sprite';
import type { SceneCtx } from '@/game/scene/types';
import { createRoomScene } from '@/game/scene/room';
import { createStore } from '@/game/state/store';
import { createEntity } from '@/game/world/entity';
import { ACTIVE_PALETTE, PALETTES, SPRITES, setGameTheme } from './index';

const drawn: Sprite[] = [];
vi.mocked(drawSprite).mockImplementation((_g, sprite) => {
  drawn.push(sprite);
});

function sceneCtx(): SceneCtx {
  return {
    t: 0,
    player: createEntity(21 * 8, 7 * 8),
    input: {} as SceneCtx['input'],
    camera: { x: 0, y: 0 },
    viewW: 320,
    viewH: 192,
    scale: 2,
    drag: null,
    reducedMotion: true,
    found: [],
  };
}

function drawRoom(): Sprite[] {
  drawn.length = 0;
  const scene = createRoomScene(createStore(null));
  const g = { fillStyle: '' } as unknown as CanvasRenderingContext2D;
  scene.draw(g, sceneCtx());
  return [...drawn];
}

afterEach(() => {
  setGameTheme('cozy-crt');
});

describe('canvas theme switching', () => {
  it('theme_change_changes_what_the_canvas_draws_without_reload', () => {
    const cozy = drawRoom();
    expect(cozy.length).toBeGreaterThan(0);
    const firstCozy = cozy[0];

    setGameTheme('warm-apartment');

    const warm = drawRoom();
    expect(warm.length).toBe(cozy.length);
    // Every sprite handed to the canvas is a freshly decoded warm one.
    expect(warm.some((sprite) => sprite === firstCozy)).toBe(false);
    expect(SPRITES.floor).not.toBe(undefined);
    expect(ACTIVE_PALETTE.c).toBe(PALETTES['warm-apartment'].c);

    const warmColours = new Set(Object.values(PALETTES['warm-apartment']));
    for (const sprite of warm) {
      for (const pixel of sprite.pixels) {
        if (pixel !== null) expect(warmColours.has(pixel)).toBe(true);
      }
    }
  });

  it('switching_back_restores_the_cozy_canvas', () => {
    const cozy = drawRoom();
    const cozyColours = new Set(Object.values(PALETTES['cozy-crt']));

    setGameTheme('moonlit-terminal');
    drawRoom();
    setGameTheme('cozy-crt');

    const restored = drawRoom();
    expect(restored.length).toBe(cozy.length);
    expect(ACTIVE_PALETTE.a).toBe(PALETTES['cozy-crt'].a);
    for (const sprite of restored) {
      for (const pixel of sprite.pixels) {
        if (pixel !== null) expect(cozyColours.has(pixel)).toBe(true);
      }
    }
  });
});
