// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { copy } from '@/game/content/copy';
import { projectStarId } from '@/game/content/stars';
import { createInput } from '@/game/core/input';
import {
  closeTermPrompt,
  createTermExp,
  isTermPromptOpen,
  submitTermPrompt,
  termPromptState,
  type TermExhibit,
} from '@/game/exhibits/termExp';
import type { GameApi } from '@/game/scene/types';
import { createStore, type GameStore } from '@/game/state/store';
import { TermPrompt } from './TermPrompt';

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  closeTermPrompt();
});

afterEach(async () => {
  closeTermPrompt();
  await act(async () => {
    root.unmount();
  });
  container.remove();
});

type Open = {
  term: TermExhibit;
  store: GameStore;
  run: Promise<void>;
};

function fakeApi(store: GameStore): GameApi {
  return {
    store,
    goTo: vi.fn(),
    openTerminal: vi.fn(),
    showProject: vi.fn(async () => undefined),
  };
}

/** Mount the prompt's real DOM and open a terminal session through the exhibit. */
async function openPrompt(): Promise<Open> {
  const store = createStore(null);
  const term = createTermExp({ x: 56, y: 92 });
  const run = term.use(fakeApi(store));

  await act(async () => {
    root.render(createElement(TermPrompt));
    await Promise.resolve();
  });

  return { term, store, run };
}

function dialog(): HTMLElement | null {
  return container.querySelector<HTMLElement>('[role="dialog"]');
}

function commandInput(): HTMLInputElement {
  const input = container.querySelector<HTMLInputElement>('#term-prompt-input');
  if (!input) throw new Error('the prompt input is missing');
  return input;
}

/** React listens to the native value setter, not a plain value assignment. */
function type(value: string): void {
  const input = commandInput();
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    'value',
  )?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

async function submit(): Promise<void> {
  await act(async () => {
    const form = commandInput().form;
    if (!form) throw new Error('the prompt input has no form');
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  });
}

async function settle(run: Promise<void>): Promise<void> {
  await act(async () => {
    closeTermPrompt();
    await run;
  });
}

describe('term-exp prompt', () => {
  it('typing_runs_a_command_and_gets_rude_reply', async () => {
    const { run } = await openPrompt();

    expect(dialog()).not.toBeNull();
    expect(isTermPromptOpen()).toBe(true);

    await act(async () => {
      type('dance');
    });
    await submit();

    const text = container.textContent ?? '';
    expect(text).toContain(`> dance`);
    expect(text).toContain(copy.archive.shell.unknown('dance'));
    expect(termPromptState()?.history).toHaveLength(1);

    await settle(run);
  });

  it('typing_does_not_move_player', async () => {
    const { run } = await openPrompt();

    // The same guard the live game passes into createInput, with the prompt open.
    const input = createInput(container, { isBlocked: isTermPromptOpen });
    const field = commandInput();
    field.focus();

    for (const key of ['ArrowRight', 'ArrowUp', 'd', 'w', ' ']) {
      field.dispatchEvent(
        new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
      );
    }

    expect(input.move).toEqual({ x: 0, y: 0 });
    expect(input.drain()).toEqual([]);
    input.dispose();

    await settle(run);
  });

  it('phone_still_has_choices', async () => {
    const { run, store } = await openPrompt();

    const labels = [...container.querySelectorAll('.term-prompt-choice')].map(
      (button) => button.textContent,
    );
    expect(labels).toEqual(
      expect.arrayContaining([
        '> help',
        '> ls',
        '> cat secrets.txt',
        '> whoami',
        '> sudo make me a sandwich',
        copy.archive.term.leaveLabel,
      ]),
    );

    const help = [...container.querySelectorAll<HTMLButtonElement>('.term-prompt-choice')].find(
      (button) => button.textContent === '> help',
    );
    expect(help).toBeDefined();
    await act(async () => {
      help?.click();
    });

    expect(container.textContent).toContain(copy.archive.shell.help[0]);
    expect(store.getState().found).toContain(projectStarId('term-exp'));

    // Tapping the way out closes it, just like Esc.
    const leave = [...container.querySelectorAll<HTMLButtonElement>('.term-prompt-choice')].find(
      (button) => button.textContent === copy.archive.term.leaveLabel,
    );
    expect(leave).toBeDefined();
    await act(async () => {
      leave?.click();
    });
    expect(dialog()).toBeNull();

    await act(async () => {
      await run;
    });
  });

  it('escape_and_the_visible_close_control_close_it', async () => {
    const { run } = await openPrompt();

    const close = container.querySelector<HTMLButtonElement>('[data-close]');
    expect(close).not.toBeNull();
    expect(close?.getAttribute('aria-label')).toBe(copy.archive.term.promptCloseLabel);

    await act(async () => {
      close?.click();
    });
    expect(dialog()).toBeNull();
    await act(async () => {
      await run;
    });

    const second = await openPrompt();
    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
      );
    });
    expect(dialog()).toBeNull();
    await settle(second.run);
  });

  it('the_input_has_a_label_and_a_short_limit', async () => {
    const { run } = await openPrompt();

    const input = commandInput();
    expect(input.getAttribute('aria-label') ?? '').toBe(copy.archive.term.promptInputLabel);
    expect(Number(input.getAttribute('maxlength'))).toBe(48);

    await settle(run);
  });

  it('submitting_an_unknown_command_shows_the_shell_reply', async () => {
    const { run } = await openPrompt();

    await act(async () => {
      submitTermPrompt('rm -rf everything');
    });
    expect(container.textContent).toContain(copy.archive.shell.unknown('rm'));

    await settle(run);
  });
});
