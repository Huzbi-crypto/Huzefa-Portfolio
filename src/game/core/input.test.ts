// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { createInput } from './input';

function setup(blocked = false) {
  document.body.innerHTML = '';
  const target = document.createElement('div');
  document.body.appendChild(target);
  const input = createInput(target, { isBlocked: () => blocked });
  return { target, input };
}

function press(
  target: EventTarget,
  type: 'keydown' | 'keyup',
  key: string,
): KeyboardEvent {
  const event = new KeyboardEvent(type, {
    key,
    bubbles: true,
    cancelable: true,
  });
  target.dispatchEvent(event);
  return event;
}

function pointer(
  target: EventTarget,
  type: 'pointerdown' | 'pointermove' | 'pointerup' | 'pointerout' | 'pointerleave',
  init: PointerEventInit = {},
): PointerEvent {
  const event = new PointerEvent(type, { bubbles: true, ...init });
  target.dispatchEvent(event);
  return event;
}

const RECT = {
  left: 10,
  top: 20,
  right: 210,
  bottom: 220,
  width: 200,
  height: 200,
  x: 10,
  y: 20,
  toJSON: () => ({}),
} as DOMRect;

describe('createInput', () => {
  it('arrows_and_wasd_set_move', () => {
    const { target, input } = setup();

    press(target, 'keydown', 'ArrowLeft');
    expect(input.move).toEqual({ x: -1, y: 0 });

    press(target, 'keydown', 'ArrowUp');
    expect(input.move).toEqual({ x: -1, y: -1 });

    press(target, 'keyup', 'ArrowLeft');
    expect(input.move).toEqual({ x: 0, y: -1 });

    press(target, 'keyup', 'ArrowUp');
    expect(input.move).toEqual({ x: 0, y: 0 });

    press(target, 'keydown', 'd');
    expect(input.move).toEqual({ x: 1, y: 0 });

    press(target, 'keydown', 'w');
    expect(input.move).toEqual({ x: 1, y: -1 });

    press(target, 'keyup', 'd');
    press(target, 'keyup', 'w');
    expect(input.move).toEqual({ x: 0, y: 0 });
  });

  it('arrow_keys_prevent_default', () => {
    const { target } = setup();

    for (const key of ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']) {
      expect(press(target, 'keydown', key).defaultPrevented).toBe(true);
    }
  });

  it('blocked_input_ignores_keys', () => {
    const { target, input } = setup(true);

    const event = press(target, 'keydown', 'ArrowLeft');

    expect(input.move).toEqual({ x: 0, y: 0 });
    expect(event.defaultPrevented).toBe(false);
  });

  it('typing_in_input_ignored', () => {
    const { target, input } = setup();
    const field = document.createElement('input');
    target.appendChild(field);
    const textarea = document.createElement('textarea');
    target.appendChild(textarea);

    const arrow = press(field, 'keydown', 'ArrowLeft');
    const space = press(textarea, 'keydown', ' ');
    const enter = press(field, 'keydown', 'Enter');

    expect(input.move).toEqual({ x: 0, y: 0 });
    expect(input.drain()).toEqual([]);
    expect(arrow.defaultPrevented).toBe(false);
    expect(space.defaultPrevented).toBe(false);
    expect(enter.defaultPrevented).toBe(false);
  });

  it('enter_and_space_queue_interact', () => {
    const { target, input } = setup();

    press(target, 'keydown', 'Enter');
    press(target, 'keydown', ' ');

    expect(input.drain()).toEqual([
      { type: 'interact' },
      { type: 'interact' },
    ]);
  });

  it('escape_queues_cancel', () => {
    const { target, input } = setup();

    press(target, 'keydown', 'Escape');

    expect(input.drain()).toEqual([{ type: 'cancel' }]);
  });

  it('pointerup_queues_tap', () => {
    const { target, input } = setup();
    target.getBoundingClientRect = () =>
      ({
        left: 10,
        top: 20,
        right: 210,
        bottom: 220,
        width: 200,
        height: 200,
        x: 10,
        y: 20,
        toJSON: () => ({}),
      }) as DOMRect;

    pointer(target, 'pointerdown', {
      clientX: 42,
      clientY: 65,
      pointerType: 'mouse',
    });
    pointer(target, 'pointerup', {
      clientX: 42,
      clientY: 65,
      pointerType: 'mouse',
    });

    expect(input.drain()).toEqual([{ type: 'tap', x: 32, y: 45 }]);
  });

  it('touch_drag_does_not_queue_a_tap_after_pointerleave', () => {
    const { target, input } = setup();
    target.getBoundingClientRect = () => RECT;

    pointer(target, 'pointerdown', {
      clientX: 42,
      clientY: 65,
      pointerType: 'touch',
    });
    pointer(target, 'pointermove', {
      clientX: 90,
      clientY: 65,
      pointerType: 'touch',
    });
    pointer(target, 'pointerup', {
      clientX: 90,
      clientY: 65,
      pointerType: 'touch',
    });
    pointer(target, 'pointerout', {
      clientX: 90,
      clientY: 65,
      pointerType: 'touch',
    });
    pointer(target, 'pointerleave', {
      clientX: 90,
      clientY: 65,
      pointerType: 'touch',
    });

    // The finger travelled past the drag threshold: this is the light being
    // moved, not a tap to walk.
    expect(input.drain()).toEqual([]);
  });

  it('touch_tap_still_queues_a_tap_after_pointerleave', () => {
    const { target, input } = setup();
    target.getBoundingClientRect = () => RECT;

    pointer(target, 'pointerdown', {
      clientX: 42,
      clientY: 65,
      pointerType: 'touch',
    });
    pointer(target, 'pointerup', {
      clientX: 42,
      clientY: 65,
      pointerType: 'touch',
    });
    pointer(target, 'pointerout', {
      clientX: 42,
      clientY: 65,
      pointerType: 'touch',
    });
    pointer(target, 'pointerleave', {
      clientX: 42,
      clientY: 65,
      pointerType: 'touch',
    });

    expect(input.drain()).toEqual([{ type: 'tap', x: 32, y: 45 }]);
  });

  it('mode_tracks_last_device', () => {
    const { target, input } = setup();

    press(target, 'keydown', 'ArrowRight');
    expect(input.mode).toBe('keyboard');

    pointer(target, 'pointerdown', {
      clientX: 1,
      clientY: 2,
      pointerType: 'mouse',
    });
    expect(input.mode).toBe('mouse');

    pointer(target, 'pointerdown', {
      clientX: 3,
      clientY: 4,
      pointerType: 'touch',
    });
    expect(input.mode).toBe('touch');
  });

  it('dispose_removes_listeners', () => {
    const { target, input } = setup();
    input.dispose();

    press(target, 'keydown', 'ArrowLeft');
    pointer(target, 'pointerup', {
      clientX: 5,
      clientY: 6,
      pointerType: 'mouse',
    });

    expect(input.move).toEqual({ x: 0, y: 0 });
    expect(input.drain()).toEqual([]);
  });
});
