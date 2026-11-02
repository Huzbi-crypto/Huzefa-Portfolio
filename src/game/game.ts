import { copy } from '@/game/content/copy';
import { computeViewport } from '@/game/core/viewport';
import { createInput, type Input } from '@/game/core/input';
import { createLoop } from '@/game/core/loop';
import type { GameApi, Hotspot, Scene, SceneCtx } from '@/game/scene/types';
import type { GameStore } from '@/game/state/store';
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
const BACKDROP = '#1b1428';
/** A walk that makes no progress for this long is abandoned. */
const STALL_MS = 400;

export type GameHint = { label: string; via: 'key' | 'click' | 'tap' } | null;

export type GameOptions = {
  canvas: HTMLCanvasElement;
  store: GameStore;
  scenes: Scene[];
  openTerminal(): void;
  isBlocked(): boolean;
  /** Called when the thing the visitor could use right now changes. */
  onHint?(hint: GameHint): void;
};

export type Game = {
  start(): void;
  stop(): void;
  resize(cssW: number, cssH: number): void;
  goTo(id: Scene['id']): void;
  setReducedMotion(v: boolean): void;
};

type ControllerOptions = {
  store: GameStore;
  scenes: Scene[];
  input: Input;
  openTerminal(): void;
  isBlocked(): boolean;
  onHint?(hint: GameHint): void;
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
  const scenes = new Map<Scene['id'], Scene>(opts.scenes.map((s) => [s.id, s]));
  const navs = new Map<Scene['id'], TileMap>(
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

  const api: GameApi = {
    store,
    goTo: (id) => goTo(id),
    openTerminal: () => opts.openTerminal(),
  };

  function placeAtSpawn(): void {
    const c = tileCenter(scene.spawn);
    player.x = c.x;
    player.y = c.y;
    player.path.length = 0;
    player.moving = false;
    pending = null;
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
      if (distanceToRect(x, y, h.rect) <= TAP_SLOP) return h;
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
    for (const h of scene.hotspots) {
      const d = distanceToRect(player.x, player.y, h.rect);
      if (d > INTERACT_RANGE) continue;
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
    return best;
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

  function goTo(id: Scene['id']): void {
    const target = scenes.get(id);
    if (!target) {
      void store.say([...copy.door.notReady]);
      return;
    }
    scene = target;
    placeAtSpawn();
    updateCamera();
  }

  function ctx(): SceneCtx {
    return {
      t,
      player,
      input,
      camera,
      viewW: view.viewW,
      viewH: view.viewH,
      reducedMotion,
      found: store.getState().found,
    };
  }

  placeAtSpawn();
  updateCamera();

  return {
    step(ms: number): void {
      t += ms;
      store.tick(ms);

      const blocked = opts.isBlocked();
      const events = input.drain();

      if (!blocked) {
        for (const event of events) {
          if (event.type === 'tap') handleTap(event.x, event.y);
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
      emitHint(blocked);
    },

    /** Draw the world, pixel-aligned, into a canvas the size of the view. */
    render(g: CanvasRenderingContext2D): void {
      g.imageSmoothingEnabled = false;
      g.fillStyle = BACKDROP;
      g.fillRect(0, 0, view.viewW, view.viewH);
      g.save();
      g.translate(-camera.x, -camera.y);
      scene.draw(g, ctx());
      g.restore();
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

  const loop = createLoop({
    step: (ms) => controller.step(ms),
    render: () => controller.render(g),
  });

  return {
    start: () => loop.start(),
    stop() {
      loop.stop();
      input.dispose();
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
    goTo: (id) => controller.goTo(id),
    setReducedMotion: (v) => controller.setReducedMotion(v),
  };
}
