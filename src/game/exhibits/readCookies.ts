import { PALETTES, SPRITES } from '@/game/art';
import { JAR, JAR_INSIDE } from '@/game/art/sprites/archive';
import { copy } from '@/game/content/copy';
import { projectStarId } from '@/game/content/stars';
import { drawSprite } from '@/game/render/sprite';
import { TILE } from '@/game/world/grid';
import { eatCookie, unlockJar, type Cookie } from './logic/cookies';
import { tryExhibit } from './exhibit';
import { projectFor, type ArchiveExhibit, type At } from './archiveKit';

const COLORS = PALETTES['cozy-crt'];
const PROJECT_ID = 'read-cookies';
/** The most cookie choices offered at once, so a phone's screen never overflows. */
const CHOICES_SHOWN = 4;

/** Where each cookie of the pile sits inside the glass, bottom row first. */
const SLOTS: readonly { x: number; y: number }[] = [
  { x: 0, y: 8 },
  { x: 5, y: 8 },
  { x: 10, y: 8 },
  { x: 2, y: 5 },
  { x: 7, y: 5 },
  { x: 4, y: 2 },
];

type Crumb = { x: number; y: number; age: number };
const CRUMB_MS = 520;

export type CookieExhibit = ArchiveExhibit & {
  /** What is left in the jar, and whether the padlock has been opened. */
  jar(): { cookies: readonly Cookie[]; unlocked: boolean };
};

function drawCookie(g: CanvasRenderingContext2D, x: number, y: number, chip: boolean): void {
  g.fillStyle = COLORS.e;
  g.fillRect(x, y + 1, 5, 3);
  g.fillRect(x + 1, y, 3, 1);
  g.fillStyle = COLORS.h;
  g.fillRect(x + 1, y + 1, 3, 2);
  g.fillStyle = COLORS.i;
  g.fillRect(x + 1, y + 1, 2, 1);
  g.fillStyle = COLORS.f;
  if (chip) g.fillRect(x + 3, y + 2, 1, 1);
}

/**
 * A cookie jar with a padlock that was never locked. Every cookie wears a
 * browser-session label, and eating them all is harmless, if rude.
 */
export function createReadCookies(at: At): CookieExhibit {
  const project = projectFor(PROJECT_ID);
  let cookies: Cookie[] = unlockJar();
  let unlocked = false;
  let crumbs: Crumb[] = [];

  return {
    id: PROJECT_ID,
    projectId: PROJECT_ID,
    rect: { x: at.x, y: at.y, w: JAR.w, h: JAR.h },
    stand: { x: Math.floor((at.x + JAR.w / 2) / TILE), y: Math.floor((at.y + JAR.h) / TILE) },
    footY: at.y + JAR.h,
    label: copy.archive.cookies.label,
    jar: () => ({ cookies, unlocked }),

    update(ms, ctx) {
      if (crumbs.length === 0) return;
      if (ctx.reducedMotion) {
        crumbs = [];
        return;
      }
      crumbs = crumbs
        .map((c) => ({ ...c, age: c.age + ms }))
        .filter((c) => c.age < CRUMB_MS);
    },

    draw(g) {
      drawSprite(g, SPRITES.archJar, at.x, at.y);
      // The pile, bottom up, so the jar always looks packed.
      const ox = at.x + JAR_INSIDE.x;
      const oy = at.y + JAR_INSIDE.y;
      cookies.forEach((_cookie, i) => {
        const slot = SLOTS[i];
        if (slot) drawCookie(g, ox + slot.x, oy + slot.y, i % 2 === 0);
      });
      // The lid sits a little off when the padlock is open.
      if (unlocked) {
        g.fillStyle = COLORS.b;
        g.fillRect(at.x + 8, at.y + 5, 16, 1);
      }

      // The padlock hanging on the front.
      const px = at.x + 13;
      const py = at.y + 14;
      g.fillStyle = COLORS.A;
      if (unlocked) {
        g.fillRect(px + 4, py - 1, 1, 4); // the shackle swung out
        g.fillRect(px + 5, py - 2, 1, 2);
      } else {
        g.fillRect(px + 1, py, 4, 1);
        g.fillRect(px + 1, py + 1, 1, 2);
        g.fillRect(px + 4, py + 1, 1, 2);
      }
      g.fillStyle = COLORS.a;
      g.fillRect(px, py + 3, 6, 6);
      g.fillStyle = COLORS.r;
      g.fillRect(px + 1, py + 4, 4, 4);
      g.fillStyle = COLORS.s;
      g.fillRect(px + 1, py + 4, 4, 1);
      g.fillStyle = COLORS.a;
      g.fillRect(px + 2, py + 5, 2, 2);

      for (const crumb of crumbs) {
        g.fillStyle = COLORS.h;
        g.fillRect(
          at.x + 16 + ((crumb.age * 7) % 9) - 4,
          at.y + 22 + Math.floor((crumb.age / CRUMB_MS) * 6),
          1,
          1,
        );
      }
    },

    async use(api) {
      const text = copy.archive.cookies;

      if (!unlocked) {
        const pick = await api.store.say([...text.intro], [
          { id: 'unlock', label: text.unlockLabel },
          { id: 'leave', label: text.leaveLabel },
        ]);
        if (pick !== 'unlock') {
          await api.store.say([...text.leaveReply]);
          return;
        }
        unlocked = true;
        // Opening it is the try; everything after is eating.
        api.store.award(projectStarId(PROJECT_ID));
      }

      let lines: string[] = cookies.length === 0 ? [text.empty] : [...text.unlocked];
      for (let guard = 0; guard < 60 && cookies.length > 0; guard += 1) {
        const offered = cookies.slice(0, CHOICES_SHOWN).map((c) => ({ id: c.id, label: c.label }));
        const pick = await api.store.say(lines, [...offered, { id: 'enough', label: text.moreLabel }]);
        const eaten = cookies.find((c) => c.id === pick);
        if (!eaten) break;

        const result = eatCookie(cookies, eaten.id);
        cookies = result.cookies;
        crumbs = [0, 90, 200].map((age) => ({ x: 0, y: 0, age }));
        lines = [result.line];
      }
      if (cookies.length === 0) {
        await api.store.say(lines[0] === text.empty ? lines : [...lines, text.empty]);
      }

      await tryExhibit(api, project.id);
    },
  };
}
