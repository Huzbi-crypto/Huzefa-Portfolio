import { describe, expect, it, vi } from 'vitest';
import type { Input, InputEvent } from '@/game/core/input';
import { createGameController } from './game';
import { createArchive } from './scene/archive';
import { createDarkScene } from './scene/dark';
import { createNap } from './scene/nap';
import { createObservatory } from './scene/observatory';
import { createRoomScene } from './scene/room';
import { createWorkshop } from './scene/workshop';
import type { Scene } from './scene/types';
import { copy } from './content/copy';
import { createStore, type GameStore } from './state/store';
import { TILE } from './world/grid';

const STEP = 1000 / 60;

function setup(opts: {
  blocked?: () => boolean;
  dark?: boolean;
  storage?: Storage | null;
  scenes?: (store: GameStore) => Scene[];
  onNudge?: (target: { id: string; label: string } | null) => void;
} = {}) {
  const store = createStore(opts.storage ?? null);
  const queue: InputEvent[] = [];
  const input: Input = {
    move: { x: 0, y: 0 },
    pointer: null,
    mode: 'mouse',
    drain: () => queue.splice(0, queue.length),
    dispose: () => undefined,
  };
  const openTerminalCalls: number[] = [];
  const scenes =
    opts.scenes?.(store) ??
    (opts.dark ? [createRoomScene(store), createDarkScene(store)] : [createRoomScene(store)]);
  const game = createGameController({
    store,
    scenes,
    input,
    openTerminal: () => openTerminalCalls.push(1),
    isBlocked: opts.blocked ?? (() => store.getState().dialogue !== null),
    onNudge: opts.onNudge,
  });
  game.resize(1366, 768);
  return { store, input, queue, game, openTerminalCalls, room: scenes[0] };
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

  it('interact_key_reads_the_workshop_clue_from_its_own_stand', () => {
    // The lang-projects board is only six pixels from the clue's stand, while
    // the clue itself is fourteen away. The trail must still win on Enter.
    const { game, queue, store } = setup({
      scenes: (gameStore) => [createWorkshop(gameStore)],
    });
    const clue = game.snapshot().hotspots.find((h) => h.id === 'clue:workshop');
    expect(clue).toBeDefined();
    game.teleport(clue!.stand.x * TILE + TILE / 2, clue!.stand.y * TILE + TILE / 2, 'up');
    queue.push({ type: 'interact' });
    run(game, 5);

    expect(store.hasClue('clue:workshop')).toBe(true);
    expect(store.getState().dialogue?.lines).toEqual([...copy.clues.workshop.lines]);
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

  it('tells_the_scene_when_a_panel_owns_the_input', () => {
    const seen: boolean[] = [];
    let blocked = false;
    const { game } = setup({
      blocked: () => blocked,
      scenes: (gameStore) => {
        const room = createRoomScene(gameStore);
        const update = room.update.bind(room);
        room.update = (ms, ctx) => {
          seen.push(Boolean(ctx.blocked));
          update(ms, ctx);
        };
        return [room];
      },
    });

    run(game, 2);
    expect(seen.at(-1)).toBe(false);
    blocked = true;
    run(game, 2);
    expect(seen.at(-1)).toBe(true);
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

describe('exhibit pointer targets', () => {
  /** Tap a world point and let the walk settle. */
  function tapAndWalk(
    game: Ctx['game'],
    queue: Ctx['queue'],
    x: number,
    y: number,
  ): void {
    queue.push({ type: 'tap', ...cssOf(game, x, y) });
    run(game, 1600);
  }

  it('the_empty_air_between_the_tin_cans_walks_there_instead', () => {
    const { game, queue, store } = setup({
      scenes: (gameStore) => [createWorkshop(gameStore)],
    });
    const hot = game.snapshot().hotspots.find((h) => h.id === 'speech-translator');
    expect(hot).toBeDefined();
    // High in the old full-span rectangle, well above the sagging string.
    const empty = { x: hot!.rect.x + 82, y: hot!.rect.y + 8 };

    tapAndWalk(game, queue, empty.x, empty.y);

    const { player } = game.snapshot();
    expect(Math.floor(player.x / TILE)).toBe(Math.floor(empty.x / TILE));
    expect(Math.floor(player.y / TILE)).toBe(Math.floor(empty.y / TILE));
    expect(store.getState().dialogue).toBeNull();
    expect(store.getState().found).toHaveLength(0);
  });

  it('the_empty_table_above_the_robot_board_walks_there_instead', () => {
    const { game, queue, store } = setup({
      scenes: (gameStore) => [createWorkshop(gameStore)],
    });
    const hot = game.snapshot().hotspots.find((h) => h.id === 'lang-projects');
    expect(hot).toBeDefined();
    // Inside the old bounds (which reached twelve pixels above the board), but
    // above the visible board itself.
    const empty = { x: hot!.rect.x + 76, y: hot!.rect.y + 4 };

    tapAndWalk(game, queue, empty.x, empty.y);

    const { player } = game.snapshot();
    expect(Math.floor(player.x / TILE)).toBe(Math.floor(empty.x / TILE));
    expect(Math.floor(player.y / TILE)).toBe(Math.floor(empty.y / TILE));
    expect(store.getState().dialogue).toBeNull();
    expect(store.getState().found).toHaveLength(0);
  });

  it('the_empty_floor_beside_an_archive_exhibit_walks_there_instead', () => {
    const { game, queue, store } = setup({
      scenes: (gameStore) => [createArchive(gameStore)],
    });
    const hot = game.snapshot().hotspots.find((h) => h.id === 'read-cookies');
    expect(hot).toBeDefined();
    const empty = { x: hot!.rect.x + hot!.rect.w + 14, y: hot!.rect.y + hot!.rect.h - 2 };

    tapAndWalk(game, queue, empty.x, empty.y);

    const { player } = game.snapshot();
    expect(Math.floor(player.x / TILE)).toBe(Math.floor(empty.x / TILE));
    expect(Math.floor(player.y / TILE)).toBe(Math.floor(empty.y / TILE));
    expect(store.getState().dialogue).toBeNull();
    expect(store.getState().found).toHaveLength(0);
  });
});

function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (k) => data.get(k) ?? null,
    key: (i) => [...data.keys()][i] ?? null,
    removeItem: (k) => void data.delete(k),
    setItem: (k, v) => void data.set(k, v),
  };
}

/** Click through every open dialogue, picking `choice` where there is one. */
function clickThrough(store: Ctx['store'], choice?: string): void {
  for (let guard = 0; store.getState().dialogue && guard < 50; guard += 1) store.advance(choice);
}

describe('the door and the dark', () => {
  it('reduced_motion_cuts_without_iris', () => {
    const { game } = setup({ dark: true });
    game.setReducedMotion(true);
    game.goTo('dark');
    expect(game.snapshot().sceneId).toBe('dark');
    expect(game.snapshot().transition).toBeNull();
  });

  it('the_iris_closes_on_the_room_then_opens_on_the_dark', () => {
    const { game } = setup({ dark: true });
    game.goTo('dark');
    expect(game.snapshot().sceneId).toBe('room'); // still looking at the door
    expect(game.snapshot().transition?.phase).toBe('hold');

    const seen = new Set<string>();
    for (let i = 0; i < 300; i += 1) {
      game.step(STEP);
      const tr = game.snapshot().transition;
      if (tr) seen.add(`${game.snapshot().sceneId}:${tr.phase}`);
    }
    expect([...seen]).toEqual(
      expect.arrayContaining(['room:hold', 'room:close', 'dark:open']),
    );
    expect(game.snapshot().sceneId).toBe('dark');
    expect(game.snapshot().transition).toBeNull();
  });

  it('the_scene_swaps_only_once_the_iris_has_fully_closed', () => {
    const { game } = setup({ dark: true });
    game.goTo('dark');
    let swappedAt: number | null = null;
    let last = 0;
    for (let i = 0; i < 300 && swappedAt === null; i += 1) {
      game.step(STEP);
      const tr = game.snapshot().transition;
      if (tr?.phase === 'close') last = tr.progress;
      if (game.snapshot().sceneId === 'dark') swappedAt = last;
    }
    expect(swappedAt).toBeGreaterThan(0.9);
  });

  it('the_visitor_cannot_walk_or_tap_through_the_transition', () => {
    const { game, input, queue } = setup({ dark: true });
    game.goTo('dark');
    const before = { ...game.snapshot().player };
    input.move.x = 1;
    queue.push({ type: 'tap', x: 300, y: 300 });
    run(game, 20);
    const { player } = game.snapshot();
    expect(player.x).toBe(before.x);
    expect(player.y).toBe(before.y);
    expect(player.path).toHaveLength(0);
  });

  it('a_second_goTo_during_a_transition_is_ignored', () => {
    const { game } = setup({ dark: true });
    game.goTo('dark');
    game.goTo('room');
    run(game, 300);
    expect(game.snapshot().sceneId).toBe('dark');
  });

  it('arriving_in_the_dark_puts_the_visitor_at_its_spawn', () => {
    const { game } = setup({ dark: true });
    game.setReducedMotion(true);
    game.goTo('dark');
    const snap = game.snapshot();
    const spawn = snap.sceneId === 'dark' ? { x: 4, y: 7 } : null;
    expect(Math.floor(snap.player.x / TILE)).toBe(spawn!.x);
    expect(Math.floor(snap.player.y / TILE)).toBe(spawn!.y);
  });

  it('going_back_to_the_room_arrives_at_the_door_not_the_start', () => {
    const { game } = setup({ dark: true });
    game.setReducedMotion(true);
    game.goTo('dark');
    game.goTo('room');
    const snap = game.snapshot();
    const door = snap.hotspots.find((h) => h.id === 'door')!;
    expect(snap.sceneId).toBe('room');
    expect(Math.floor(snap.player.x / TILE)).toBe(door.stand.x);
    expect(snap.player.y / TILE).toBeGreaterThan(door.stand.y);
    expect(snap.player.facing).toBe('down');
  });

  it('door_opened_is_remembered', async () => {
    const storage = memoryStorage();
    const { game, store } = setup({ dark: true, storage });
    game.setReducedMotion(true);
    const door = game.snapshot().hotspots.find((h) => h.id === 'door')!;
    const done = Promise.resolve(
      door.onInteract({
        store,
        goTo: game.goTo,
        openTerminal: () => undefined,
        showProject: async () => undefined,
      }),
    );
    for (let i = 0; i < 20 && store.getState().dialogue; i += 1) {
      await new Promise((r) => setTimeout(r, 0));
      clickThrough(store, 'open');
    }
    await done;
    expect(store.getState().doorOpened).toBe(true);
    expect(game.snapshot().sceneId).toBe('dark');

    const reloaded = createStore(storage);
    expect(reloaded.getState().doorOpened).toBe(true);
  });

  it('leaving_a_scene_cancels_its_exhibit_beats', () => {
    const store = createStore(null);
    const room = createRoomScene(store);
    const workshop = createWorkshop(store);
    const cancel = vi.fn();
    workshop.cancel = cancel;
    const input: Input = {
      move: { x: 0, y: 0 },
      pointer: null,
      mode: 'mouse',
      drain: () => [],
      dispose: () => undefined,
    };
    const game = createGameController({
      store,
      scenes: [room, workshop],
      input,
      openTerminal: () => undefined,
      isBlocked: () => store.getState().dialogue !== null,
    });
    game.setReducedMotion(true);
    game.goTo('workshop');
    game.goTo('room');

    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it('the_first_arrival_in_the_dark_says_how_to_hold_the_lantern_once', () => {
    const { game, store, input } = setup({ dark: true });
    game.setReducedMotion(true);
    input.mode = 'touch';
    game.goTo('dark');
    run(game, 5);
    expect(store.getState().dialogue?.lines).toEqual([...copy.dark.arrival.touch]);
    clickThrough(store);
    game.goTo('room');
    game.goTo('dark');
    run(game, 5);
    expect(store.getState().dialogue).toBeNull();
  });
});

describe('the idle nudge', () => {
  const CLUE = {
    id: 'clue:note',
    rect: { x: 10, y: 10, w: 8, h: 8 },
    stand: { x: 2, y: 2 },
    label: 'A clue',
    onInteract: () => undefined,
  };

  it('no_nudge_until_thirty_seconds_have_passed', () => {
    const nudges: ({ id: string; label: string } | null)[] = [];
    const { game, room } = setup({ onNudge: (target) => nudges.push(target) });
    room.hotspots.push(CLUE);

    run(game, Math.ceil(29_000 / STEP));
    expect(nudges).toEqual([]);

    run(game, Math.ceil(2_000 / STEP));
    expect(nudges.at(-1)?.id).toBe('clue:note');
  });

  it('moving_clears_the_nudge', () => {
    const nudges: ({ id: string; label: string } | null)[] = [];
    const { game, room, input } = setup({ onNudge: (target) => nudges.push(target) });
    room.hotspots.push(CLUE);

    run(game, Math.ceil(31_000 / STEP));
    expect(nudges.at(-1)?.id).toBe('clue:note');

    input.move.x = 1;
    run(game, 2);
    input.move.x = 0;

    expect(nudges.at(-1)).toBeNull();
  });

  it('after_the_trail_still_nudges_an_unfound_room_thing_with_its_label', () => {
    const nudges: ({ id: string; label: string } | null)[] = [];
    const { game, store } = setup({ onNudge: (target) => nudges.push(target) });
    for (const clue of ['clue:note', 'clue:hall', 'clue:workshop', 'clue:archive', 'clue:observatory']) {
      store.markClue(clue);
    }

    run(game, Math.ceil(31_000 / STEP));
    const target = nudges.at(-1);
    expect(target).not.toBeNull();
    expect(target!.label.length).toBeGreaterThan(0);
    expect(target!.id.startsWith('clue:')).toBe(false);
  });
});

describe('dragging the light on touch', () => {
  function inDark() {
    const s = setup({ dark: true });
    s.game.setReducedMotion(true);
    s.game.goTo('dark');
    s.input.mode = 'touch';
    run(s.game, 3);
    clickThrough(s.store); // the arrival line
    run(s.game, 3);
    return s;
  }

  it('a_drag_moves_the_light_and_is_not_a_tap_to_walk', () => {
    const { game, input, queue } = inDark();
    const before = { ...game.snapshot().player };
    input.pointer = { x: 100, y: 100 };
    run(game, 2);
    input.pointer = { x: 220, y: 160 };
    run(game, 2);
    queue.push({ type: 'tap', x: 220, y: 160 });
    run(game, 60);
    const snap = game.snapshot();
    expect(snap.drag).toEqual({ x: 220, y: 160 });
    expect(snap.player.x).toBe(before.x);
    expect(snap.player.y).toBe(before.y);
  });

  it('a_plain_tap_walks_and_hands_the_light_back_to_the_player', () => {
    const { game, input, queue } = inDark();
    input.pointer = { x: 100, y: 100 };
    run(game, 2);
    input.pointer = { x: 220, y: 160 };
    run(game, 2);
    queue.push({ type: 'tap', x: 220, y: 160 });
    run(game, 2); // the drag ends
    input.pointer = null;
    run(game, 2);

    input.pointer = { x: 500, y: 500 };
    queue.push({ type: 'tap', x: 500, y: 500 });
    run(game, 2);
    input.pointer = null;
    run(game, 2);
    expect(game.snapshot().drag).toBeNull();
    expect(game.snapshot().player.path.length + (game.snapshot().player.moving ? 1 : 0)).toBeGreaterThan(0);
  });
});

describe('clicking around an object in the dark', () => {
  function sceneSetup() {
    return setup({
      scenes: (store) => [
        createRoomScene(store),
        createNap(store),
        createObservatory(store),
        createDarkScene(store),
      ],
    });
  }

  function enter(game: Ctx['game'], id: 'nap' | 'observatory' | 'dark', entry: string): void {
    game.setReducedMotion(true);
    game.goTo(id, entry);
    run(game, 3);
    expect(game.snapshot().sceneId).toBe(id);
  }

  function tapAt(game: Ctx['game'], queue: InputEvent[], wx: number, wy: number): void {
    queue.push({ type: 'tap', ...cssOf(game, wx, wy) });
  }

  function walkOut(game: Ctx['game']): void {
    run(game, 1600, () => {
      const { player } = game.snapshot();
      return player.path.length === 0 && !player.moving;
    });
  }

  it('the_nap_sofa_walks_to_the_floor_below_it_instead_of_talking', () => {
    const { game, queue, store } = sceneSetup();
    enter(game, 'nap', 'fromObservatory');
    // Inside the old 64x70 sleeper rectangle, well below the 64x46 sofa art.
    tapAt(game, queue, 160, 150);
    walkOut(game);

    const { player } = game.snapshot();
    expect(store.getState().dialogue).toBeNull();
    expect(Math.floor(player.x / TILE)).toBe(20);
    expect(Math.floor(player.y / TILE)).toBe(18);
  });

  it('the_sofa_itself_still_walks_to_its_stand_and_talks', () => {
    const { game, queue, store } = sceneSetup();
    enter(game, 'nap', 'fromObservatory');
    tapAt(game, queue, 160, 110);
    run(game, 1600, () => store.getState().dialogue !== null);

    const stand = game.snapshot().hotspots.find((h) => h.id === 'sleeper')!.stand;
    const { player } = game.snapshot();
    expect(store.getState().dialogue).not.toBeNull();
    expect(Math.abs(player.x - (stand.x * TILE + TILE / 2))).toBeLessThan(2);
    expect(Math.abs(player.y - (stand.y * TILE + TILE / 2))).toBeLessThan(2);
  });

  it('the_wall_under_the_plaque_walks_instead_of_reading_it', () => {
    const { game, queue, store } = sceneSetup();
    enter(game, 'observatory', 'fromHall');
    // Under the brass but above the stand: inside the tall interaction rect.
    tapAt(game, queue, 110, 126);
    walkOut(game);

    const { player } = game.snapshot();
    expect(store.getState().dialogue).toBeNull();
    expect(Math.floor(player.x / TILE)).toBe(13);
    expect(Math.floor(player.y / TILE)).toBe(15);
  });

  it('the_empty_corner_under_the_star_table_walks_past_it', () => {
    const { game, queue, store } = sceneSetup();
    enter(game, 'observatory', 'fromHall');
    tapAt(game, queue, 139, 155);
    walkOut(game);

    const { player } = game.snapshot();
    expect(store.getState().dialogue).toBeNull();
    expect(Math.floor(player.x / TILE)).toBe(17);
    expect(Math.floor(player.y / TILE)).toBe(19);
  });

  it('the_wall_below_a_dark_note_walks_instead_of_reading_it', () => {
    const { game, queue, store } = sceneSetup();
    enter(game, 'dark', 'fromRoom');
    clickThrough(store); // the first-arrival lantern line
    tapAt(game, queue, 192, 46);
    walkOut(game);

    const { player } = game.snapshot();
    expect(store.getState().dialogue).toBeNull();
    expect(player.y).toBeGreaterThanOrEqual(48);
  });
});
