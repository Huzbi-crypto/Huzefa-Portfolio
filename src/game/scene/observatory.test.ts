import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import snapshot from '@/data/github-snapshot.json';
import { PALETTES } from '@/game/art';
import { copy } from '@/game/content/copy';
import { allStarIds, starTotal } from '@/game/content/stars';
import { PLAQUE } from '@/game/art/sprites/ending';
import { TRAIL } from '@/game/state/story';
import { findPath, TILE } from '@/game/world/grid';
import { navMap } from './nav';
import {
  constellationStars,
  createObservatory,
  MAP_BOUNDS,
  plaqueLayout,
  skyStars,
} from './observatory';
import {
  byId,
  fakeGraphics,
  harness,
  installFakeDocument,
  interact,
  painted,
} from './spaceHarness';

let undo: () => void;
beforeAll(() => {
  undo = installFakeDocument();
});
afterAll(() => undo());

const setup = (opts: { reducedMotion?: boolean } = {}) => harness(createObservatory, opts);

describe('observatory layout', () => {
  it('map_matches_world_size', () => {
    const { scene } = setup();
    expect(scene.id).toBe('observatory');
    expect(scene.map.w * TILE).toBe(scene.worldW);
    expect(scene.map.h * TILE).toBe(scene.worldH);
  });

  it('arrival_from_the_hall_is_free_ground_beside_the_stairs', () => {
    const { scene } = setup();
    const at = scene.entries?.fromHall;
    expect(at).toBeDefined();
    expect(scene.map.solid[at!.y * scene.map.w + at!.x]).toBe(0);
    const exit = byId(scene, 'exit');
    expect(Math.abs(at!.x - exit.stand.x) + Math.abs(at!.y - exit.stand.y)).toBeLessThanOrEqual(2);
  });

  it('arrival_from_the_nap_room_is_free_ground_beside_the_moon_door', () => {
    const { scene } = setup();
    const at = scene.entries?.fromNap;
    expect(at).toBeDefined();
    expect(scene.map.solid[at!.y * scene.map.w + at!.x]).toBe(0);
  });

  it('all_stands_reachable', () => {
    const { scene } = setup();
    const nav = navMap(scene.map);
    for (const h of scene.hotspots) {
      expect(nav.solid[h.stand.y * nav.w + h.stand.x], `${h.id} stand is blocked`).toBe(0);
      const path = findPath(nav, scene.spawn, h.stand);
      const last = path[path.length - 1] ?? scene.spawn;
      expect(last, h.id).toEqual(h.stand);
    }
  });

  it('every_stand_is_close_enough_to_use_its_hotspot', () => {
    const { scene } = setup();
    for (const h of scene.hotspots) {
      const px = h.stand.x * TILE + TILE / 2;
      const py = h.stand.y * TILE + TILE / 2;
      const dx = Math.max(h.rect.x - px, 0, px - (h.rect.x + h.rect.w));
      const dy = Math.max(h.rect.y - py, 0, py - (h.rect.y + h.rect.h));
      expect(Math.hypot(dx, dy), h.id).toBeLessThanOrEqual(14);
    }
  });

  it('the_plaque_stand_is_below_the_brass_not_on_it', () => {
    const { scene } = setup();
    const plaque = byId(scene, 'stats-plaque');
    const brassTop = plaque.rect.y;
    const brassBottom = brassTop + PLAQUE.h;
    const standX = plaque.stand.x * TILE + TILE / 2;
    const standY = plaque.stand.y * TILE + TILE / 2;
    // The 24px visitor is drawn from its feet up, and the feet sit 3px below
    // the stand's centre. The whole head must start under the plaque's edge.
    const footY = standY + 3;
    const headY = footY - 24;
    expect(plaque.stand.y * TILE, 'the stand tile starts below the brass').toBeGreaterThanOrEqual(
      brassBottom,
    );
    expect(headY, 'the visitor head is clear of the brass').toBeGreaterThanOrEqual(brassBottom);

    // A tall interaction rect bridges the empty wall between brass and stand,
    // so the plaque stays usable from that clear tile.
    expect(plaque.rect.y + plaque.rect.h).toBeGreaterThan(brassBottom);
    const dx = Math.max(plaque.rect.x - standX, 0, standX - (plaque.rect.x + plaque.rect.w));
    const dy = Math.max(plaque.rect.y - standY, 0, standY - (plaque.rect.y + plaque.rect.h));
    expect(Math.hypot(dx, dy)).toBeLessThanOrEqual(14);
  });

  it('the_plaque_foot_line_sits_at_its_visible_bottom_border', () => {
    const { scene } = setup();
    const plaque = byId(scene, 'stats-plaque');
    const standFoot = plaque.stand.y * TILE + TILE / 2 + 3;
    // Walking past below the brass must draw the visitor over it, never under.
    expect(standFoot).toBeGreaterThan(plaque.rect.y + PLAQUE.h);
  });

  it('the_stairs_lead_back_to_the_hall_and_can_be_declined', async () => {
    const env = setup();
    await interact(env, byId(env.scene, 'exit'), 'stay');
    expect(env.api.goTo).not.toHaveBeenCalled();
    await interact(env, byId(env.scene, 'exit'), 'back');
    expect(env.api.goTo).toHaveBeenCalledWith('dark', 'fromObservatory');
  });
});

