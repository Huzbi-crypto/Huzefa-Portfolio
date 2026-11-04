import { ACTIVE_PALETTE, SPRITES } from '@/game/art';
import { CAN_KNOT } from '@/game/art/sprites/workshop';
import { copy } from '@/game/content/copy';
import { projectStarId } from '@/game/content/stars';
import type { Light } from '@/game/render/lighting';
import { drawSprite } from '@/game/render/sprite';
import type { GameApi } from '@/game/scene/types';
import type { Tile } from '@/game/world/grid';
import { tryExhibit } from './exhibit';
import { translate } from './logic/translator';
import { clamp01 } from './logic/types';
import { createPlayback } from './playback';
import type { Exhibit } from './types';

type Point = { x: number; y: number };

/** A point on the sagging string, `t` along from `a` (0) to `b` (1), on whole pixels. */
export function stringPoint(a: Point, b: Point, sag: number, t: number): Point {
  const k = clamp01(t);
  return {
    x: Math.round(a.x + (b.x - a.x) * k),
    y: Math.round(a.y + (b.y - a.y) * k + sag * 4 * k * (1 - k)),
  };
}

/**
 * Which spoken sounds are on the string right now, and how far along (in
 * pixels from the speaking can). The first sound leads; the rest follow `gap`
 * pixels apart. Nothing is on the string before the trip or after it.
 */
export function barsAlong(
  count: number,
  progress: number,
  length: number,
  gap: number,
): { index: number; along: number }[] {
  const lead = Math.round(clamp01(progress) * (length + (count - 1) * gap));
  const bars: { index: number; along: number }[] = [];
  for (let index = 0; index < count; index += 1) {
    const along = lead - index * gap;
    if (along > 0 && along < length) bars.push({ index, along });
  }
  return bars;
}

const C = ACTIVE_PALETTE;
const CAN = { w: 24, h: 16 } as const;
const CRATE = { w: 26, h: 16 } as const;
const SAG = 9;
const SOUND_GAP = 3;
const SPEAK_MS = 2800;
const COUNTER = 'workshop-speech-turns';

type Bubble = 'none' | 'dots' | 'text';

function sprite(name: string) {
  const found = SPRITES[name];
  if (!found) throw new Error(`Missing sprite: ${name}`);
  return found;
}

/**
 * Two tin cans on a string. `at` is the left crate; the right one stands 140
 * pixels along. The visitor chooses something to say; sound bars cross the
 * string and the other can answers in other words.
 */
