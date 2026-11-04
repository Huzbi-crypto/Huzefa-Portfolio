import { ACTIVE_PALETTE, SPRITES } from '@/game/art';
import { TERM, TERM_SCREEN } from '@/game/art/sprites/archive';
import { screenTextPixels } from '@/game/art/sprites/archiveGlyphs';
import { copy } from '@/game/content/copy';
import { projectStarId } from '@/game/content/stars';
import type { Light } from '@/game/render/lighting';
import { drawSprite } from '@/game/render/sprite';
import { TILE } from '@/game/world/grid';
import { createShell, MAX_INPUT, runCommand, type ShellState } from './logic/miniShell';
import { tryExhibit } from './exhibit';
import { projectFor, type ArchiveExhibit, type At } from './archiveKit';

const COLORS = ACTIVE_PALETTE;
const PROJECT_ID = 'term-exp';
/** How many typed letters of a command fit on the little screen's first row. */
const SHOWN_LETTERS = 5;

export type TermExhibit = ArchiveExhibit & {
  /** The prompt's memory, so a test can see that a tap counted as a try. */
  shell(): ShellState;
};

/** One command the visitor can type, or tap when they have no keyboard. */
export type TermPromptChoice = {
  id: string;
  label: string;
  /** The line the choice sends. Undefined means "close the terminal". */
  line?: string;
};

/** A command and what the rude little shell said back. */
export type TermPromptLine = {
  command: string;
  output: readonly string[];
};

/** The real DOM prompt's state. React renders this; the exhibit owns the shell. */
export type TermPromptState = {
  /** Changes on every session, so React knows to reset the field and focus. */
  id: number;
  label: string;
  kicker: string;
  close: string;
  closeLabel: string;
  inputLabel: string;
  hint: string;
  choicesLabel: string;
  outputLabel: string;
  intro: readonly string[];
  history: readonly TermPromptLine[];
  choices: readonly TermPromptChoice[];
};

type PromptSession = {
  state: TermPromptState;
  run(line: string): readonly string[];
  closed(): void;
};

let nextId = 1;
let active: PromptSession | null = null;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of [...listeners]) listener();
}

/** Subscribe to prompt changes. Returns the unsubscribe function. */
export function subscribeTermPrompt(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** The prompt's current state, or null when no terminal is open. */
export function termPromptState(): TermPromptState | null {
  return active?.state ?? null;
}

export function isTermPromptOpen(): boolean {
  return active !== null;
}

/** Close the prompt and let the exhibit carry on to the project panel. */
export function closeTermPrompt(): void {
  const session = active;
  if (!session) return;

  active = null;
  emit();
  session.closed();
}

/**
 * Run one line at the prompt. Blank lines are harmless and leave no history.
 * The exhibit owns the shell, so the same `runCommand` drives the DOM and the
 * little screen drawn on the canvas.
 */
export function submitTermPrompt(line: string): void {
  const session = active;
  if (!session) return;

  const command = line.trim().slice(0, MAX_INPUT);
  if (!command) return;

  const output = session.run(command);
  session.state = {
    ...session.state,
    history: [...session.state.history, { command, output }],
  };
  emit();
}

function openTermPrompt(options: {
  intro: readonly string[];
  choices: readonly TermPromptChoice[];
  run(line: string): readonly string[];
  closed(): void;
}): void {
  // A second terminal replaces the first rather than leaving it waiting forever.
  closeTermPrompt();

  active = {
    state: {
      id: nextId,
      label: copy.archive.term.promptLabel,
      kicker: copy.archive.term.promptKicker,
      close: copy.archive.term.promptClose,
      closeLabel: copy.archive.term.promptCloseLabel,
      inputLabel: copy.archive.term.promptInputLabel,
      hint: copy.archive.term.promptHint,
      choicesLabel: copy.archive.term.promptChoicesLabel,
      outputLabel: copy.archive.term.promptOutputLabel,
      intro: [...options.intro],
      history: [],
      choices: [...options.choices],
    },
    run: options.run,
    closed: options.closed,
  };
  nextId += 1;
  emit();
}

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
 * A very small terminal on a stool. The visitor types at a real DOM prompt and
 * the little shell is rude about all of it. The same choices stay on screen so
 * a phone without a keyboard earns the star just as easily.
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

  const choices: TermPromptChoice[] = [
    ...copy.archive.term.commands.map((c) => ({
      id: c.id,
      label: `> ${c.line}`,
      line: c.line,
    })),
    { id: 'leave', label: copy.archive.term.leaveLabel },
  ];

  return {
    id: PROJECT_ID,
    projectId: PROJECT_ID,
    rect: { x: at.x, y: at.y, w: TERM.w, h: TERM.h },
    hitRects: [{ x: at.x, y: at.y, w: TERM.w, h: TERM.h }],
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
      const closed = new Promise<void>((resolve) => {
        openTermPrompt({
          intro: copy.archive.term.intro,
          choices,
          run: (line) => {
            const result = runCommand(line, shell);
            shell = result.state;
            const word = line.trim().split(/\s+/)[0]?.toLowerCase() ?? '';
            lastLine = word;
            const known = copy.archive.term.commands.find((command) => command.id === word);
            reply = known
              ? (copy.archive.term.screenReply as Record<string, string>)[known.id] ??
                copy.archive.term.screenUnknown
              : copy.archive.term.screenUnknown;
            // The first real command is a try, whatever it was.
            if (result.trying) api.store.award(star);
            return result.output;
          },
          closed: () => resolve(),
        });
      });

      await closed;
      // Opening and closing the prompt is not a try. Only a real command
      // earns the star and the project card.
      if (shell.trying) await tryExhibit(api, project.id);
    },
  };
}