describe('the star map of real repos', () => {
  const repos = snapshot.repositories;

  it('constellation_uses_real_repo_data', () => {
    const stars = constellationStars();
    expect(stars.map((s) => s.name).sort()).toEqual(repos.map((r) => r.name).sort());
    for (const star of stars) {
      const repo = repos.find((r) => r.name === star.name)!;
      expect(star.stars).toBe(repo.stargazers_count);
      expect(star.language).toBe(repo.language);
    }
  });

  it('every_repo_star_sits_inside_the_glass_and_none_overlap', () => {
    const stars = constellationStars();
    const seen = new Set<string>();
    for (const s of stars) {
      expect(Number.isInteger(s.x) && Number.isInteger(s.y), s.name).toBe(true);
      expect(s.x).toBeGreaterThanOrEqual(MAP_BOUNDS.x);
      expect(s.x).toBeLessThanOrEqual(MAP_BOUNDS.x + MAP_BOUNDS.w);
      expect(s.y).toBeGreaterThanOrEqual(MAP_BOUNDS.y);
      expect(s.y).toBeLessThanOrEqual(MAP_BOUNDS.y + MAP_BOUNDS.h);
      const key = `${s.x},${s.y}`;
      expect(seen.has(key), `${s.name} overlaps another star`).toBe(false);
      seen.add(key);
    }
  });

  it('the_map_is_the_same_every_visit', () => {
    expect(constellationStars()).toEqual(constellationStars());
  });

  it('reading_the_map_names_a_real_repo_and_the_count', async () => {
    const env = setup();
    const said = (await interact(env, byId(env.scene, 'star-map'))).join(' ');
    expect(said).toContain(copy.observatory.map.count(repos.length));
    const brightest = [...repos].sort((a, b) => b.stargazers_count - a.stargazers_count)[0];
    expect(said).toContain(brightest.name);
  });

  it('the_plaque_numbers_and_date_fit_inside_the_brass', () => {
    const { stats } = snapshot;
    const numbers = [
      String(stats.totalRepos),
      String(stats.totalStarsReceived),
      String(stats.totalFollowers),
    ];
    const layout = plaqueLayout(numbers, stats.snapshotDate);
    const inner = { x: 6, y: 6, w: PLAQUE.w - 12, h: PLAQUE.h - 12 };
    const glyphHeight = 5;

    expect(layout.rows.map((row) => row.text)).toEqual(numbers);
    expect(layout.date.text).toBe(stats.snapshotDate);
    for (const row of [...layout.rows, layout.date]) {
      expect(row.x, row.text).toBeGreaterThanOrEqual(inner.x);
      expect(row.x + row.w, row.text).toBeLessThanOrEqual(inner.x + inner.w);
      expect(row.y, row.text).toBeGreaterThanOrEqual(inner.y);
      expect(row.y + glyphHeight, row.text).toBeLessThanOrEqual(inner.y + inner.h);
    }
  });

  it('the_plaque_gives_honest_numbers_and_the_date_they_were_taken', async () => {
    const env = setup();
    const said = (await interact(env, byId(env.scene, 'stats-plaque'))).join(' ');
    const { stats } = snapshot;
    expect(said).toContain(stats.snapshotDate);
    expect(said).toContain(
      copy.observatory.stats.numbers(
        stats.totalRepos,
        stats.totalStarsReceived,
        stats.totalFollowers,
        stats.snapshotDate,
      ),
    );
  });
});

