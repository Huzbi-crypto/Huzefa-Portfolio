// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { AppProvider } from '@/context/AppContext';
import { PALETTES } from '@/game/art/palette';
import type { Theme } from '@/types/portfolio';
import { ThemeSelector } from './ThemeSelector';

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
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
  document.documentElement.removeAttribute('data-theme');
});

async function mount(): Promise<void> {
  await act(async () => {
    root.render(createElement(AppProvider, null, createElement(ThemeSelector)));
  });
}

function option(theme: Theme): HTMLButtonElement {
  const found = container.querySelector<HTMLButtonElement>(`[data-theme-id="${theme}"]`);
  if (!found) throw new Error(`no theme option for ${theme}`);
  return found;
}

describe('ThemeSelector', () => {
  it('lists_every_theme_as_a_real_button', async () => {
    await mount();

    const themes: Theme[] = ['cozy-crt', 'warm-apartment', 'moonlit-terminal'];
    for (const theme of themes) {
      expect(option(theme).tagName).toBe('BUTTON');
      expect(option(theme).textContent?.trim().length).toBeGreaterThan(0);
    }
  });

  it('marks_the_active_theme_without_colour_alone', async () => {
    await mount();

    expect(option('cozy-crt').getAttribute('aria-pressed')).toBe('true');
    expect(option('warm-apartment').getAttribute('aria-pressed')).toBe('false');
    expect(option('cozy-crt').textContent).toContain('Cozy CRT');
  });

  it('theme_change_recolors_without_reload', async () => {
    await mount();
    const before = window.location.href;

    act(() => {
      option('warm-apartment').click();
    });

    // The document takes the new palette immediately, with no navigation.
    expect(document.documentElement.getAttribute('data-theme')).toBe('warm-apartment');
    expect(localStorage.getItem('huzbi-theme')).toBe('warm-apartment');
    expect(option('warm-apartment').getAttribute('aria-pressed')).toBe('true');
    expect(option('cozy-crt').getAttribute('aria-pressed')).toBe('false');
    expect(window.location.href).toBe(before);

    // The swatches are the real colours of the selected palette.
    const swatches = option('warm-apartment').querySelectorAll<HTMLElement>('[data-swatch]');
    expect(swatches.length).toBeGreaterThan(0);
    const warm = new Set(Object.values(PALETTES['warm-apartment']).map((c) => c.toLowerCase()));
    for (const swatch of swatches) {
      const colour = swatch.dataset.swatch?.toLowerCase() ?? '';
      expect(warm.has(colour), colour).toBe(true);
    }
  });

  it('remembers_the_visitors_theme', async () => {
    localStorage.setItem('huzbi-theme', 'moonlit-terminal');
    await mount();

    expect(document.documentElement.getAttribute('data-theme')).toBe('moonlit-terminal');
    expect(option('moonlit-terminal').getAttribute('aria-pressed')).toBe('true');
  });

  it('toggles_the_crt_scanlines_with_a_labelled_button', async () => {
    await mount();

    const crt = container.querySelector<HTMLButtonElement>('[data-crt-toggle]');
    if (!crt) throw new Error('no CRT toggle');
    expect(crt.getAttribute('aria-pressed')).toBe('true');

    act(() => {
      crt.click();
    });

    expect(crt.getAttribute('aria-pressed')).toBe('false');
    expect(localStorage.getItem('huzbi-crt')).toBe('false');
  });

  it('calls_a_supplied_change_handler_instead_of_the_context', async () => {
    const onThemeChange = vi.fn();
    await act(async () => {
      root.render(
        createElement(
          AppProvider,
          null,
          createElement(ThemeSelector, { currentTheme: 'cozy-crt', onThemeChange }),
        ),
      );
    });

    act(() => {
      option('moonlit-terminal').click();
    });

    expect(onThemeChange).toHaveBeenCalledWith('moonlit-terminal');
  });
});
