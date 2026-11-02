import { PALETTES, SPRITES } from '@/game/art';
import { TERM, TERM_SCREEN } from '@/game/art/sprites/archive';
import { screenTextPixels } from '@/game/art/sprites/archiveGlyphs';
import { copy } from '@/game/content/copy';
import { projectStarId } from '@/game/content/stars';
import type { Light } from '@/game/render/lighting';
import { drawSprite } from '@/game/render/sprite';
import { TILE } from '@/game/world/grid';
import { createShell, runCommand, type ShellState } from './logic/miniShell';
import { tryExhibit } from './exhibit';
import { projectFor, type ArchiveExhibit, type At } from './archiveKit';

const COLORS = PALETTES['cozy-crt'];
const PROJECT_ID = 'term-exp';
/** How many typed letters of a command fit on the little screen's first row. */
const SHOWN_LETTERS = 5;

export type TermExhibit = ArchiveExhibit & {
  /** The prompt's memory, so a test can see that a tap counted as a try. */
  shell(): ShellState;
};

function drawText(
  g: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
): void {
  g.fillStyle = color;
  for (const p of screenTextPixels(text).points) g.fillRect(x + p.x, y + p.y, 1, 1);
}

/**
 * A very small terminal on a stool. The visitor taps suggested commands (or
 * presses their keyboard's choice keys) and the prompt is rude about all of
 * them. Nothing here can fail, and every choice is on-screen, so a phone with
 * no keyboard earns the star as easily as anyone.
 */
export function createTermExp(at: At): TermExhibit {
  const project = projectFor(PROJECT_ID);
  let shell = createShell();
  let lastLine = '';
  let reply: string = copy.archive.term.screenIdle;

  const light: Light = {
    x: at.x + TERM_SCREEN.x + TERM_SCREEN.w / 2,
    y: at.y + TERM_SCREEN.y + TERM_SCREEN.h / 2,
    radius: 26,
    tint: 'cool',
  };

  const choices = [
    ...copy.archive.term.commands.map((c) => ({ id: c.id, label: `> ${c.line}` })),
    { id: 'leave', label: copy.archive.term.leaveLabel },
  ];

  return {
    id: PROJECT_ID,
    projectId: PROJECT_ID,
    rect: { x: at.x, y: at.y, w: TERM.w, h: TERM.h },
    stand: { x: Math.floor((at.x + TERM.w / 2) / TILE), y: Math.floor((at.y + TERM.h) / TILE) },
    footY: at.y + TERM.h,
    label: copy.archive.term.label,
    light,
    shell: () => shell,

    update() {
      // The screen only changes when somebody types at it.
    },

    draw(g) {
      drawSprite(g, SPRITES.archTerminal, at.x, at.y);
    },

    glow(g, ctx) {
      const sx = at.x + TERM_SCREEN.x;
      const sy = at.y + TERM_SCREEN.y;
      g.fillStyle = COLORS.a;
      g.fillRect(sx, sy, TERM_SCREEN.w, TERM_SCREEN.h);
      // Faint scanlines on the glass.
      g.fillStyle = COLORS.b;
      for (let y = 2; y < TERM_SCREEN.h; y += 3) g.fillRect(sx, sy + y, TERM_SCREEN.w, 1);

      drawText(g, `> ${lastLine.slice(0, SHOWN_LETTERS)}`, sx + 1, sy + 1, COLORS.u);
      drawText(g, reply, sx + 1, sy + 7, COLORS.t);
      drawText(g, '>', sx + 1, sy + 13, COLORS.u);
      // A cursor that blinks, or just sits there when motion is off.
      if (ctx.reducedMotion || Math.floor(ctx.t / 500) % 2 === 0) {
        g.fillStyle = COLORS.t;
        g.fillRect(sx + 6, sy + 13, 3, 5);
      }
    },

    async use(api) {
      const star = projectStarId(PROJECT_ID);
      let lines: string[] = [...copy.archive.term.intro];

      for (let guard = 0; guard < 200; guard += 1) {
        const picked = await api.store.say(lines, choices);
        const command = copy.archive.term.commands.find((c) => c.id === picked);
        if (!command) break;

        const result = runCommand(command.line, shell);
        shell = result.state;
        lastLine = command.line.split(/\s+/)[0];
        reply =
          (copy.archive.term.screenReply as Record<string, string>)[command.id] ??
          copy.archive.term.screenUnknown;
        // The first real command is a try, whatever it was.
        if (result.trying) api.store.award(star);
        lines = result.output.length > 0 ? result.output : [copy.archive.term.screenUnknown];
      }

      await tryExhibit(api, project.id);
    },
  };
}
