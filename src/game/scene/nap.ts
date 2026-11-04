import { personalInfo } from '@/data/personal';
import { ACTIVE_PALETTE, SPRITES } from '@/game/art';
import { copy } from '@/game/content/copy';
import { drawSprite } from '@/game/render/sprite';
import type { GameStore } from '@/game/state/store';
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

type SleepPose = 'asleep' | 'stir' | 'slide' | 'sitUp' | 'awake';

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
 * time since the pose began, so the wake-up lands as comic beats: a cough, the
 * manga skidding off, one eye then both, up on an elbow, sitting, a grin and a
 * wave. Reduced motion shows one still frame per pose instead.
 */
export function sleeperFrame(
  pose: SleepPose,
  t: number,
  elapsed: number,
  reducedMotion: boolean,
): string {
  if (pose === 'stir') return reducedMotion || t % 360 < 180 ? 'sleeperCough0' : 'sleeperCough1';
  if (pose === 'slide') {
    if (reducedMotion || elapsed < 700) return 'sleeperStir';
    return elapsed < 1500 ? 'sleeperOneEye' : 'sleeperBothEyes';
  }
  if (pose === 'sitUp') return reducedMotion || elapsed >= 600 ? 'sleeperSitUp' : 'sleeperRise';
  if (pose === 'awake') {
    if (reducedMotion || elapsed > 3000) return 'sleeperAwake';
    return Math.floor(elapsed / 420) % 2 === 0 ? 'sleeperAwake' : 'sleeperAwake1';
  }
  if (reducedMotion) return 'sleeperAsleep0';
  return t % 1800 < 900 ? 'sleeperAsleep0' : 'sleeperAsleep1';
}

/** True once the manga has left his face and is lying on the floor. */
export function mangaOnFloor(pose: SleepPose, elapsed: number, reducedMotion: boolean): boolean {
  if (pose === 'sitUp' || pose === 'awake') return true;
  return pose === 'slide' && !reducedMotion && elapsed >= 700;
}

type PoseRef = { current: SleepPose; since: number | null };

function setPose(ref: PoseRef, pose: SleepPose): void {
  ref.current = pose;
  // The clock for the new pose starts at the next draw.
  ref.since = null;
}

function poseElapsed(ref: PoseRef, t: number): number {
  if (ref.since === null) ref.since = t;
  return t - ref.since;
}

function buildSleeperProp(ref: PoseRef): SpaceProp {
  return {
    id: 'sleeper',
    footY: AT.sleeper.y + 46,
    draw: (g, ctx) =>
      drawSprite(
        g,
        sprite(sleeperFrame(ref.current, ctx.t, poseElapsed(ref, ctx.t), ctx.reducedMotion)),
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

async function contactBeat(api: GameApi): Promise<void> {
  const { store } = api;
  const { found, total } = store.getState();
  const line = endingLine(found.length, total);
  const previous = store.seenEndingLine();
  const first = previous === null;
  // Coming back with more stars earns the proper version of the conversation,
  // not just the short "you again" line.
  const upgraded = previous !== null && ENDING_RANK[line] > ENDING_RANK[previous];

  await store.say([
    ...(first || upgraded ? copy.nap.wake[line] : copy.nap.again[line]),
  ]);
  store.markEndingSeen(line);

  const choice = await store.say(
    [...copy.nap.afterWake, ...contactLines(), copy.nap.contact.lead],
    [
      { id: 'say-hi', label: copy.nap.sayHiLabel },
      { id: 'leave-alone', label: copy.nap.leaveAloneLabel },
    ],
  );

  if (choice === 'say-hi') {
    setContactCardOpen(true);
    await store.say([...copy.nap.sayHiReply]);
    return;
  }
  await store.say([...copy.nap.leaveAloneReply]);
}

async function talkToSleeper(api: GameApi, ref: PoseRef): Promise<void> {
  if (ref.current === 'awake') {
    await contactBeat(api);
    return;
  }

  const choice = await api.store.say([...copy.nap.sleeper.look], [
    { id: 'wake', label: copy.nap.sleeper.wakeLabel },
    { id: 'leave', label: copy.nap.sleeper.leaveLabel },
  ]);

  if (choice !== 'wake') {
    await api.store.say([...copy.nap.sleeper.leaveReply]);
    return;
  }

  // Three comic beats, one line each, so the wake-up has time to land.
  setPose(ref, 'stir');
  await api.store.say([...copy.nap.sleeper.stir]);
  setPose(ref, 'slide');
  await api.store.say([...copy.nap.sleeper.slide]);
  setPose(ref, 'sitUp');
  await api.store.say([...copy.nap.sleeper.sitUp]);
  setPose(ref, 'awake');

  await contactBeat(api);
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
        if (!mangaOnFloor(ref.current, poseElapsed(ref, ctx.t), ctx.reducedMotion)) return;
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
  };
}

export function createNap(store: GameStore): Scene {
  // Coming back after the ending must not replay the comic wake-up beats.
  const seen = store.seenEndingLine() !== null;
  // A revisit starts already awake, with the wave long finished.
  const ref: PoseRef = seen
    ? { current: 'awake', since: Number.NEGATIVE_INFINITY }
    : { current: 'asleep', since: null };
  return createDarkSpace(buildSpaceDef(ref), store);
}
