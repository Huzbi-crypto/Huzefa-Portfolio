import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { personalInfo } from '@/data/personal';
import { PALETTES } from '@/game/art';
import { SLEEPER } from '@/game/art/sprites/ending';
import { copy } from '@/game/content/copy';
import { allStarIds } from '@/game/content/stars';
import { createStore } from '@/game/state/store';
import { findPath, TILE } from '@/game/world/grid';
import { navMap } from './nav';
import { CONTACT_LINKS, createNap, mailtoHref, mangaOnFloor, sleeperFrame } from './nap';
import {
  byId,
  coversPointer,
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

  it('the_sofa_only_claims_the_sofa_not_the_floor_around_it', () => {
    const { scene } = setup();
    const sleeper = byId(scene, 'sleeper');
    expect(sleeper.hitRects).toHaveLength(1);
    const [hit] = sleeper.hitRects!;
    expect(hit).toEqual({
      x: sleeper.rect.x,
      y: sleeper.rect.y,
      w: SLEEPER.w,
      h: SLEEPER.h,
    });
    // The floor below the sofa used to select the sleeper; it must walk now.
    expect(coversPointer(sleeper, sleeper.rect.x + 32, sleeper.rect.y + 60)).toBe(false);
    expect(coversPointer(sleeper, sleeper.rect.x + 32, sleeper.rect.y + 40)).toBe(true);
  });

  it('every_nap_hotspot_has_a_pointer_target_inside_its_bounds', () => {
    const { scene } = setup();
    for (const h of scene.hotspots.filter((spot) => spot.id !== 'exit')) {
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

  it('reentering_the_nap_room_does_not_replay_the_wake_up', async () => {
    const store = createStore(null);
    const first = harness(createNap, { store });
    await interact(first, byId(first.scene, 'sleeper'), ['wake', 'leave-alone']);

    const second = harness(createNap, { store });
    const said = (
      await interact(second, byId(second.scene, 'sleeper'), ['wake', 'say-hi'])
    ).join(' ');
    expect(said).not.toContain(copy.nap.sleeper.stir[0]);
    expect(said).not.toContain(copy.nap.sleeper.slide[0]);
    expect(said).toContain(copy.nap.again.few[0]);
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

describe('the wake-up beats', () => {
  it('plays_cough_slide_one_eye_both_eyes_rise_sit_up_then_a_waving_grin_by_time', () => {
    expect(sleeperFrame('stir', 0, 0, false)).toBe('sleeperCough0');
    expect(sleeperFrame('stir', 200, 0, false)).toBe('sleeperCough1');
    expect(sleeperFrame('slide', 0, 0, false)).toBe('sleeperStir');
    expect(sleeperFrame('slide', 0, 900, false)).toBe('sleeperOneEye');
    expect(sleeperFrame('slide', 0, 1800, false)).toBe('sleeperBothEyes');
    expect(sleeperFrame('sitUp', 0, 100, false)).toBe('sleeperRise');
    expect(sleeperFrame('sitUp', 0, 900, false)).toBe('sleeperSitUp');
    expect(sleeperFrame('awake', 0, 0, false)).toBe('sleeperAwake');
    expect(sleeperFrame('awake', 0, 500, false)).toBe('sleeperAwake1');
    expect(sleeperFrame('awake', 0, 9000, false)).toBe('sleeperAwake');
  });

  it('reduced_motion_holds_one_still_frame_per_pose', () => {
    expect(sleeperFrame('slide', 0, 5000, true)).toBe('sleeperStir');
    expect(sleeperFrame('sitUp', 0, 0, true)).toBe('sleeperSitUp');
    expect(sleeperFrame('awake', 0, 500, true)).toBe('sleeperAwake');
    expect(mangaOnFloor('slide', 5000, true)).toBe(false);
  });

  it('the_manga_lands_on_the_floor_only_after_it_slides_off', () => {
    expect(mangaOnFloor('asleep', 0, false)).toBe(false);
    expect(mangaOnFloor('slide', 100, false)).toBe(false);
    expect(mangaOnFloor('slide', 800, false)).toBe(true);
    expect(mangaOnFloor('awake', 0, false)).toBe(true);
  });
});

describe('Huzbi after the conversation', () => {
  const phaseOf = (env: { store: ReturnType<typeof createStore> }) => env.store.huzbi().phase;

  async function wakeAndLeave(env: ReturnType<typeof setup>) {
    return interact(env, byId(env.scene, 'sleeper'), ['wake', 'leave-alone']);
  }

  /** Like `interact`, but each answer is spent only on a real choice, in order. */
  async function chooseIn(env: ReturnType<typeof setup>, ids: string[]): Promise<string[]> {
    const said: string[] = [];
    const answers = [...ids];
    let finished = false;
    const done = Promise.resolve(byId(env.scene, 'sleeper').onInteract(env.api)).then(() => {
      finished = true;
    });
    for (let guard = 0; !finished && guard < 900; guard += 1) {
      await new Promise((resolve) => setTimeout(resolve, 0));
      env.tick(100);
      const d = env.api.store.getState().dialogue;
      if (!d) continue;
      said.push(...d.lines);
      const ready = d.typed >= (d.lines[d.line]?.length ?? 0);
      const asking = ready && d.choices.length > 0 && d.line === d.lines.length - 1;
      env.api.store.advance(asking ? answers.shift() : undefined);
    }
    await done;
    return said;
  }

  /** Puts the clock back at the start of the post-talk cycle, whatever the harness stepped. */
  const freshCycle = (env: ReturnType<typeof setup>) => env.store.setHuzbiPhase('lowering');

  it('the_hand_lowers_when_the_conversation_ends', async () => {
    const env = setup();
    await wakeAndLeave(env);
    expect(phaseOf(env)).toBe('lowering');
    expect(sleeperFrame('lowering', 0, 0, false)).toBe('sleeperLower');
    expect(sleeperFrame('lowering', 0, 0, false)).not.toBe(sleeperFrame('awake', 0, 0, false));
  });

  it('he_sits_for_a_beat_then_reads_after_the_wake_sequence', async () => {
    const env = setup();
    await wakeAndLeave(env);
    freshCycle(env);
    env.tick(1000);
    expect(phaseOf(env)).toBe('sitting');
    env.tick(2000);
    expect(phaseOf(env)).toBe('sitting');
    env.tick(3000);
    expect(phaseOf(env)).toBe('reaching');
    env.tick(1500);
    expect(phaseOf(env)).toBe('reading');
    expect(sleeperFrame('reading', 0, 0, false)).toBe('sleeperRead0');
  });

  it('he_lies_back_and_sleeps_again_after_reading', async () => {
    const env = setup();
    await wakeAndLeave(env);
    freshCycle(env);
    env.tick(28500);
    expect(phaseOf(env)).toBe('laying');
    env.tick(3000);
    expect(phaseOf(env)).toBe('asleep');
    expect(sleeperFrame('asleep', 0, 0, false)).toBe('sleeperAsleep0');
  });

  it('the_phase_survives_leaving_and_reentering_the_room', async () => {
    const store = createStore(null);
    const first = harness(createNap, { store });
    await wakeAndLeave(first);
    freshCycle(first);
    first.tick(900 + 4000 + 1500);
    expect(store.huzbi().phase).toBe('reading');

    const second = harness(createNap, { store });
    expect(store.huzbi().phase).toBe('reading');
    const said = await interact(second, byId(second.scene, 'sleeper'), 'let-read');
    expect(said.join(' ')).not.toContain(copy.nap.sleeper.stir[0]);
    expect(said).toContain(copy.nap.reading.look[0]);

    store.setHuzbiPhase('asleep');
    const third = harness(createNap, { store });
    expect(store.huzbi().phase).toBe('asleep');
    expect(third.scene.id).toBe('nap');
  });

  it('a_second_wake_uses_different_copy_from_the_first', async () => {
    const env = setup();
    const first = (await wakeAndLeave(env)).join(' ');
    env.tick(60000);
    expect(phaseOf(env)).toBe('asleep');

    const second = (await wakeAndLeave(env)).join(' ');
    expect(first).toContain(copy.nap.sleeper.look[0]);
    expect(first).toContain(copy.nap.sleeper.stir[0]);
    expect(second).not.toContain(copy.nap.sleeper.look[0]);
    expect(second).not.toContain(copy.nap.sleeper.stir[0]);
    expect(second).toContain(copy.nap.sleeper.lookAgain[0]);
    expect(second).toContain(copy.nap.sleeper.stirAgain[0]);
    expect(second).toContain(copy.nap.rewake.opening[0][0]);
    expect(second).not.toContain(copy.nap.wake.few[0]);
  });

  it('reading_offers_let_him_read_ask_and_tap_without_breaking_the_cycle', async () => {
    const env = setup();
    await wakeAndLeave(env);
    freshCycle(env);
    env.tick(7000);
    expect(phaseOf(env)).toBe('reading');

    const letRead = await interact(env, byId(env.scene, 'sleeper'), 'let-read');
    expect(letRead).toContain(copy.nap.reading.letReply[0][0]);
    expect(phaseOf(env)).toBe('reading');

    const asked = await interact(env, byId(env.scene, 'sleeper'), 'ask');
    expect(asked).toContain(copy.nap.reading.ask[0][0]);
    const askedAgain = await interact(env, byId(env.scene, 'sleeper'), 'ask');
    expect(askedAgain).toContain(copy.nap.reading.ask[1][0]);

    const tapped = await chooseIn(env, ['tap', 'back']);
    expect(tapped).toContain(copy.nap.reading.tap[1]);
    expect(tapped).toContain(copy.nap.reading.backReply[0]);
    expect(phaseOf(env)).toBe('reading');

    // the schedule still runs: he lies back and sleeps again
    env.tick(30000);
    expect(phaseOf(env)).toBe('asleep');
  });

  it('a_chat_never_gets_cut_off_by_his_schedule', async () => {
    const env = setup();
    await wakeAndLeave(env);
    freshCycle(env);
    env.tick(7000);
    void env.store.say(['A long chat.']);
    env.tick(60000);
    expect(phaseOf(env)).toBe('reading');
    env.store.advance();
  });

  it('reduced_motion_still_runs_the_cycle_and_keeps_one_frame_per_phase', async () => {
    const env = setup({ reducedMotion: true });
    await wakeAndLeave(env);
    const seen: Record<string, string> = {};
    for (const phase of ['lowering', 'sitting', 'reaching', 'reading', 'laying', 'asleep'] as const) {
      const frames = new Set([0, 700, 1900, 2300, 4000].map((t) => sleeperFrame(phase, t, t, true)));
      expect(frames.size, phase).toBe(1);
      seen[phase] = [...frames][0];
    }
    expect(new Set(Object.values(seen)).size).toBe(6);

    freshCycle(env);
    env.tick(1000);
    expect(phaseOf(env)).toBe('sitting');
    env.tick(5500);
    expect(phaseOf(env)).toBe('reading');
    const said = await interact(env, byId(env.scene, 'sleeper'), 'ask');
    expect(said).toContain(copy.nap.reading.ask[0][0]);
    env.tick(30000);
    expect(phaseOf(env)).toBe('asleep');
    expect(() => env.scene.draw(fakeGraphics(), env.ctx())).not.toThrow();
  });

  it('the_manga_leaves_the_floor_when_he_picks_it_up', () => {
    expect(mangaOnFloor('sitting', 0, false)).toBe(true);
    expect(mangaOnFloor('reaching', 100, false)).toBe(true);
    expect(mangaOnFloor('reaching', 900, false)).toBe(false);
    expect(mangaOnFloor('reading', 0, false)).toBe(false);
    expect(mangaOnFloor('asleep', 0, false)).toBe(false);
  });
});
