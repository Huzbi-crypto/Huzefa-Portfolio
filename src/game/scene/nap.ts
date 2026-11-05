import { personalInfo } from '@/data/personal';
import { ACTIVE_PALETTE, SPRITES } from '@/game/art';
import { copy } from '@/game/content/copy';
import { drawSprite } from '@/game/render/sprite';
import type { GameStore } from '@/game/state/store';
import type { HuzbiPhase } from '@/game/state/huzbi';
import { endingLine } from '@/game/state/story';
import { TILE } from '@/game/world/grid';
import { createDarkSpace, type SpaceDef, type SpaceProp } from './space';
import type { GameApi, Scene } from './types';

const WORLD_W = 336;
const WORLD_H = 192;
const WALL_BOTTOM = 48;

const COLORS = ACTIVE_PALETTE;

/** Where everything stands, in world pixels (the top-left of each sprite). */
const AT = {
  exit: { x: 24, y: 4 },
  window: { x: 224, y: 4 },
  clock: { x: 280, y: 30 },
  sleeper: { x: 128, y: 88 },
  lamp: { x: 240, y: 104 },
  lampGlow: { x: 224, y: 100 },
  rug: { x: 112, y: 124 },
  manga: { x: 56, y: 112 },
  fallen: { x: 104, y: 138 },
  mug: { x: 216, y: 152 },
  cat: { x: 292, y: 136 },
} as const;

/** Where the moon door back to the Observatory hangs on the wall. */
export const RETURN_DOOR_AT = { x: AT.exit.x, y: AT.exit.y } as const;

type SleepPose = HuzbiPhase;

function sprite(name: string) {
  const found = SPRITES[name];
  if (!found) throw new Error(`Missing sprite: ${name}`);
  return found;
}

// --- the contact card --------------------------------------------------------

/** The prepared email: a real mailto, no server and no form. */
export function mailtoHref(): string {
  const subject = encodeURIComponent(copy.nap.mail.subject);
  const body = encodeURIComponent(copy.nap.mail.body);
  return `mailto:${personalInfo.email}?subject=${subject}&body=${body}`;
}

export type ContactLink = {
  id: 'email' | 'github' | 'linkedin' | 'myanimelist';
  label: string;
  href: string;
};

/** The real places to find Huzbi, straight from `src/data/personal.ts`. */
export const CONTACT_LINKS: ContactLink[] = [
  { id: 'email', label: copy.nap.contact.sayHi, href: mailtoHref() },
  { id: 'github', label: copy.nap.contact.github, href: personalInfo.socials.github },
  { id: 'linkedin', label: copy.nap.contact.linkedin, href: personalInfo.socials.linkedin },
  { id: 'myanimelist', label: copy.nap.contact.myanimelist, href: personalInfo.socials.myanimelist },
];

/** Every real detail, in one readable list, for the dialogue and the card. */
export function contactLines(): string[] {
  return [
    `${copy.nap.contact.emailLabel}: ${personalInfo.email}`,
    `${copy.nap.contact.github}: ${personalInfo.socials.github}`,
    `${copy.nap.contact.linkedin}: ${personalInfo.socials.linkedin}`,
    `${copy.nap.contact.myanimelist}: ${personalInfo.socials.myanimelist}`,
  ];
}

let contactOpen = false;
const contactListeners = new Set<() => void>();

export function subscribeContactCard(listener: () => void): () => void {
  contactListeners.add(listener);
  return () => {
    contactListeners.delete(listener);
  };
}

export function contactCardOpen(): boolean {
  return contactOpen;
}

export function setContactCardOpen(open: boolean): void {
  if (contactOpen === open) return;

  contactOpen = open;
  for (const listener of [...contactListeners]) listener();
}

// --- speaking to Huzbi -------------------------------------------------------

/**
 * Which sleeper frame to draw. Each pose is a short run of frames played by the
 * time since the pose began, so the wake-up lands as comic beats: the visitor coughs and
 * Huzbi stirs and stretches, the manga skidding off, one eye then both, up on an elbow, sitting, a grin and a
 * wave. Reduced motion shows one still frame per pose instead.
 */
