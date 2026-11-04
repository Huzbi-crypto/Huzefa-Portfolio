import { describe, expect, it, vi } from 'vitest';
import { personalInfo } from '@/data/personal';
import { copy } from '@/game/content/copy';
import { allStarIds, readStarId } from '@/game/content/stars';
import { createStore } from '@/game/state/store';
import { createEntity, stepEntity } from '@/game/world/entity';
import { findPath, TILE } from '@/game/world/grid';
import { navMap } from './nav';
import { createRoomScene } from './room';
import { coversPointer } from './spaceHarness';
import type { GameApi, Hotspot } from './types';

/** The world positions of the two window sprites in the room. */
const WINDOW_SPOTS = [
  { x: 24, y: 4 },
  { x: 232, y: 4 },
] as const;

function setup() {
  const store = createStore(null);
  const scene = createRoomScene(store);
  const api: GameApi = {
    store,
    goTo: vi.fn(),
    openTerminal: vi.fn(),
    showProject: vi.fn(async () => undefined),
  };
  return { store, scene, api };
}

/** Run a hotspot and click through its dialogue, choosing `choice` at the end. */
async function interact(
  hotspot: Hotspot,
  api: GameApi,
  choice?: string,
): Promise<string[]> {
  const said: string[] = [];
  let finished = false;
  const done = Promise.resolve(hotspot.onInteract(api)).then(() => {
    finished = true;
  });
  // A hotspot may open a follow-up dialogue once the first one closes, so
  // let promise callbacks run between clicks.
  for (let guard = 0; !finished && guard < 200; guard += 1) {
    await new Promise((resolve) => setTimeout(resolve, 0));
    const dialogue = api.store.getState().dialogue;
    if (dialogue) {
      said.push(...dialogue.lines);
      api.store.advance(choice);
    }
  }
  await done;
  return [...new Set(said)];
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
      ['cat', 'clue:note', 'door', 'lamp', 'monitor', 'note', 'rug', 'shelf', 'sofa', 'tea', 'window', 'window-two'],
    );
  });

  it('the_second_note_starts_the_clue_trail', async () => {
    const { scene, api, store } = setup();
    const said = await interact(byId(scene, 'clue:note'), api);
    expect(store.hasClue('clue:note')).toBe(true);
    expect(said.join(' ')).toContain(copy.clues.note.lines[1]);
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

  it('every_room_hotspot_has_a_tight_pointer_target_inside_its_bounds', () => {
    const { scene } = setup();
    for (const h of scene.hotspots) {
      expect(h.hitRects, `${h.id} has no hitRects`).toBeDefined();
      expect(h.hitRects!.length, `${h.id} has no pointer target`).toBeGreaterThan(0);
      for (const rect of h.hitRects!) {
        expect(rect.x, h.id).toBeGreaterThanOrEqual(h.rect.x);
        expect(rect.y, h.id).toBeGreaterThanOrEqual(h.rect.y);
        expect(rect.x + rect.w, h.id).toBeLessThanOrEqual(h.rect.x + h.rect.w);
        expect(rect.y + rect.h, h.id).toBeLessThanOrEqual(h.rect.y + h.rect.h);
      }
    }
  });

  it('the_sofa_lamp_and_rug_only_claim_their_own_pixels', () => {
    const { scene } = setup();
    const sofa = byId(scene, 'sofa');
    // The old sofa rect began at its sprite edge; the transparent margin and
    // the floor beside it now walk instead of selecting the sofa.
    expect(coversPointer(sofa, sofa.rect.x, sofa.rect.y)).toBe(false);
    expect(coversPointer(sofa, sofa.rect.x + 20, sofa.rect.y + 12)).toBe(true);

    const lamp = byId(scene, 'lamp');
    expect(coversPointer(lamp, lamp.rect.x, lamp.rect.y + 32)).toBe(false);
    expect(coversPointer(lamp, lamp.rect.x + 6, lamp.rect.y + 20)).toBe(true);

    const rug = byId(scene, 'rug');
    expect(coversPointer(rug, rug.rect.x, rug.rect.y)).toBe(false);
    expect(coversPointer(rug, rug.rect.x + 24, rug.rect.y + 16)).toBe(true);
  });

  it('the_notes_and_tea_only_claim_the_paper_and_the_cup', () => {
    const { scene } = setup();
    for (const id of ['note', 'clue:note', 'tea']) {
      const h = byId(scene, id);
      expect(coversPointer(h, h.rect.x + 4, h.rect.y + 4), id).toBe(true);
      expect(coversPointer(h, h.rect.x + 4, h.rect.y + h.rect.h - 4), id).toBe(false);
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

  it('every_window_has_a_hotspot_the_visitor_can_reach_and_use', async () => {
    const { scene, api, store } = setup();
    const covered = new Set<Hotspot>();

    for (const spot of WINDOW_SPOTS) {
      const middle = { x: spot.x + 16, y: spot.y + 16 };
      const hotspot = scene.hotspots.find(
        (h) =>
          h.rect.x <= middle.x &&
          h.rect.x + h.rect.w >= middle.x &&
          h.rect.y <= middle.y &&
          h.rect.y + h.rect.h >= middle.y,
      );
      expect(hotspot, `a hotspot over the window at ${spot.x},${spot.y}`).toBeDefined();
      covered.add(hotspot!);

      // The walk ends on the stand tile centre, so that point must be close
      // enough to the rect for the game's interaction range to fire.
      const px = hotspot!.stand.x * TILE + TILE / 2;
      const py = hotspot!.stand.y * TILE + TILE / 2;
      const dx = Math.max(hotspot!.rect.x - px, 0, px - (hotspot!.rect.x + hotspot!.rect.w));
      const dy = Math.max(hotspot!.rect.y - py, 0, py - (hotspot!.rect.y + hotspot!.rect.h));
      expect(Math.hypot(dx, dy), `the stand for the window at ${spot.x}`).toBeLessThanOrEqual(14);

      const said = await interact(hotspot!, api);
      expect(said.join(' '), `the window at ${spot.x}`).toContain(copy.window.none[0]);
    }

    expect(covered.size).toBe(WINDOW_SPOTS.length);
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

/**
 * Run a hotspot, answering every dialogue with `pick`, which sees the choice
 * ids on offer and the lines. Returns once the hotspot's promise settles.
 */
async function play(
  hotspot: Hotspot,
  api: GameApi,
  pick: (choices: string[], lines: readonly string[]) => string | undefined,
): Promise<void> {
  let finished = false;
  const done = Promise.resolve(hotspot.onInteract(api)).then(() => {
    finished = true;
  });
  for (let guard = 0; !finished && guard < 400; guard += 1) {
    await new Promise((resolve) => setTimeout(resolve, 0));
    const dialogue = api.store.getState().dialogue;
    if (!dialogue) continue;
    // Choose once per dialogue: on its last line, with the text fully shown.
    const last = dialogue.line === dialogue.lines.length - 1 && dialogue.typed >= dialogue.lines[dialogue.line].length;
    api.store.advance(last ? pick(dialogue.choices.map((c) => c.id), dialogue.lines) : undefined);
  }
  await done;
  expect(finished, 'the hotspot finished').toBe(true);
}

describe('the whole shelf', () => {
  const readIds = personalInfo.readingList.map((item) => readStarId(item.title));

  /** Walk the shelf menus until `target` is on offer, then take it. */
  function fetchBook(target: string) {
    const triedRows = new Set<string>();
    return (choices: string[]): string | undefined => {
      if (choices.includes(target)) return target;
      const row = choices.find((id) => id.startsWith('row:') && !triedRows.has(id));
      if (row) {
        triedRows.add(row);
        return row;
      }
      return choices.includes('leave') ? 'leave' : choices[choices.length - 1];
    };
  }

  it('shelf_reaches_every_reading_item', { timeout: 20_000 }, async () => {
    const { scene, api, store } = setup();
    let have = 0;
    for (const id of readIds) {
      await play(byId(scene, 'shelf'), api, fetchBook(id));
      have += 1;
      expect(store.getState().found, id).toContain(id);
      expect(store.getState().found.filter((f) => f.startsWith('read:')), id).toHaveLength(have);
    }
  });

  it('each_shelf_item_awards_once', async () => {
    const { scene, api, store } = setup();
    const target = readIds[readIds.length - 1];
    await play(byId(scene, 'shelf'), api, fetchBook(target));
    const after = store.getState().found.length;
    await play(byId(scene, 'shelf'), api, fetchBook(target));
    expect(store.getState().found.length).toBe(after);
    expect(store.award(target)).toBe(false);
  });

  it('every_book_shows_huzbis_opinion', { timeout: 20_000 }, async () => {
    for (const item of personalInfo.readingList) {
      const { scene, api } = setup();
      const seen: string[] = [];
      const fetch = fetchBook(readStarId(item.title));
      await play(byId(scene, 'shelf'), api, (choices, lines) => {
        seen.push(...lines);
        return fetch(choices);
      });
      expect(seen.join(' '), item.title).toContain(item.note ?? item.title);
    }
  });

  it('leaving_the_shelf_awards_nothing_and_never_traps', async () => {
    const { scene, api, store } = setup();
    await play(byId(scene, 'shelf'), api, (choices) => (choices.includes('leave') ? 'leave' : choices[0]));
    expect(store.getState().found).toHaveLength(0);
  });

  it('the_shelf_menus_stay_small', async () => {
    const { scene, api } = setup();
    const sizes: number[] = [];
    let visits = 0;
    await play(byId(scene, 'shelf'), api, (choices) => {
      sizes.push(choices.length);
      visits += 1;
      if (visits === 1) return 'row:0';
      return choices.includes('leave') ? 'leave' : 'back';
    });
    await play(byId(scene, 'shelf'), api, (choices) => {
      sizes.push(choices.length);
      return 'leave';
    });
    expect(Math.max(...sizes)).toBeLessThanOrEqual(7);
  });
});

describe('silly stars in the room', () => {
  const none = () => undefined;

  it('sitting_on_the_sofa_awards_a_star_once', async () => {
    const { scene, api, store } = setup();
    await play(byId(scene, 'sofa'), api, none);
    expect(store.getState().found).toContain('silly:sofa');
    const after = store.getState().found.length;
    await play(byId(scene, 'sofa'), api, none);
    expect(store.getState().found.length).toBe(after);
  });

  it('the_lamp_has_a_joke_and_a_star', async () => {
    const { scene, api, store } = setup();
    await play(byId(scene, 'lamp'), api, none);
    expect(store.getState().found).toContain('silly:lamp');
  });

  it('the_rug_has_a_joke_and_a_star', async () => {
    const { scene, api, store } = setup();
    await play(byId(scene, 'rug'), api, none);
    expect(store.getState().found).toContain('silly:rug');
  });

  it('reading_the_note_a_third_time_awards_its_own_star', async () => {
    const { scene, api, store } = setup();
    await play(byId(scene, 'note'), api, none);
    await play(byId(scene, 'note'), api, none);
    expect(store.getState().found).not.toContain('silly:note-thrice');
    await play(byId(scene, 'note'), api, none);
    expect(store.getState().found).toContain('silly:note-thrice');
  });

  it('checking_the_tea_a_third_time_drinks_it', async () => {
    const { scene, api, store } = setup();
    await play(byId(scene, 'tea'), api, none);
    await play(byId(scene, 'tea'), api, none);
    expect(store.getState().found).not.toContain('silly:drink-tea');
    await play(byId(scene, 'tea'), api, none);
    expect(store.getState().found).toContain('silly:drink-tea');
  });

  it('waving_at_the_sky_five_times_is_noticed', async () => {
    const { scene, api, store } = setup();
    for (let i = 0; i < 4; i += 1) await play(byId(scene, 'window'), api, none);
    expect(store.getState().found).not.toContain('silly:wave-at-sky');
    await play(byId(scene, 'window-two'), api, none);
    expect(store.getState().found).toContain('silly:wave-at-sky');
  });

  it('staying_out_three_times_gets_called_a_chicken', async () => {
    const { scene, api, store } = setup();
    for (let i = 0; i < 2; i += 1) await play(byId(scene, 'door'), api, () => 'stay');
    expect(store.getState().found).not.toContain('silly:door-chicken');
    await play(byId(scene, 'door'), api, () => 'stay');
    expect(store.getState().found).toContain('silly:door-chicken');
    expect(api.goTo).not.toHaveBeenCalled();
  });

  it('the_new_hotspots_are_reachable', () => {
    const { scene } = setup();
    const nav = navMap(scene.map);
    for (const id of ['sofa', 'lamp', 'rug']) {
      const h = byId(scene, id);
      expect(nav.solid[h.stand.y * nav.w + h.stand.x], id).toBe(0);
      const path = findPath(nav, scene.spawn, h.stand);
      expect(path[path.length - 1] ?? scene.spawn, id).toEqual(h.stand);
      const px = h.stand.x * TILE + TILE / 2;
      const py = h.stand.y * TILE + TILE / 2;
      const dx = Math.max(h.rect.x - px, 0, px - (h.rect.x + h.rect.w));
      const dy = Math.max(h.rect.y - py, 0, py - (h.rect.y + h.rect.h));
      expect(Math.hypot(dx, dy), id).toBeLessThanOrEqual(14);
    }
  });
});
