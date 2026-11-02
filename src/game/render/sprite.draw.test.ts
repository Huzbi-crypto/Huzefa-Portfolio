// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { decodeSprite, drawSprite } from './sprite';

describe('drawSprite', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('floors_coordinates_and_caches_the_offscreen_canvas', () => {
    const fillRects: Array<[number, number]> = [];
    const offscreen = {
      width: 0,
      height: 0,
      getContext: () => ({
        fillStyle: '',
        fillRect: (x: number, y: number) => fillRects.push([x, y]),
      }),
    };
    const createElement = vi
      .spyOn(document, 'createElement')
      .mockReturnValue(offscreen as unknown as HTMLElement);

    const ctx = {
      drawImage: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
    } as unknown as CanvasRenderingContext2D;

    const sprite = decodeSprite(['ab', '.b'], {
      a: '#111111',
      b: '#eeeeee',
    });

    drawSprite(ctx, sprite, 1.8, 2.9);
    drawSprite(ctx, sprite, 5, 6);

    expect(fillRects).toEqual([
      [0, 0],
      [1, 0],
      [1, 1],
    ]);
    expect(ctx.drawImage).toHaveBeenNthCalledWith(1, offscreen, 1, 2);
    expect(ctx.drawImage).toHaveBeenNthCalledWith(2, offscreen, 5, 6);
    expect(createElement).toHaveBeenCalledTimes(1);
  });

  it('flips_x_around_the_sprite_width', () => {
    const offscreen = {
      width: 0,
      height: 0,
      getContext: () => ({ fillStyle: '', fillRect: () => {} }),
    };
    vi.spyOn(document, 'createElement').mockReturnValue(
      offscreen as unknown as HTMLElement,
    );

    const ctx = {
      drawImage: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
    } as unknown as CanvasRenderingContext2D;

    const sprite = decodeSprite(['ab'], {
      a: '#111111',
      b: '#eeeeee',
    });

    drawSprite(ctx, sprite, 4, 9, { flipX: true });

    expect(ctx.save).toHaveBeenCalledOnce();
    expect(ctx.translate).toHaveBeenCalledWith(6, 9);
    expect(ctx.scale).toHaveBeenCalledWith(-1, 1);
    expect(ctx.drawImage).toHaveBeenCalledWith(offscreen, 0, 0);
    expect(ctx.restore).toHaveBeenCalledOnce();
  });
});
