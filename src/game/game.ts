import { personalInfo } from '@/data/personal';
import { ACTIVE_PALETTE, SPRITES } from '@/game/art';
import type { GameAudio } from '@/game/audio/audio';
import { copy } from '@/game/content/copy';
import { readStarId } from '@/game/content/stars';
import { computeViewport } from '@/game/core/viewport';
import { createInput, DRAG_SLOP, type Input } from '@/game/core/input';
import { createLoop } from '@/game/core/loop';
import { drawSprite } from '@/game/render/sprite';
import { doorSwingFrame, drawIris } from '@/game/render/transition';
import type { GameApi, Hotspot, Scene, SceneCtx, SceneId } from '@/game/scene/types';
import type { GameStore } from '@/game/state/store';
import { NUDGE_AFTER_MS, pickNudge } from '@/game/state/nudge';
import { computeCamera } from '@/game/world/camera';
import {
  createEntity,
  stepEntity,
  type Entity,
  type Facing,
} from '@/game/world/entity';
import { findPath, TILE, type TileMap } from '@/game/world/grid';
import { navMap } from '@/game/scene/nav';

/** How close the feet must be to a hotspot's rect to use it from the keyboard. */
const INTERACT_RANGE = 14;
/** Extra pixels around a hotspot's rect that still count as a tap on it. */
const TAP_SLOP = 3;
/** A walk that makes no progress for this long is abandoned. */
const STALL_MS = 400;
/** Space between footsteps, so a walk sounds like feet and not a rattle. */
const STEP_SFX_MS = 280;
/** The door swings, the iris closes on it, then opens on the other side. */
const HOLD_MS = 420;
const CLOSE_MS = 520;
const OPEN_MS = 520;

type Transition = {
  to: SceneId;
  /** Named arrival tile in the target scene, if it asked for one. */
  entry?: string;
  phase: 'hold' | 'close' | 'open';
  elapsed: number;
  /** Where the iris closes or opens, in game pixels of the view. */
  cx: number;
  cy: number;
};

export type TransitionView = {
  phase: Transition['phase'];
  /** 0 is fully open, 1 fully closed. During the door swing this is the swing's own progress. */
  progress: number;
  cx: number;
  cy: number;
};

export type GameHint = { label: string; via: 'key' | 'click' | 'tap' } | null;
export type NudgeTarget = { id: string; label: string };

export type GameOptions = {
  canvas: HTMLCanvasElement;
  store: GameStore;
  scenes: Scene[];
  openTerminal(): void;
  isBlocked(): boolean;
  /** The game's sound. Optional so the controller stays testable in silence. */
  audio?: Pick<GameAudio, 'setScene' | 'playSfx'>;
  /** Called when the thing the visitor could use right now changes. */
  onHint?(hint: GameHint): void;
  /** Called with the hotspot an idle visitor could use next. */
  onNudge?(target: NudgeTarget | null): void;
};

export type Game = {
  start(): void;
  stop(): void;
  resize(cssW: number, cssH: number): void;
  goTo(id: SceneId, entry?: string): void;
  setReducedMotion(v: boolean): void;
};

declare global {
  interface Window {
    /**
     * Test-only handle to the running controller. Present only when the URL
     * carries `?e2e=1`, and never read by the game itself.
     */
    __huzbiGame?: ReturnType<typeof createGameController>;
  }
}

type ControllerOptions = {
  store: GameStore;
  scenes: Scene[];
  input: Input;
  openTerminal(): void;
  isBlocked(): boolean;
  audio?: Pick<GameAudio, 'setScene' | 'playSfx'>;
  onHint?(hint: GameHint): void;
  onNudge?(target: NudgeTarget | null): void;
};

function distanceToRect(
  x: number,
  y: number,
  rect: Hotspot['rect'],
): number {
  const dx = Math.max(rect.x - x, 0, x - (rect.x + rect.w));
  const dy = Math.max(rect.y - y, 0, y - (rect.y + rect.h));
  return Math.hypot(dx, dy);
}

/** The pointer targets for a hotspot: its tight hit rects, or its whole bounds. */
function pointerRects(h: Hotspot): readonly Hotspot['rect'][] {
  return h.hitRects && h.hitRects.length > 0 ? h.hitRects : [h.rect];
}

/** Distance to the nearest visible piece of a hotspot. */
function distanceToPointerTarget(x: number, y: number, h: Hotspot): number {
  let best = Number.POSITIVE_INFINITY;
  for (const rect of pointerRects(h)) {
    best = Math.min(best, distanceToRect(x, y, rect));
  }
  return best;
}

