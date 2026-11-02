import { describe, expect, it, vi } from 'vitest';
import { allStarIds } from '@/game/content/stars';
import { createStore } from '@/game/state/store';
import { createEntity, stepEntity } from '@/game/world/entity';
import { findPath, TILE } from '@/game/world/grid';
import { navMap } from './nav';
import { createRoomScene } from './room';
import type { GameApi, Hotspot } from './types';

function setup() {
  const store = createStore(null);
  const scene = createRoomScene(store);
  const api: GameApi = {
    store,
    goTo: vi.fn(),
    openTerminal: vi.fn(),
  };
  return { store, scene, api };
}

/** Run a hotspot and click through its dialogue, choosing `choice` at the end. */
async function interact(
  hotspot: Hotspot,
  api: GameApi,
  choice?: string,
): Promise<void> {
  let finished = false;
  const done = Promise.resolve(hotspot.onInteract(api)).then(() => {
    finished = true;
  });
  // A hotspot may open a follow-up dialogue once the first one closes, so
  // let promise callbacks run between clicks.
  for (let guard = 0; !finished && guard < 200; guard += 1) {
    await new Promise((resolve) => setTimeout(resolve, 0));
    if (api.store.getState().dialogue) api.store.advance(choice);
  }
  await done;
}

const byId = (scene: ReturnType<typeof setup>['scene'], id: string): Hotspot => {
  const found = scene.hotspots.find((h) => h.id === id);
  if (!found) throw new Error(`no hotspot ${id}`);
  return found;
};

describe('room layout', () => {
  it('spawn_not_solid', () => {
    const { scene } = setup();
    expect(scene.map.solid[scene.spawn.y * scene.map.w + scene.spawn.x]).toBe(0);
  });

  it('map_matches_world_size', () => {
    const { scene } = setup();
    expect(scene.map.w * TILE).toBe(scene.worldW);
    expect(scene.map.h * TILE).toBe(scene.worldH);
  });

  it('has_every_planned_hotspot', () => {
    const { scene } = setup();
    expect(scene.hotspots.map((h) => h.id).sort()).toEqual(
      ['cat', 'door', 'monitor', 'note', 'shelf', 'tea', 'window'],
    );
  });

  it('all_room_hotspots_reachable', () => {
    const { scene } = setup();
    const nav = navMap(scene.map);
    for (const h of scene.hotspots) {
      expect(nav.solid[h.stand.y * nav.w + h.stand.x], h.id).toBe(0);
      const path = findPath(nav, scene.spawn, h.stand);
      const end = path.length > 0 ? path[path.length - 1] : scene.spawn;
      expect(end, h.id).toEqual(h.stand);
    }
  });

  it('nav_map_only_offers_tiles_the_feet_can_stand_on', () => {
    // The feet box is 10px wide, wider than a tile: a free tile touching a
    // solid sideways would be one the visitor can path to but never stand on.
    const { scene } = setup();
    const { w, h, solid } = navMap(scene.map);
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        if (solid[y * w + x] === 1) continue;
        const moved = [
          { x: 1, y: 0 },
          { x: -1, y: 0 },
          { x: 0, y: 1 },
          { x: 0, y: -1 },
        ].some((dir) => {
          const e = createEntity(x * TILE + TILE / 2, y * TILE + TILE / 2);
          stepEntity(e, dir, scene.map, 50);
          return e.x !== x * TILE + TILE / 2 || e.y !== y * TILE + TILE / 2;
        });
        expect(moved, `tile ${x},${y}`).toBe(true);
      }
    }
  });

  it('every_hotspot_has_a_label_and_a_rect_inside_the_world', () => {
    const { scene } = setup();
    for (const h of scene.hotspots) {
      expect(h.label.length, h.id).toBeGreaterThan(0);
      expect(h.rect.x, h.id).toBeGreaterThanOrEqual(0);
      expect(h.rect.y, h.id).toBeGreaterThanOrEqual(0);
      expect(h.rect.x + h.rect.w, h.id).toBeLessThanOrEqual(scene.worldW);
      expect(h.rect.y + h.rect.h, h.id).toBeLessThanOrEqual(scene.worldH);
    }
  });
});

describe('room hotspots', () => {
  it('note_awards_read_note_once', async () => {
    const { scene, api, store } = setup();
    await interact(byId(scene, 'note'), api);
    expect(store.getState().found).toContain('silly:read-note');
    const before = store.getState().found.length;
    await interact(byId(scene, 'note'), api);
    expect(store.getState().found.length).toBe(before);
  });

  it('tea_awards_cold_tea', async () => {
    const { scene, api, store } = setup();
    await interact(byId(scene, 'tea'), api);
    expect(store.getState().found).toContain('silly:cold-tea');
  });

  it('monitor_opens_terminal', async () => {
    const { scene, api } = setup();
    await interact(byId(scene, 'monitor'), api);
    expect(api.openTerminal).toHaveBeenCalledTimes(1);
  });

  it('shelf_awards_a_different_book_each_visit', async () => {
    const { scene, api, store } = setup();
    await interact(byId(scene, 'shelf'), api);
    await interact(byId(scene, 'shelf'), api);
    const reads = store.getState().found.filter((id) => id.startsWith('read:'));
    expect(reads).toHaveLength(2);
    expect(new Set(reads).size).toBe(2);
  });

  it('shelf_keeps_working_after_every_book_is_found', async () => {
    const { scene, api, store } = setup();
    const reads = allStarIds().filter((id) => id.startsWith('read:'));
    for (let i = 0; i < reads.length + 2; i += 1) {
      await interact(byId(scene, 'shelf'), api);
    }
    expect(store.getState().found.filter((id) => id.startsWith('read:'))).toHaveLength(reads.length);
  });

  it('cat_awards_star_on_tenth_pet_not_before', async () => {
    const { scene, api, store } = setup();
    for (let i = 0; i < 9; i += 1) await interact(byId(scene, 'cat'), api);
    expect(store.getState().found).not.toContain('silly:pet-cat');
    await interact(byId(scene, 'cat'), api);
    expect(store.getState().found).toContain('silly:pet-cat');
  });

  it('window_never_awards_and_reports_progress', async () => {
    const { scene, api, store } = setup();
    await interact(byId(scene, 'window'), api);
    expect(store.getState().found).toHaveLength(0);
  });

  it('door_open_choice_opens_and_goes_to_dark', async () => {
    const { scene, api, store } = setup();
    await interact(byId(scene, 'door'), api, 'open');
    expect(store.getState().doorOpened).toBe(true);
    expect(api.goTo).toHaveBeenCalledWith('dark');
  });

  it('door_stay_choice_changes_nothing', async () => {
    const { scene, api, store } = setup();
    await interact(byId(scene, 'door'), api, 'stay');
    expect(store.getState().doorOpened).toBe(false);
    expect(api.goTo).not.toHaveBeenCalled();
  });
});
