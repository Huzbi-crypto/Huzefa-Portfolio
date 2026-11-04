import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { personalInfo } from '@/data/personal';
import { PALETTES } from '@/game/art';
import { copy } from '@/game/content/copy';
import { allStarIds } from '@/game/content/stars';
import { createStore } from '@/game/state/store';
import { findPath, TILE } from '@/game/world/grid';
import { navMap } from './nav';
import { CONTACT_LINKS, createNap, mailtoHref } from './nap';
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

const setup = (opts: { reducedMotion?: boolean } = {}) => harness(createNap, opts);

describe('nap room layout', () => {
  it('map_matches_world_size', () => {
    const { scene } = setup();
    expect(scene.id).toBe('nap');
    expect(scene.map.w * TILE).toBe(scene.worldW);
    expect(scene.map.h * TILE).toBe(scene.worldH);
  });

  it('arrival_from_the_observatory_is_free_ground_beside_the_moon_door', () => {
    const { scene } = setup();
    const at = scene.entries?.fromObservatory;
    expect(at).toBeDefined();
    expect(scene.map.solid[at!.y * scene.map.w + at!.x]).toBe(0);
    const exit = byId(scene, 'exit');
    expect(Math.abs(at!.x - exit.stand.x) + Math.abs(at!.y - exit.stand.y)).toBeLessThanOrEqual(2);
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

  it('can_leave_after_ending', async () => {
    const env = setup();
    await interact(env, byId(env.scene, 'sleeper'), ['wake', 'leave-alone']);
    await interact(env, byId(env.scene, 'exit'), 'back');
    expect(env.api.goTo).toHaveBeenCalledWith('observatory', 'fromNap');
  });

  it('the_moon_door_can_be_declined_so_nobody_is_trapped', async () => {
    const env = setup();
    await interact(env, byId(env.scene, 'exit'), 'stay');
    expect(env.api.goTo).not.toHaveBeenCalled();
  });
});

describe('the ending', () => {
  it('ending_shows_real_contact_details', async () => {
    const env = setup();
    const said = (
      await interact(env, byId(env.scene, 'sleeper'), ['wake', 'say-hi'])
    ).join(' ');
    expect(said).toContain(personalInfo.email);
    expect(said).toContain(personalInfo.socials.github);
    expect(said).toContain(personalInfo.socials.linkedin);
    expect(said).toContain(personalInfo.socials.myanimelist);
  });

  it('say_hi_is_a_mailto', () => {
    const href = mailtoHref();
    expect(href.startsWith(`mailto:${personalInfo.email}`)).toBe(true);
    expect(href).toContain(encodeURIComponent(copy.nap.mail.subject));
    expect(href).toContain(encodeURIComponent(copy.nap.mail.body));
    const email = CONTACT_LINKS.find((link) => link.id === 'email');
    expect(email?.href).toBe(href);
    expect(CONTACT_LINKS.map((link) => link.href)).toContain(personalInfo.socials.github);
  });

  it('the_wake_up_line_matches_the_stars_found', async () => {
    const env = setup();
    const said = (
      await interact(env, byId(env.scene, 'sleeper'), ['wake', 'leave-alone'])
    ).join(' ');
    expect(said).toContain(copy.nap.wake.few[1]);
    expect(said).not.toContain(copy.nap.wake.full[2]);
  });

  it('the_full_line_is_reserved_for_every_star', async () => {
    const store = createStore(null);
    for (const id of allStarIds()) store.award(id);
    const env = harness(createNap, { store });
    const said = (
      await interact(env, byId(env.scene, 'sleeper'), ['wake', 'leave-alone'])
    ).join(' ');
    expect(said).toContain(copy.nap.wake.full[2]);
  });

  it('the_wake_up_has_its_comic_beats_before_the_line', async () => {
    const env = setup();
    const said = await interact(env, byId(env.scene, 'sleeper'), ['wake', 'leave-alone']);
    const beats = [copy.nap.sleeper.stir[0], copy.nap.sleeper.slide[0], copy.nap.sleeper.sitUp[0]];
    for (const beat of beats) expect(said).toContain(beat);
    expect(said.indexOf(beats[2])).toBeLessThan(said.indexOf(copy.nap.wake.few[0]));
  });

  it('a_return_with_more_stars_gets_the_full_line_not_the_short_one', async () => {
    const store = createStore(null);
    store.markEndingSeen('few');
    for (const id of allStarIds()) store.award(id);
    const env = harness(createNap, { store });
    const said = (
      await interact(env, byId(env.scene, 'sleeper'), ['wake', 'leave-alone'])
    ).join(' ');
    expect(said).toContain(copy.nap.wake.full[2]);
    expect(said).not.toContain(copy.nap.again.full[0]);
  });

  it('the_ending_is_remembered_so_the_second_visit_is_short', async () => {
    const env = setup();
    await interact(env, byId(env.scene, 'sleeper'), ['wake', 'leave-alone']);
    const again = await interact(env, byId(env.scene, 'sleeper'), ['wake', 'leave-alone']);
    expect(again.join(' ')).toContain(copy.nap.again.few[0]);
  });
});

describe('nap art', () => {
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