function tileCenter(tile: { x: number; y: number }): { x: number; y: number } {
  return { x: tile.x * TILE + TILE / 2, y: tile.y * TILE + TILE / 2 };
}

/**
 * All game rules with no canvas in sight: input in, entity and dialogue
 * changes out. `createGame` wraps this with a canvas and a loop, and tests
 * drive it directly.
 */
export function createGameController(opts: ControllerOptions) {
  const { store, input } = opts;
  const scenes = new Map<SceneId, Scene>(opts.scenes.map((s) => [s.id, s]));
  const navs = new Map<SceneId, TileMap>(
    opts.scenes.map((s) => [s.id, navMap(s.map)]),
  );
  let scene: Scene = opts.scenes[0];
  const player: Entity = createEntity(0, 0);
  let t = 0;
  let reducedMotion = false;
  let view = { scale: 2, viewW: 160, viewH: 180 };
  let camera = { x: 0, y: 0 };
  let pending: Hotspot | null = null;
  let lastHint: GameHint = null;
  let stalledMs = 0;
  let lightDrag: { x: number; y: number } | null = null;
  let touchOrigin: { x: number; y: number } | null = null;
  let dragged = false;
  let transition: Transition | null = null;
  let idleMs = 0;
  let nudge: NudgeTarget | null = null;
  let stepSfxMs = 0;
  let blockedNow = false;

  const api: GameApi = {
    store,
    goTo: (id, entry) => goTo(id, entry),
    openTerminal: () => opts.openTerminal(),
    showProject: (projectId) => store.showProject(projectId),
  };

  function placeAt(tile: { x: number; y: number }): void {
    const c = tileCenter(tile);
    player.x = c.x;
    player.y = c.y;
    player.path.length = 0;
    player.moving = false;
    pending = null;
  }

  function placeAtSpawn(): void {
    placeAt(scene.spawn);
  }

  function updateCamera(): void {
    camera = computeCamera(
      { x: player.x, y: player.y - 8 },
      view.viewW,
      view.viewH,
      scene.worldW,
      scene.worldH,
    );
  }

  function toWorld(cssX: number, cssY: number): { x: number; y: number } {
    return {
      x: cssX / view.scale + camera.x,
      y: cssY / view.scale + camera.y,
    };
  }

  function hotspotAt(x: number, y: number): Hotspot | null {
    for (const h of scene.hotspots) {
      if (distanceToPointerTarget(x, y, h) <= TAP_SLOP) return h;
    }
    return null;
  }

  function faceTowards(rect: Hotspot['rect']): void {
    const dx = rect.x + rect.w / 2 - player.x;
    const dy = rect.y + rect.h / 2 - player.y;
    if (Math.abs(dx) > Math.abs(dy)) player.facing = dx > 0 ? 'right' : 'left';
    else player.facing = dy > 0 ? 'down' : 'up';
  }

  function nearestInRange(): Hotspot | null {
    let best: Hotspot | null = null;
    let bestScore = Number.POSITIVE_INFINITY;
    // A hotspot's own stand tile is an explicit promise: standing there and
    // pressing Enter must use it, even when an exhibit's big rectangle looms
    // closer. Clicking a hotspot already honors the same idea through `pending`.
    let onStand: Hotspot | null = null;
    let onStandDistance = Number.POSITIVE_INFINITY;
    const tileX = Math.floor(player.x / TILE);
    const tileY = Math.floor(player.y / TILE);

    for (const h of scene.hotspots) {
      const d = distanceToRect(player.x, player.y, h.rect);
      if (d > INTERACT_RANGE) continue;

      if (h.stand.x === tileX && h.stand.y === tileY && d < onStandDistance) {
        onStand = h;
        onStandDistance = d;
      }

      // A hotspot the visitor is facing wins a near tie.
      const cx = h.rect.x + h.rect.w / 2 - player.x;
      const cy = h.rect.y + h.rect.h / 2 - player.y;
      const facingIt =
        (player.facing === 'up' && cy < 0) ||
        (player.facing === 'down' && cy > 0) ||
        (player.facing === 'left' && cx < 0) ||
        (player.facing === 'right' && cx > 0);
      const score = d - (facingIt ? 3 : 0);
      if (score < bestScore) {
        best = h;
        bestScore = score;
      }
    }
    return onStand ?? best;
  }

  function use(h: Hotspot): void {
    pending = null;
    faceTowards(h.rect);
    void Promise.resolve(h.onInteract(api)).catch(() => undefined);
  }

  function handleTap(cssX: number, cssY: number): void {
    const w = toWorld(cssX, cssY);
    const hit = hotspotAt(w.x, w.y);
    const from = { x: Math.floor(player.x / TILE), y: Math.floor(player.y / TILE) };
    const to = hit ? hit.stand : { x: Math.floor(w.x / TILE), y: Math.floor(w.y / TILE) };

    pending = hit;
    // The feet can end up on a tile the nav map hides (hard against a wall).
    // Free that one tile so the walk can start from where they really are.
    const nav = navs.get(scene.id) ?? scene.map;
    const solid = new Uint8Array(nav.solid);
    solid[from.y * nav.w + from.x] = 0;
    player.path = findPath({ w: nav.w, h: nav.h, solid }, from, to);
  }

  function emitHint(blocked: boolean): void {
    if (!opts.onHint) return;
    let hint: GameHint = null;

    if (!blocked) {
      if (input.mode === 'mouse' && input.pointer) {
        const w = toWorld(input.pointer.x, input.pointer.y);
        const over = hotspotAt(w.x, w.y);
        if (over) hint = { label: over.label, via: 'click' };
      }
      if (!hint) {
        const near = nearestInRange();
        if (near) hint = { label: near.label, via: input.mode === 'touch' ? 'tap' : 'key' };
      }
    }

    if (hint?.label === lastHint?.label && hint?.via === lastHint?.via) return;
    lastHint = hint;
    opts.onHint(hint);
  }

  function viewPoint(x: number, y: number): { x: number; y: number } {
    return { x: Math.round(x - camera.x), y: Math.round(y - camera.y) };
  }

  function swapScene(id: SceneId, entry?: string): void {
    const from = scene.id;
    scene.cancel?.();
    scene = scenes.get(id) ?? scene;
    const named = entry ? scene.entries?.[entry] : undefined;
    placeAtSpawn();
    const door = !named && from === 'dark' ? scene.hotspots.find((h) => h.id === 'door') : undefined;
    if (named) {
      placeAt(named);
    } else if (door) {
      // Coming back through the door puts the visitor just in front of it.
      placeAt({ x: door.stand.x, y: door.stand.y + 1 });
    }
    player.facing = 'down';
    lightDrag = null;
    touchOrigin = null;
    dragged = false;
    idleMs = 0;
    clearNudge();
    updateCamera();
    opts.audio?.setScene(id);
  }

  /** First time in the dark: one short line on how the light works. */
  function greetIfNew(id: SceneId): void {
    if (id !== 'dark' || store.count('dark-arrival') > 0) return;
    store.increment('dark-arrival');
    void store.say([...copy.dark.arrival[input.mode]]);
  }

  function goTo(id: SceneId, entry?: string): void {
    const target = scenes.get(id);
    if (!target) {
      void store.say([...copy.door.notReady]);
      return;
    }
    if (transition || target === scene) return;

    opts.audio?.playSfx('door');

    if (reducedMotion) {
      swapScene(id, entry);
      greetIfNew(id);
      return;
    }

    const door = scene.id === 'room' && id === 'dark' ? scene.hotspots.find((h) => h.id === 'door') : undefined;
    const centre = door
      ? viewPoint(door.rect.x + door.rect.w / 2, door.rect.y + door.rect.h / 2)
      : viewPoint(player.x, player.y - 10);
    player.path.length = 0;
    player.moving = false;
    pending = null;
    transition = {
      to: id,
      entry,
      phase: door ? 'hold' : 'close',
      elapsed: 0,
      cx: centre.x,
      cy: centre.y,
    };
  }

  function stepTransition(ms: number): void {
    const tr = transition;
    if (!tr) return;
    tr.elapsed += ms;
    if (tr.phase === 'hold' && tr.elapsed >= HOLD_MS) {
      tr.phase = 'close';
      tr.elapsed = 0;
    }
    if (tr.phase === 'close' && tr.elapsed >= CLOSE_MS) {
      swapScene(tr.to, tr.entry);
      const centre = viewPoint(player.x, player.y - 10);
      tr.phase = 'open';
      tr.elapsed = 0;
      tr.cx = centre.x;
      tr.cy = centre.y;
    }
    if (tr.phase === 'open' && tr.elapsed >= OPEN_MS) {
      transition = null;
      greetIfNew(scene.id);
    }
  }

  function transitionView(): TransitionView | null {
    const tr = transition;
    if (!tr) return null;
    const progress =
      tr.phase === 'hold'
        ? Math.min(1, tr.elapsed / HOLD_MS)
        : tr.phase === 'close'
          ? Math.min(1, tr.elapsed / CLOSE_MS)
          : Math.max(0, 1 - tr.elapsed / OPEN_MS);
    return { phase: tr.phase, progress, cx: tr.cx, cy: tr.cy };
  }

  function clearNudge(): void {
    if (nudge === null) return;

    nudge = null;
    opts.onNudge?.(null);
  }

  /** Ways out are never the thing to nudge a stuck visitor toward. */
  const EXIT_HOTSPOTS = new Set(['exit', 'back-to-hall', 'arch', 'workshop-hatch', 'archive-door']);
  const SILLY_HOTSPOT: Record<string, string> = {
    note: 'silly:read-note',
    tea: 'silly:cold-tea',
    cat: 'silly:pet-cat',
    sofa: 'silly:sofa',
    lamp: 'silly:lamp',
    rug: 'silly:rug',
    window: 'silly:wave-at-sky',
    'window-two': 'silly:wave-at-sky',
    door: 'silly:door-chicken',
    monitor: 'silly:terminal-secret',
    'monster-poster': 'silly:monster-poster',
  };

  function hotspotIsFound(h: Hotspot): boolean {
    if (EXIT_HOTSPOTS.has(h.id)) return true;
    if (h.id.startsWith('clue:')) return store.hasClue(h.id);
    if (h.id === 'shelf') {
      const found = new Set(store.getState().found);
      return personalInfo.readingList.every((book) => found.has(readStarId(book.title)));
    }
    const found = new Set(store.getState().found);
    const star = SILLY_HOTSPOT[h.id];
    if (star) return found.has(star);
    return found.has(`project:${h.id}`);
  }

  /** Point a visitor who has gone quiet at the next clue, then anything else. */
  function updateIdle(ms: number, active: boolean): void {
    if (active) {
      idleMs = 0;
      clearNudge();
      return;
    }

    idleMs += ms;
    if (idleMs < NUDGE_AFTER_MS) return;

    const targets = scene.hotspots.map((h) => ({
      id: h.id,
      found: hotspotIsFound(h),
    }));
    const target = pickNudge(store.getProgress(), idleMs, targets);
    const next = target
      ? { id: target, label: scene.hotspots.find((h) => h.id === target)?.label ?? target }
      : null;

    if (next?.id === nudge?.id) return;
    nudge = next;
    opts.onNudge?.(next);
  }

  /** Track whether a touch is dragging the light, so a drag never counts as a tap. */
  function watchDrag(): void {
    if (!scene.dark || input.mode !== 'touch') return;
    const p = input.pointer;
    if (!p) {
      // The finger lifted: the next touch starts fresh.
      touchOrigin = null;
      dragged = false;
      return;
    }
    if (!touchOrigin) touchOrigin = { x: p.x, y: p.y };
    else if (!dragged && Math.hypot(p.x - touchOrigin.x, p.y - touchOrigin.y) > DRAG_SLOP) {
      dragged = true;
    }
    if (dragged) lightDrag = { x: p.x, y: p.y };
  }

  function ctx(): SceneCtx {
    return {
      t,
      player,
      input,
      camera,
      viewW: view.viewW,
      viewH: view.viewH,
      scale: view.scale,
      drag: lightDrag,
      reducedMotion,
      found: store.getState().found,
      blocked: blockedNow,
    };
  }

  placeAtSpawn();
  updateCamera();
  opts.audio?.setScene(scene.id);

  return {
    step(ms: number): void {
      t += ms;
      store.tick(ms);

      const covered = transition !== null;
      const blocked = covered || opts.isBlocked();
      blockedNow = blocked;
      const events = input.drain();
      if (!blocked) watchDrag();

      if (!blocked) {
        for (const event of events) {
          if (event.type === 'tap') {
            const wasDrag = dragged;
            touchOrigin = null;
            dragged = false;
            if (wasDrag) continue; // the finger was moving the light
            lightDrag = null;
            handleTap(event.x, event.y);
          }
          else if (event.type === 'interact') {
            const h = nearestInRange();
            if (h) use(h);
          } else if (event.type === 'cancel') {
            pending = null;
            player.path.length = 0;
          }
        }
      }

      const move = blocked ? { x: 0, y: 0 } : input.move;
      if (move.x !== 0 || move.y !== 0) pending = null;
      const beforeX = player.x;
      const beforeY = player.y;
      stepEntity(player, move, scene.map, ms);

      const walked = player.x !== beforeX || player.y !== beforeY;
      if (walked) {
        stepSfxMs += ms;
        if (stepSfxMs >= STEP_SFX_MS) {
          stepSfxMs = 0;
          opts.audio?.playSfx('step');
        }
      } else {
        stepSfxMs = 0;
      }

      // A path the feet cannot follow (a pinched tile, a door shut mid-walk)
      // must never leave the visitor "walking" forever.
      if (player.path.length > 0 && player.x === beforeX && player.y === beforeY) {
        stalledMs += ms;
        if (stalledMs >= STALL_MS) {
          player.path.length = 0;
          player.moving = false;
          stalledMs = 0;
        }
      } else {
        stalledMs = 0;
      }

      if (pending && !blocked && player.path.length === 0) {
        const h = pending;
        if (distanceToRect(player.x, player.y, h.rect) <= INTERACT_RANGE) use(h);
        else pending = null;
      }

      scene.update(ms, ctx());
      updateCamera();
      stepTransition(ms);
      emitHint(blocked);
      updateIdle(ms, blocked || events.length > 0 || move.x !== 0 || move.y !== 0 || player.moving);
    },

    /** Draw the world, pixel-aligned, into a canvas the size of the view. */
    render(g: CanvasRenderingContext2D): void {
      g.imageSmoothingEnabled = false;
      g.fillStyle = ACTIVE_PALETTE.a;
      g.fillRect(0, 0, view.viewW, view.viewH);
      g.save();
      g.translate(-camera.x, -camera.y);
      scene.draw(g, ctx());
      if (transition?.phase === 'hold') {
        const door = scene.hotspots.find((h) => h.id === 'door');
        const frame = door ? doorSwingFrame(transitionView()?.progress ?? 1) : null;
        if (door && frame) drawSprite(g, SPRITES[frame], door.rect.x, door.rect.y);
      }
      g.restore();
      const tv = transitionView();
      if (tv && tv.phase !== 'hold') {
        drawIris(g, tv.progress, tv.cx, tv.cy, view.viewW, view.viewH, ACTIVE_PALETTE.a);
      }
    },

    resize(cssW: number, cssH: number): void {
      view = computeViewport(cssW, cssH);
      updateCamera();
    },

    goTo,

    setReducedMotion(value: boolean): void {
      reducedMotion = value;
      store.setReducedMotion(value);
    },

    teleport(x: number, y: number, facing: Facing = 'down'): void {
      player.x = x;
      player.y = y;
      player.facing = facing;
      player.path.length = 0;
      player.moving = false;
      pending = null;
      updateCamera();
    },

    getView: () => view,

    snapshot() {
      return {
        sceneId: scene.id,
        player,
        camera,
        scale: view.scale,
        viewW: view.viewW,
        viewH: view.viewH,
        world: { w: scene.worldW, h: scene.worldH },
        hotspots: scene.hotspots,
        transition: transitionView(),
        drag: lightDrag,
        nudge,
      };
    },
  };
}

