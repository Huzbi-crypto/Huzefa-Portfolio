// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, createElement, useEffect } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { AppProvider, useApp } from '@/context/AppContext';
import { loadProgress } from '@/game/state/progress';
import TerminalModal, { awardTerminalSecret, TERMINAL_SECRET_STAR } from './TerminalModal';

let container: HTMLDivElement;
let root: Root;

class MemoryStorage implements Storage {
  private data = new Map<string, string>();

  get length(): number {
    return this.data.size;
  }

  clear(): void {
    this.data.clear();
  }

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.data.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}

/** Opens the terminal the way the game does: through the app context. */
function OpenOnMount() {
  const { openTerminal } = useApp();
  useEffect(() => {
    openTerminal();
  }, [openTerminal]);
  return null;
}

beforeEach(() => {
  (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.clear();
  document.documentElement.setAttribute('data-theme', 'cozy-crt');
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => {
    root.unmount();
  });
  container.remove();
  localStorage.clear();
});

async function mountTerminal(): Promise<void> {
  await act(async () => {
    root.render(
      createElement(AppProvider, null, createElement(OpenOnMount), createElement(TerminalModal)),
    );
  });
  // The prompt focuses after a short timeout.
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 80));
  });
}

function input(): HTMLInputElement {
  const found = container.querySelector<HTMLInputElement>('[aria-label="Terminal command prompt input"]');
  if (!found) throw new Error('no terminal input');
  return found;
}

function type(text: string): void {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  if (!setter) throw new Error('no value setter');
  act(() => {
    setter.call(input(), text);
    input().dispatchEvent(new Event('input', { bubbles: true }));
    input().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  });
}

describe('terminal secret', () => {
  it('terminal_secret_awards_star', () => {
    const storage = new MemoryStorage();

    expect(awardTerminalSecret(storage)).toBe(true);
    expect(loadProgress(storage).found).toContain(TERMINAL_SECRET_STAR);

    // A second try is remembered as already found.
    expect(awardTerminalSecret(storage)).toBe(false);
    expect(loadProgress(storage).found.filter((id) => id === TERMINAL_SECRET_STAR)).toHaveLength(1);
  });

  it('awards_nothing_when_storage_is_missing', () => {
    expect(awardTerminalSecret(null)).toBe(true);
    expect(awardTerminalSecret(null)).toBe(true);
  });
});

describe('terminal shell', () => {
  it('terminal_blocks_player_input', async () => {
    await mountTerminal();

    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog?.getAttribute('aria-modal')).toBe('true');
    expect(dialog?.getAttribute('aria-label')).toBe('Retro Terminal Interactive Shell');
    expect(document.activeElement).toBe(input());

    // Arrow keys belong to the prompt: no page scroll, no world walk.
    const arrow = new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true });
    act(() => {
      input().dispatchEvent(arrow);
    });
    expect(arrow.defaultPrevented).toBe(true);

    // Esc closes the shell and hands the world back.
    act(() => {
      input().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it('keeps_the_hidden_command_out_of_help_and_awards_it_when_typed', async () => {
    await mountTerminal();

    type('help');
    expect(container.textContent).not.toContain('xyzzy');

    type('xyzzy');
    expect(container.textContent).toContain('A hollow voice says');
    expect(loadProgress(localStorage).found).toContain(TERMINAL_SECRET_STAR);
  });

  it('theme_command_recolours_the_page_in_place', async () => {
    await mountTerminal();
    const before = window.location.href;

    type('theme moonlit-terminal');

    expect(document.documentElement.getAttribute('data-theme')).toBe('moonlit-terminal');
    expect(window.location.href).toBe(before);
  });
});