describe('the sky of found stars', () => {
  it('found_stars_appear_in_sky', () => {
    const ids = allStarIds();
    expect(skyStars([]).every((s) => !s.lit)).toBe(true);
    const lit = skyStars([ids[0], ids[3]]).filter((s) => s.lit);
    expect(lit.map((s) => s.id).sort()).toEqual([ids[0], ids[3]].sort());
  });

  it('one_slot_for_every_star_in_the_game', () => {
    const sky = skyStars([]);
    expect(sky).toHaveLength(starTotal());
    expect(new Set(sky.map((s) => `${s.x},${s.y}`)).size).toBe(sky.length);
  });

  it('a_star_found_in_play_lights_without_reloading', async () => {
    const env = setup();
    env.store.award('silly:sofa');
    expect(skyStars(env.store.getState().found).filter((s) => s.lit)).toHaveLength(1);
  });

  it('looking_up_counts_the_lit_stars_honestly', async () => {
    const env = setup();
    env.store.award('silly:sofa');
    const said = (await interact(env, byId(env.scene, 'sky'))).join(' ');
    expect(said).toContain(copy.observatory.sky.lines(1, starTotal())[1]);
  });
});

describe('the telescope and the moon door', () => {
  const door = (env: ReturnType<typeof setup>) => byId(env.scene, 'nap-door');

  it('the_telescope_is_the_observatorys_clue', async () => {
    const env = setup();
    expect(byId(env.scene, 'clue:observatory')).toBeDefined();
    await interact(env, byId(env.scene, 'clue:observatory'));
    expect(env.store.hasClue('clue:observatory')).toBe(true);
  });

  it('nap_door_stays_shut_until_endingUnlocked_with_a_hint_and_no_dead_end', async () => {
    const env = setup();
    const said = (await interact(env, door(env), 'go')).join(' ');
    expect(env.api.goTo).not.toHaveBeenCalled();
    expect(said).toContain(copy.observatory.napDoor.shut[0]);
    // The hint names the first clue still to find, so a shut door always points somewhere.
    expect(said).toContain(copy.observatory.napDoor.hints['clue:note']);
  });

  it('the_hint_moves_on_as_the_trail_is_followed', async () => {
    const env = setup();
    env.store.markClue('clue:note');
    env.store.markClue('clue:hall');
    const said = (await interact(env, door(env))).join(' ');
    expect(said).toContain(copy.observatory.napDoor.hints['clue:workshop']);
    expect(said).not.toContain(copy.observatory.napDoor.hints['clue:note']);
  });

  it('the_door_opens_without_a_single_star_once_the_trail_is_done', async () => {
    const env = setup();
    for (const id of TRAIL) env.store.markClue(id);
    expect(env.store.getState().found).toHaveLength(0);
    await interact(env, door(env), 'go');
    expect(env.api.goTo).toHaveBeenCalledWith('nap', 'fromObservatory');
  });

  it('the_open_door_can_be_declined_so_nobody_is_pushed_in', async () => {
    const env = setup();
    for (const id of TRAIL) env.store.markClue(id);
    await interact(env, door(env), 'stay');
    expect(env.api.goTo).not.toHaveBeenCalled();
  });

  it('the_telescope_finishes_the_trail_when_the_rest_is_done', async () => {
    const env = setup();
    for (const id of TRAIL.slice(0, 4)) env.store.markClue(id);
    await interact(env, door(env));
    expect(env.api.goTo).not.toHaveBeenCalled();
    await interact(env, byId(env.scene, 'clue:observatory'));
    await interact(env, door(env), 'go');
    expect(env.api.goTo).toHaveBeenCalledWith('nap', 'fromObservatory');
  });
});

describe('observatory art', () => {
  it('art_uses_palette_only', () => {
    const env = setup();
    painted.colors.clear();
    env.scene.draw(fakeGraphics(), env.ctx());
    const allowed = new Set(Object.values(PALETTES['cozy-crt']).map((c) => c.toLowerCase()));
    allowed.add('#000000');
    for (const color of painted.colors) expect(allowed.has(color), color).toBe(true);
  });

  it('draws_every_frame_in_calm_mode_too', () => {
    const env = setup({ reducedMotion: true });
    expect(() => env.scene.draw(fakeGraphics(), env.ctx())).not.toThrow();
  });
});