export function createGame(opts: GameOptions): Game {
  const { canvas } = opts;
  const g = canvas.getContext('2d', { alpha: false });
  if (!g) throw new Error('2D canvas is not available');

  // Keys listen on the canvas's wrapper so the wrapper can own focus.
  const input = createInput(canvas.parentElement ?? canvas, {
    isBlocked: opts.isBlocked,
  });
  const controller = createGameController({ ...opts, input });

  // The browser journey tests read the controller through this handle. It is
  // absent unless the URL explicitly asks for it, so play is untouched.
  if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('e2e') === '1') {
    window.__huzbiGame = controller;
  }

  const loop = createLoop({
    step: (ms) => controller.step(ms),
    render: () => controller.render(g),
  });

  return {
    start: () => loop.start(),
    stop() {
      loop.stop();
      input.dispose();
      if (typeof window !== 'undefined' && window.__huzbiGame === controller) {
        delete window.__huzbiGame;
      }
    },
    resize(cssW, cssH) {
      controller.resize(cssW, cssH);
      const { scale, viewW, viewH } = controller.getView();
      canvas.width = viewW;
      canvas.height = viewH;
      canvas.style.width = `${viewW * scale}px`;
      canvas.style.height = `${viewH * scale}px`;
      g.imageSmoothingEnabled = false;
      controller.render(g);
    },
    goTo: (id, entry) => controller.goTo(id, entry),
    setReducedMotion: (v) => controller.setReducedMotion(v),
  };
}
