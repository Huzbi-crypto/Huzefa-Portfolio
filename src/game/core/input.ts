export type InputEvent =
  | { type: 'tap'; x: number; y: number }
  | { type: 'interact' }
  | { type: 'cancel' };

export type InputMove = {
  x: -1 | 0 | 1;
  y: -1 | 0 | 1;
};

export type Input = {
  move: InputMove;
  pointer: { x: number; y: number } | null;
  mode: 'mouse' | 'keyboard' | 'touch';
  drain(): InputEvent[];
  dispose(): void;
};

type Direction = { x: -1 | 0 | 1; y: -1 | 0 | 1 };

/** A touch that travels further than this is dragging, not tapping. */
export const DRAG_SLOP = 8;

const DIRECTIONS: Record<string, Direction> = {
  arrowleft: { x: -1, y: 0 },
  a: { x: -1, y: 0 },
  arrowright: { x: 1, y: 0 },
  d: { x: 1, y: 0 },
  arrowup: { x: 0, y: -1 },
  w: { x: 0, y: -1 },
  arrowdown: { x: 0, y: 1 },
  s: { x: 0, y: 1 },
};

function normalizeKey(key: string): string {
  return key.toLowerCase();
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.isContentEditable
  );
}

/**
 * Keyboard, mouse and touch input for the game canvas. Events are queued and
 * drained by the game loop so a fast tap is never lost between frames.
 */
export function createInput(
  target: HTMLElement,
  opts: { isBlocked: () => boolean },
): Input {
  const move: InputMove = { x: 0, y: 0 };
  const held = new Set<string>();
  const queue: InputEvent[] = [];
  let pointer: { x: number; y: number } | null = null;
  let downPoint: { x: number; y: number } | null = null;
  let mode: Input['mode'] = 'mouse';

  const syncMove = (): void => {
    const left = held.has('arrowleft') || held.has('a');
    const right = held.has('arrowright') || held.has('d');
    const up = held.has('arrowup') || held.has('w');
    const down = held.has('arrowdown') || held.has('s');

    move.x = ((right ? 1 : 0) - (left ? 1 : 0)) as InputMove['x'];
    move.y = ((down ? 1 : 0) - (up ? 1 : 0)) as InputMove['y'];
  };

  const localPoint = (event: PointerEvent): { x: number; y: number } => {
    const rect = target.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const deviceFor = (event: PointerEvent): Input['mode'] =>
    event.pointerType === 'touch' ? 'touch' : 'mouse';

  const onKeyDown = (event: KeyboardEvent): void => {
    if (isTypingTarget(event.target)) return;
    mode = 'keyboard';
    if (opts.isBlocked()) return;

    const key = normalizeKey(event.key);
    const direction = DIRECTIONS[key];
    if (direction) {
      event.preventDefault();
      held.add(key);
      syncMove();
      return;
    }

    if (key === 'enter' || key === ' ') {
      event.preventDefault();
      if (!event.repeat) queue.push({ type: 'interact' });
      return;
    }

    if (key === 'escape') {
      event.preventDefault();
      if (!event.repeat) queue.push({ type: 'cancel' });
    }
  };

  const onKeyUp = (event: KeyboardEvent): void => {
    if (isTypingTarget(event.target)) return;

    const key = normalizeKey(event.key);
    if (!DIRECTIONS[key]) return;

    held.delete(key);
    syncMove();
  };

  const clearHeld = (): void => {
    held.clear();
    syncMove();
  };

  const onPointerDown = (event: PointerEvent): void => {
    mode = deviceFor(event);
    pointer = localPoint(event);
    downPoint = pointer;
  };

  const onPointerMove = (event: PointerEvent): void => {
    mode = deviceFor(event);
    pointer = localPoint(event);
  };

  const onPointerUp = (event: PointerEvent): void => {
    mode = deviceFor(event);
    const point = localPoint(event);
    pointer = point;
    const dragDistance = downPoint
      ? Math.hypot(point.x - downPoint.x, point.y - downPoint.y)
      : 0;
    const dragged = mode === 'touch' && dragDistance > DRAG_SLOP;
    downPoint = null;
    if (!opts.isBlocked() && !dragged) {
      queue.push({ type: 'tap', x: point.x, y: point.y });
    }
  };

  const onPointerLeave = (): void => {
    pointer = null;
    downPoint = null;
  };

  target.addEventListener('keydown', onKeyDown);
  target.addEventListener('keyup', onKeyUp);
  target.addEventListener('pointerdown', onPointerDown);
  target.addEventListener('pointermove', onPointerMove);
  target.addEventListener('pointerup', onPointerUp);
  target.addEventListener('pointerleave', onPointerLeave);
  window.addEventListener('blur', clearHeld);

  return {
    move,
    get pointer() {
      return pointer;
    },
    get mode() {
      return mode;
    },
    drain(): InputEvent[] {
      return queue.splice(0, queue.length);
    },
    dispose(): void {
      target.removeEventListener('keydown', onKeyDown);
      target.removeEventListener('keyup', onKeyUp);
      target.removeEventListener('pointerdown', onPointerDown);
      target.removeEventListener('pointermove', onPointerMove);
      target.removeEventListener('pointerup', onPointerUp);
      target.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('blur', clearHeld);
      clearHeld();
      queue.length = 0;
    },
  };
}