export function createSpeechTranslator(at: Point, stand: Tile): { exhibit: Exhibit; light: Light } {
  const play = createPlayback();
  let reduced = false;
  let sent: { bars: number[]; output: string } | null = null;
  let bubble: Bubble = 'none';

  const rightCrate: Point = { x: at.x + 140, y: at.y };
  const canY = at.y - CAN.h + 3;
  const left: Point = { x: at.x + 2, y: canY };
  const right: Point = { x: rightCrate.x, y: canY };
  const knotA: Point = { x: left.x + CAN_KNOT.x, y: canY + CAN_KNOT.y + 1 };
  const knotB: Point = { x: right.x, y: canY + CAN_KNOT.y + 1 };
  const length = knotB.x - knotA.x;

  const light: Light = { x: right.x + 12, y: canY - 6, radius: 16, tint: 'cool' };

  const exhibit: Exhibit = {
    id: 'speech-translator',
    projectId: 'speech-translator',
    rect: { x: at.x, y: canY - 22, w: rightCrate.x + CRATE.w - at.x, h: CRATE.h + CAN.h + 22 },
    stand,
    footY: at.y + CRATE.h,
    label: copy.workshop.speech.label,

    update(ms, ctx) {
      reduced = ctx.reducedMotion;
      play.update(ms);
      const trip = clamp01((play.progress - 0.05) / 0.65);
      if (play.active && sent && !reduced) {
        const lead = barsAlong(sent.bars.length, trip, length, SOUND_GAP)[0];
        const p = stringPoint(knotA, knotB, SAG, lead ? lead.along / length : trip);
        light.x = p.x;
        light.y = p.y;
        light.radius = 22;
        if (play.progress >= 0.7) bubble = 'dots';
      } else {
        light.x = right.x + 12;
        light.y = canY - 6;
        light.radius = bubble === 'none' ? 16 : 22;
      }
    },

    draw(g, ctx) {
      drawSprite(g, sprite('workshopCanCrate'), at.x, at.y);
      drawSprite(g, sprite('workshopCanCrate'), rightCrate.x, rightCrate.y);
      drawSprite(g, sprite('workshopCan'), left.x, left.y);
      // The listening can jumps a pixel as the sounds arrive.
      const hop = play.active && play.progress > 0.62 && !ctx.reducedMotion ? -(Math.floor(play.elapsed / 90) % 2) : 0;
      drawSprite(g, sprite('workshopCanFlip'), right.x, right.y + hop);
      // The string itself.
      g.fillStyle = C.q;
      for (let i = 0; i <= length; i += 1) {
        const p = stringPoint(knotA, knotB, SAG, i / length);
        g.fillRect(p.x, p.y, 1, 1);
      }
    },

    glow(g, ctx) {
      // Sound rings leave the speaking can's mouth as the visitor talks.
      if (play.active && sent && !ctx.reducedMotion && play.elapsed < 700) {
        const cx = left.x + 3;
        const cy = left.y + 8;
        g.fillStyle = C.C;
        for (let k = 0; k < 3; k += 1) {
          const r = 5 + k * 4 + (Math.floor(play.elapsed / 120) % 3);
          for (let y = -r; y <= r; y += 1) {
            for (let x = -r; x < 0; x += 1) {
              const d = Math.hypot(x, y);
              if (d > r - 0.6 && d <= r + 0.4 && (x + y) % 2 === 0 && Math.abs(y) < r * 0.8) {
                g.fillRect(cx + x, cy + y, 1, 1);
              }
            }
          }
        }
      }

      // The sounds travelling down the string, one bar per letter spoken.
      if (play.active && sent && !ctx.reducedMotion) {
        const trip = clamp01((play.progress - 0.05) / 0.65);
        g.fillStyle = C.t;
        for (const bar of barsAlong(sent.bars.length, trip, length, SOUND_GAP)) {
          const p = stringPoint(knotA, knotB, SAG, bar.along / length);
          const h = sent.bars[bar.index];
          g.fillRect(p.x, p.y - Math.floor(h / 2), 1, h);
        }
      }

      // The other can's answer, as a bubble that fills in with squiggles.
      if (bubble !== 'none' && sent) {
        const bx = right.x - 4;
        const by = canY - 19;
        g.fillStyle = C.a;
        g.fillRect(bx, by, 30, 14);
        g.fillRect(bx + 18, by + 14, 3, 2);
        g.fillRect(bx + 19, by + 16, 1, 1);
        g.fillStyle = C.p;
        g.fillRect(bx + 1, by + 1, 28, 12);
        g.fillRect(bx + 19, by + 14, 1, 2);
        if (bubble === 'dots') {
          const lit = ctx.reducedMotion ? 3 : (Math.floor(ctx.t / 220) % 3) + 1;
          g.fillStyle = C.a;
          for (let i = 0; i < lit; i += 1) g.fillRect(bx + 8 + i * 5, by + 6, 2, 2);
        } else {
          g.fillStyle = C.B;
          let x = bx + 4;
          let y = by + 4;
          for (const word of sent.output.split(' ')) {
            const w = Math.min(10, Math.max(2, word.length * 2));
            if (x + w > bx + 27) {
              x = bx + 4;
              y += 4;
            }
            if (y > by + 9) break;
            g.fillRect(x, y, w, 2);
            x += w + 2;
          }
        }
      }
    },

    async use(api: GameApi) {
      const text = copy.workshop.speech;
      const turn = api.store.count(COUNTER);
      api.store.increment(COUNTER);
      const choice = await api.store.say(
        [text.prompt],
        text.phrases.map((p) => ({ id: p.id, label: p.text })),
      );
      const phrase = text.phrases.find((p) => p.id === choice) ?? text.phrases[0];
      const result = translate(phrase.text, turn + 1);
      sent = { bars: result.bars, output: result.output };
      bubble = 'none';
      api.store.award(projectStarId('speech-translator'));

      const finished = await play.start(SPEAK_MS, reduced);
      if (!finished) return;
      bubble = 'text';

      await api.store.say([
        `${text.heard} "${result.output}"`,
        turn === 0 ? text.lost : text.again,
      ]);
      await tryExhibit(api, 'speech-translator');
    },
  };

  return { exhibit, light };
}
