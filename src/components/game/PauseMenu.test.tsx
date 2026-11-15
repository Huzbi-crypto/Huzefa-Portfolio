// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { PauseMenu } from './PauseMenu';

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => {
    root.unmount();
  });
  container.remove();
});

async function mount(options: { open?: boolean } = {}): Promise<() => void> {
  const onResume = vi.fn();
  await act(async () => {
    root.render(
      createElement(PauseMenu, {
        open: options.open ?? true,
        found: 12,
        total: 35,
        onResume,
      }),
    );
  });
  return onResume as unknown as () => void;
}

function dialog(): HTMLElement | null {
  return container.querySelector('[role="dialog"]');
}

function pressEscape(): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
  act(() => {
    window.dispatchEvent(event);
  });
  return event;
}

/** The panel's tab ring, in DOM order, as a browser would walk it. */
const TABBABLE = 'a[href], button, input, select, textarea, [tabindex]';
function tabRing(): HTMLElement[] {
  const panel = dialog();
  if (!panel) return [];
  return Array.from(panel.querySelectorAll<HTMLElement>(TABBABLE)).filter(
    (element) => element.tabIndex >= 0 && !element.hasAttribute('disabled'),
  );
}

/** jsdom has no default Tab action, so fire the keydown the browser would. */
function pressTab(options: { shiftKey?: boolean } = {}): KeyboardEvent {
  const active =
    document.activeElement instanceof HTMLElement ? document.activeElement : document.body;
  const event = new KeyboardEvent('keydown', {
    key: 'Tab',
    shiftKey: options.shiftKey ?? false,
    bubbles: true,
    cancelable: true,
  });
  act(() => {
    active.dispatchEvent(event);
  });
  return event;
}

describe('PauseMenu', () => {
  it('shows_the_copy_the_stars_and_the_saved_exit', async () => {
    await mount();

    expect(dialog()).not.toBeNull();
    expect(dialog()?.getAttribute('aria-modal')).toBe('true');
    expect(container.textContent).toContain('Paused.');
    expect(container.textContent).toContain('The room will wait.');
    expect(container.textContent).toContain('12 of 35 stars found');
    expect(container.textContent).toContain('Progress saves automatically.');
    expect(container.querySelector('a[href="/"]')).not.toBeNull();
  });

  it('renders_nothing_when_closed', async () => {
    await mount({ open: false });
    expect(dialog()).toBeNull();
    expect(container.textContent).toBe('');
  });

  it('puts_focus_on_resume_when_it_opens', async () => {
    await mount();
    const resume = dialog()?.querySelector('button');
    expect(resume).not.toBeNull();
    expect(document.activeElement).toBe(resume);
  });

  it('clicking_resume_resumes_once', async () => {
    const onResume = await mount();
    const resume = dialog()?.querySelector('button') as HTMLButtonElement;

    act(() => {
      resume.click();
    });

    expect(onResume).toHaveBeenCalledTimes(1);
  });

  it('escape_resumes_once_and_prevents_the_default', async () => {
    const onResume = await mount();

    const event = pressEscape();

    expect(onResume).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
  });

  it('tab_stays_inside_the_panel', async () => {
    await mount();
    const ring = tabRing();
    expect(ring.length).toBeGreaterThan(1);

    // Tab from the last control wraps to the first, not to the page behind it.
    act(() => ring[ring.length - 1].focus());
    const forward = pressTab();
    expect(forward.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(ring[0]);

    // Shift+Tab from the first control wraps to the last.
    const backward = pressTab({ shiftKey: true });
    expect(backward.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(ring[ring.length - 1]);
  });
});
