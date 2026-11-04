// @vitest-environment jsdom
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { AppProvider } from '@/context/AppContext';
import CrtOverlay from './CrtOverlay';

let container: HTMLDivElement;
let root: Root;
const CSS = fs.readFileSync(path.join(process.cwd(), 'src/styles/globals.css'), 'utf8');

beforeEach(() => {
  (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.clear();
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

async function mount(): Promise<void> {
  await act(async () => {
    root.render(createElement(AppProvider, null, createElement(CrtOverlay)));
  });
}

function overlay(): HTMLElement | null {
  return container.querySelector<HTMLElement>('[data-crt-overlay]');
}

describe('CRT overlay', () => {
  it('is_one_still_hard_edged_layer', async () => {
    await mount();

    const layer = overlay();
    expect(layer).not.toBeNull();
    expect(layer?.getAttribute('aria-hidden')).toBe('true');
    expect(layer?.querySelectorAll('*').length).toBe(0);
    expect(layer?.className).not.toMatch(/flicker|animate|pulse|blink/i);
    expect(layer?.style.animation).toBe('');
  });

  it('draws_scanlines_from_hard_pixel_steps_not_gradients', async () => {
    const rule = CSS.match(/\.crt-overlay\s*\{[^}]*\}/)?.[0] ?? '';
    expect(rule).toContain('background-image');
    expect(rule).not.toContain('radial-gradient');
    expect(rule).not.toContain('linear-gradient');
  });

  it('crt_has_no_fast_flicker_under_reduced_motion', () => {
    // The overlay itself never animates...
    const overlayRule = CSS.match(/\.crt-overlay\s*\{[^}]*\}/)?.[0] ?? '';
    expect(overlayRule).not.toMatch(/\banimation\s*:/);

    // ...and the old flicker hooks are switched off when motion is reduced.
    const start = CSS.indexOf('@media (prefers-reduced-motion: reduce)');
    expect(start).toBeGreaterThan(-1);
    const reduced = CSS.slice(start);
    expect(reduced).toContain('animation: none !important');
    expect(reduced).toContain('.crt-flicker');
  });

  it('remembers_the_switch_and_disappears_when_off', async () => {
    localStorage.setItem('huzbi-crt', 'false');
    await mount();

    expect(overlay()).toBeNull();
  });
});