export function sleeperFrame(
  pose: SleepPose,
  t: number,
  elapsed: number,
  reducedMotion: boolean,
): string {
  if (pose === 'stir') return reducedMotion || t % 360 < 180 ? 'sleeperStretch0' : 'sleeperStretch1';
  if (pose === 'slide') {
    if (reducedMotion || elapsed < 700) return 'sleeperSlide';
    return elapsed < 1500 ? 'sleeperOneEye' : 'sleeperBothEyes';
  }
  if (pose === 'sitUp') return reducedMotion || elapsed >= 600 ? 'sleeperSitUp' : 'sleeperRise';
  if (pose === 'awake') {
    if (reducedMotion || elapsed > 3000) return 'sleeperAwake';
    return Math.floor(elapsed / 420) % 2 === 0 ? 'sleeperAwake' : 'sleeperAwake1';
  }
  // After the talk: the hand lowers, he sits, leans for the manga, reads, lies back.
  if (pose === 'lowering') return 'sleeperLower';
  if (pose === 'sitting') return reducedMotion || t % 2400 < 2200 ? 'sleeperSit0' : 'sleeperSit1';
  if (pose === 'reaching') return 'sleeperReach';
  if (pose === 'reading') return reducedMotion || t % 3600 < 1800 ? 'sleeperRead0' : 'sleeperRead1';
  if (pose === 'laying') return 'sleeperLayBack';
  if (reducedMotion) return 'sleeperAsleep0';
  return t % 1800 < 900 ? 'sleeperAsleep0' : 'sleeperAsleep1';
}

/** True while the manga lies on the floor rather than on him or in his hands. */
export function mangaOnFloor(pose: SleepPose, elapsed: number, reducedMotion: boolean): boolean {
  if (pose === 'sitUp' || pose === 'awake' || pose === 'lowering' || pose === 'sitting') return true;
  if (pose === 'reaching') return reducedMotion || elapsed < 600;
  return pose === 'slide' && !reducedMotion && elapsed >= 700;
}

/** Huzbi's phase lives in the store, so it outlasts this scene. */
type PoseRef = { store: GameStore };

const phaseOf = (ref: PoseRef): SleepPose => ref.store.huzbi().phase;
const elapsedOf = (ref: PoseRef): number => ref.store.huzbi().ms;

function setPose(ref: PoseRef, pose: SleepPose): void {
  ref.store.setHuzbiPhase(pose);
}

function buildSleeperProp(ref: PoseRef): SpaceProp {
  return {
    id: 'sleeper',
    footY: AT.sleeper.y + 46,
    draw: (g, ctx) =>
      drawSprite(
        g,
        sprite(sleeperFrame(phaseOf(ref), ctx.t, elapsedOf(ref), ctx.reducedMotion)),
        AT.sleeper.x,
        AT.sleeper.y,
      ),
    interact: {
      rect: { x: AT.sleeper.x, y: AT.sleeper.y, w: 64, h: 70 },
      // Only the sofa and the sleeping Huzbi are clickable; the floor below
      // the sofa is walking space, not part of the sleeper.
      hitRects: [{ x: AT.sleeper.x, y: AT.sleeper.y, w: 64, h: 46 }],
      stand: { x: 20, y: 19 },
      label: copy.nap.sleeper.label,
      use: (api) => talkToSleeper(api, ref),
    },
  };
}

// --- the ending sequence -----------------------------------------------------

const ENDING_RANK = { few: 1, most: 2, full: 3 } as const;

