import { describe, expect, it } from 'vitest';
import type { Input, InputEvent } from '@/game/core/input';
import { createGameController } from './game';
import { createRoomScene } from './scene/room';
import { createStore } from './state/store';
import { TILE } from './world/grid';

const STEP = 1000 / 60;

function setup(opts: { blocked?: () => boolean } = {}) {
  const store = createStore(null);
  const queue: InputEvent[] = [];
  const input: Input = {
    move: { x: 0, y: 0 },
    pointer: null,
    mode: 'mouse',
    drain: () => queue.splice(0, queue.length),
    dispose: () => undefined,
  };
  const openTerminalCalls: number[] = [];
  const game = createGameController({
    store,
    scenes: [createRoomScene(store)],
    input,
    openTerminal: () => openTerminalCalls.push(1),
    isBlocked: opts.blocked ?? (() => store.getState().dialogue !== null),
  });
  game.resize(1366, 768);
  return { store, input, queue, game, openTerminalCalls };
}

type Ctx = ReturnType<typeof setup>;

/** CSS pixel position of a world point, as a tap would report it. */
function cssOf(game: Ctx['game'], wx: number, wy: number) {
  const { camera, scale } = game.snapshot();
  return { x: (wx - camera.x) * scale, y: (wy - camera.y) * scale };
}

function run(game: Ctx['game'], frames: number, until?: () => boolean): void {
  for (let i = 0; i < frames; i += 1) {
    game.step(STEP);
    if (until?.()) return;
  }
}

function hotspotCenter(game: Ctx['game'], id: string) {
  const h = game.snapshot().hotspots.find((spot) => spot.id === id);
  if (!h) throw new Error(`no hotspot ${id}`);
  return { x: h.rect.x + h.rect.w / 2, y: h.rect.y + h.rect.h / 2 };
}

describe('game controller', () => {
  it('tap_on_hotspot_walks_then_interacts', () => {
    const { game, queue, store } = setup();
    const c = hotspotCenter(game, 'shelf');
    queue.push({ type: 'tap', ...cssOf(game, c.x, c.y) });

    run(game, 1200, () => store.getState().dialogue !== null);
    expect(store.getState().dialogue).not.toBeNull();
    const stand = game.snapshot().hotspots.find((h) => h.id === 'shelf')!.stand;
    const { player } = game.snapshot();
    expect(Math.abs(player.x - (stand.x * TILE + TILE / 2))).toBeLessThan(2);
    expect(Math.abs(player.y - (stand.y * TILE + TILE / 2))).toBeLessThan(2);
    expect(player.facing).toBe('up');
  });

  it('tap_on_floor_walks', () => {
    const { game, queue } = setup();
    const target = { x: 20, y: 20 };
    queue.push({
      type: 'tap',
      ...cssOf(game, target.x * TILE + 4, target.y * TILE + 4),
    });
    run(game, 1200);
    const { player } = game.snapshot();
    expect(Math.floor(player.x / TILE)).toBe(target.x);
    expect(Math.floor(player.y / TILE)).toBe(target.y);
  });

  it('tap_on_a_wall_walks_to_the_nearest_reachable_tile_and_settles', () => {
    const { game, queue } = setup();
    queue.push({ type: 'tap', ...cssOf(game, 100, 10) });
    run(game, 1200);
    const { player } = game.snapshot();
    expect(player.path).toHaveLength(0);
    expect(player.moving).toBe(false);
    expect(player.y).toBeGreaterThan(48);
  });

  it('a_stalled_walk_gives_up_instead_of_hanging', () => {
    const { game } = setup();
    const { player } = game.snapshot();
    player.path = [{ x: 0, y: 0 }]; // a solid corner the feet can never reach
    run(game, 900);
    expect(player.path).toHaveLength(0);
    expect(player.moving).toBe(false);
  });

  it('tap_works_when_the_visitor_is_squeezed_against_a_wall', () => {
    const { game, queue } = setup();
    game.teleport(13, 150, 'left'); // tile column 1, hard against the left wall
    queue.push({ type: 'tap', ...cssOf(game, 120, 150) });
    run(game, 600);
    expect(game.snapshot().player.x).toBeGreaterThan(100);
  });

  it('interact_key_uses_facing_hotspot', () => {
    const { game, queue, store } = setup();
    const stand = game.snapshot().hotspots.find((h) => h.id === 'note')!.stand;
    game.teleport(stand.x * TILE + TILE / 2, stand.y * TILE + TILE / 2, 'up');
    queue.push({ type: 'interact' });
    run(game, 5);
    expect(store.getState().dialogue).not.toBeNull();
    expect(store.getState().found).toContain('silly:read-note');
  });

  it('interact_key_does_nothing_far_from_everything', () => {
    const { game, queue, store } = setup();
    game.teleport(150, 190, 'down');
    queue.push({ type: 'interact' });
    run(game, 5);
    expect(store.getState().dialogue).toBeNull();
  });

  it('input_blocked_during_dialogue', () => {
    const { game, input, queue, store } = setup();
    void store.say(['Hello.']);
    const before = { ...game.snapshot().player };
    input.move.x = 1;
    const c = hotspotCenter(game, 'cat');
    queue.push({ type: 'tap', ...cssOf(game, c.x, c.y) });
    run(game, 120);
    const { player } = game.snapshot();
    expect(player.x).toBe(before.x);
    expect(player.y).toBe(before.y);
    expect(player.path).toHaveLength(0);
  });

  it('blocked_taps_are_dropped_not_replayed_afterwards', () => {
    let blocked = true;
    const { game, queue } = setup({ blocked: () => blocked });
    const c = hotspotCenter(game, 'cat');
    queue.push({ type: 'tap', ...cssOf(game, c.x, c.y) });
    run(game, 5);
    blocked = false;
    run(game, 60);
    expect(game.snapshot().player.moving).toBe(false);
  });

  it('keyboard_movement_cancels_a_pending_interaction', () => {
    const { game, input, queue, store } = setup();
    const c = hotspotCenter(game, 'door');
    queue.push({ type: 'tap', ...cssOf(game, c.x, c.y) });
    run(game, 10);
    input.move.x = -1;
    run(game, 10);
    input.move.x = 0;
    run(game, 1500);
    expect(store.getState().dialogue).toBeNull();
  });

  it('reduced_motion_makes_dialogue_instant', () => {
    const { game, store } = setup();
    game.setReducedMotion(true);
    void store.say(['Hello there.']);
    expect(store.getState().dialogue?.typed).toBe('Hello there.'.length);
  });

  it('going_to_a_missing_scene_says_so_instead_of_hanging', () => {
    const { game, store } = setup();
    game.goTo('dark');
    expect(store.getState().dialogue).not.toBeNull();
    expect(game.snapshot().sceneId).toBe('room');
  });

  it('camera_stays_in_bounds_after_the_window_changes_shape', () => {
    const { game } = setup();
    for (const [w, h] of [[1366, 768], [390, 844], [844, 390], [1920, 1080]]) {
      game.resize(w, h);
      run(game, 2);
      const snap = game.snapshot();
      const room = snap.world;
      expect(Number.isInteger(snap.scale)).toBe(true);
      if (snap.viewW <= room.w) {
        expect(snap.camera.x).toBeGreaterThanOrEqual(0);
        expect(snap.camera.x + snap.viewW).toBeLessThanOrEqual(room.w);
      }
      if (snap.viewH <= room.h) {
        expect(snap.camera.y).toBeGreaterThanOrEqual(0);
        expect(snap.camera.y + snap.viewH).toBeLessThanOrEqual(room.h);
      }
    }
  });
});