async function contactBeat(api: GameApi, ref: PoseRef, woken: boolean): Promise<void> {
  const { store } = api;
  const { found, total } = store.getState();
  const line = endingLine(found.length, total);
  const previous = store.seenEndingLine();
  const first = previous === null;
  // Coming back with more stars earns the proper version of the conversation,
  // not just the short "you again" line.
  const upgraded = previous !== null && ENDING_RANK[line] > ENDING_RANK[previous];
  const proper = first || upgraded;

  // Woken again after the first time: he remembers, and wants five minutes.
  const times = store.count('nap-rewake');
  const opening = copy.nap.rewake.opening[times % copy.nap.rewake.opening.length];
  if (!proper && woken) store.increment('nap-rewake');

  await store.say(
    proper
      ? [...copy.nap.wake[line]]
      : [...(woken ? opening : []), ...copy.nap.again[line]],
  );
  store.markEndingSeen(line);

  const choice = await store.say(
    [
      ...(proper ? copy.nap.afterWake : copy.nap.rewake.afterWake),
      ...contactLines(),
      copy.nap.contact.lead,
    ],
    [
      { id: 'say-hi', label: copy.nap.sayHiLabel },
      { id: 'leave-alone', label: copy.nap.leaveAloneLabel },
    ],
  );

  if (choice === 'say-hi') {
    setContactCardOpen(true);
    await store.say([...copy.nap.sayHiReply]);
  } else {
    await store.say([...copy.nap.leaveAloneReply]);
  }
  // The wave comes down; from here on he lives his own life. Already seated
  // (a second chat while he sits) means the hand is down, so leave him be.
  if (phaseOf(ref) === 'awake') setPose(ref, 'lowering');
}

/** Huzbi up with a manga: let him read, ask about it, or tap the page. */
async function talkToReader(api: GameApi): Promise<void> {
  const { store } = api;
  const lines = copy.nap.reading;
  const choice = await store.say([...lines.look], [
    { id: 'let-read', label: lines.letLabel },
    { id: 'ask', label: lines.askLabel },
    { id: 'tap', label: lines.tapLabel },
  ]);

  if (choice === 'ask') {
    const n = store.count('nap-reading-ask');
    store.increment('nap-reading-ask');
    await store.say([...lines.ask[n % lines.ask.length]]);
    return;
  }

  if (choice === 'tap') {
    const next = await store.say([...lines.tap], [
      { id: 'say-hi', label: lines.sayHiLabel },
      { id: 'back', label: lines.backLabel },
    ]);
    if (next === 'say-hi') {
      setContactCardOpen(true);
      await store.say([...copy.nap.sayHiReply]);
    } else {
      await store.say([...lines.backReply]);
    }
    return;
  }

  const n = store.count('nap-reading-let');
  store.increment('nap-reading-let');
  await store.say([...lines.letReply[n % lines.letReply.length]]);
}

async function talkToSleeper(api: GameApi, ref: PoseRef): Promise<void> {
  const phase = phaseOf(ref);
  if (phase === 'reading') {
    await talkToReader(api);
    return;
  }
  if (phase === 'reaching' || phase === 'laying') {
    await api.store.say([...copy.nap.sleeper.busy]);
    return;
  }
  if (phase !== 'asleep') {
    // Awake and sitting about: the conversation, not the wake-up.
    await contactBeat(api, ref, false);
    return;
  }

  const again = api.store.seenEndingLine() !== null;
  const sleeper = copy.nap.sleeper;
  const choice = await api.store.say([...(again ? sleeper.lookAgain : sleeper.look)], [
    { id: 'wake', label: sleeper.wakeLabel },
    { id: 'leave', label: sleeper.leaveLabel },
  ]);

  if (choice !== 'wake') {
    await api.store.say([...sleeper.leaveReply]);
    return;
  }

  // Three comic beats, one line each, so the wake-up has time to land.
  setPose(ref, 'stir');
  await api.store.say([...(again ? sleeper.stirAgain : sleeper.stir)]);
  setPose(ref, 'slide');
  await api.store.say([...(again ? sleeper.slideAgain : sleeper.slide)]);
  setPose(ref, 'sitUp');
  await api.store.say([...(again ? sleeper.sitUpAgain : sleeper.sitUp)]);
  setPose(ref, 'awake');

  await contactBeat(api, ref, again);
}

/**
 * Runs Huzbi's clock. Scripted phases only animate; the self-running ones
 * wait while any dialogue is open so a chat is never cut off by his schedule.
 */
function tickHuzbi(store: GameStore, ms: number): void {
  const { phase } = store.huzbi();
  const scripted = phase === 'asleep' || phase === 'stir' || phase === 'slide' || phase === 'sitUp' || phase === 'awake';
  if (!scripted && store.getState().dialogue !== null) return;
  store.tickHuzbi(ms);
}

// --- drawing -----------------------------------------------------------------

function drawShell(g: CanvasRenderingContext2D): void {
  for (let y = 0; y < WORLD_H; y += 16) {
    for (let x = 0; x < WORLD_W; x += 16) {
      let name: string;
      if (y < 32) name = 'wall';
      else if (y === 32) name = 'wallBase';
      else if (y === WALL_BOTTOM) name = 'floorUnderWall';
      else name = ((x / 16) * 7 + (y / 16) * 5) % 11 === 0 ? 'floorAlt' : 'floor';
      drawSprite(g, sprite(name), x, y);
    }
  }

  g.fillStyle = COLORS.a;
  g.fillRect(0, WALL_BOTTOM, TILE, WORLD_H - WALL_BOTTOM);
  g.fillRect(WORLD_W - TILE, WALL_BOTTOM, TILE, WORLD_H - WALL_BOTTOM);
  g.fillRect(0, WORLD_H - TILE, WORLD_W, TILE);
}

function drawBackdrop(g: CanvasRenderingContext2D): void {
  drawShell(g);
  drawSprite(g, sprite('napWindow'), AT.window.x, AT.window.y);
  drawSprite(g, sprite('napClock'), AT.clock.x, AT.clock.y);

  // Floor decals.
  drawSprite(g, sprite('rug'), AT.rug.x, AT.rug.y);
  drawSprite(g, sprite('lampGlow'), AT.lampGlow.x, AT.lampGlow.y);
}

function drawManga(g: CanvasRenderingContext2D): void {
  drawSprite(g, sprite('napMangaStacks'), AT.manga.x, AT.manga.y);
}

function drawCat(g: CanvasRenderingContext2D, ctx: { t: number; reducedMotion: boolean }): void {
  const frame = ctx.reducedMotion || ctx.t % 3200 < 1600 ? 'cat-sitting' : 'cat-sitting-1';
  drawSprite(g, sprite(frame), AT.cat.x, AT.cat.y);
}

// --- the space ---------------------------------------------------------------

function buildProps(ref: PoseRef): SpaceProp[] {
  return [
    // The exit hotspot had no visible door. Reuse the Observatory's moon door
    // so the way back reads before the visitor walks into it.
    {
      id: 'return-door',
      footY: RETURN_DOOR_AT.y + 48,
      // The nap lamp is far away, so paint the door in the glow pass like the
      // Observatory's moon door; it stays readable without adding another light.
      glow: (g) => drawSprite(g, sprite('obsNapDoor'), RETURN_DOOR_AT.x, RETURN_DOOR_AT.y),
    },
    buildSleeperProp(ref),
    {
      id: 'manga',
      footY: AT.manga.y + 18,
      draw: drawManga,
      interact: {
        rect: { x: AT.manga.x, y: AT.manga.y, w: 24, h: 18 },
        hitRects: [{ x: AT.manga.x + 1, y: AT.manga.y + 1, w: 22, h: 16 }],
        stand: { x: 9, y: 17 },
        label: copy.nap.manga.label,
        use: (api) =>
          sayOnce(api, 'nap-manga', copy.nap.manga.lines, copy.nap.manga.again),
      },
    },
    {
      id: 'clock',
      footY: AT.clock.y + 14,
      interact: {
        rect: { x: AT.clock.x, y: AT.clock.y, w: 14, h: 14 },
        hitRects: [{ x: AT.clock.x + 1, y: AT.clock.y + 1, w: 12, h: 12 }],
        stand: { x: 36, y: 6 },
        label: copy.nap.clock.label,
        use: (api) =>
          sayOnce(api, 'nap-clock', copy.nap.clock.lines, copy.nap.clock.again),
      },
    },
    {
      id: 'cat',
      footY: AT.cat.y + 14,
      draw: drawCat,
      interact: {
        rect: { x: AT.cat.x, y: AT.cat.y, w: 16, h: 14 },
        hitRects: [{ x: AT.cat.x + 1, y: AT.cat.y + 1, w: 14, h: 12 }],
        stand: { x: 38, y: 18 },
        label: copy.nap.cat.label,
        use: (api) => sayOnce(api, 'nap-cat', copy.nap.cat.lines, copy.nap.cat.again),
      },
    },
    {
      id: 'lamp',
      footY: AT.lamp.y + 34,
      draw: (g) => drawSprite(g, sprite('lamp'), AT.lamp.x, AT.lamp.y),
    },
    {
      id: 'fallen-manga',
      footY: AT.fallen.y + 10,
      // It only lands on the floor once it has slid off the sleeper's face.
      draw: (g, ctx) => {
        if (!mangaOnFloor(phaseOf(ref), elapsedOf(ref), ctx.reducedMotion)) return;
        drawSprite(g, sprite('napMangaFallen'), AT.fallen.x, AT.fallen.y);
      },
    },
    {
      id: 'mug',
      footY: AT.mug.y + 10,
      draw: (g) => drawSprite(g, sprite('napMug'), AT.mug.x, AT.mug.y),
    },
  ];
}

async function sayOnce(
  api: GameApi,
  counter: string,
  first: readonly string[],
  again: readonly string[],
): Promise<void> {
  const seen = api.store.count(counter);
  api.store.increment(counter);
  await api.store.say([...(seen === 0 ? first : again)]);
}

function buildSpaceDef(ref: PoseRef): SpaceDef {
  return {
    id: 'nap',
    worldW: WORLD_W,
    worldH: WORLD_H,
    solids: [
      { x: 0, y: 0, w: WORLD_W, h: WALL_BOTTOM },
      // The sofa's base, so the visitor walks round it and stands in front.
      { x: AT.sleeper.x + 8, y: AT.sleeper.y + 32, w: 48, h: 14 },
      // The manga and the little lamp.
      { x: AT.manga.x, y: AT.manga.y + 12, w: 24, h: 6 },
      { x: AT.lamp.x + 2, y: AT.lamp.y + 26, w: 10, h: 8 },
    ],
    spawn: { x: 3, y: 6 },
    entries: {
      fromObservatory: { x: 3, y: 6 },
    },
    exits: [
      {
        id: 'exit',
        rect: { x: AT.exit.x, y: AT.exit.y, w: 28, h: 40 },
        stand: { x: 3, y: 6 },
        label: copy.nap.exit.label,
        to: 'observatory',
        entry: 'fromNap',
        lines: copy.nap.exit.lines,
        goLabel: copy.nap.exit.backLabel,
        stayLabel: copy.nap.exit.stayLabel,
        stayReply: copy.nap.exit.stayReply,
      },
    ],
    props: buildProps(ref),
    exhibits: [],
    lights: [
      // One generous lamp, so the whole nap is readable, plus its warm spill
      // over the sofa and a little moonlight from the window.
      { x: AT.lamp.x + 6, y: AT.lamp.y + 14, radius: 150, tint: 'warm' },
      { x: AT.sleeper.x + 32, y: AT.sleeper.y + 18, radius: 44, tint: 'warm' },
      { x: AT.window.x + 18, y: AT.window.y + 20, radius: 24, tint: 'cool' },
    ],
    drawBackdrop,
    update: (ms) => tickHuzbi(ref.store, ms),
  };
}

export function createNap(store: GameStore): Scene {
  // Huzbi's phase lives in the store: coming back finds him reading or asleep,
  // never replaying the first wake-up. Only a half-played wake-up is tidied.
  const { phase } = store.huzbi();
  if (phase === 'stir' || phase === 'slide' || phase === 'sitUp') store.setHuzbiPhase('asleep');
  else if (phase === 'awake') store.setHuzbiPhase('lowering');
  return createDarkSpace(buildSpaceDef({ store }), store);
}
