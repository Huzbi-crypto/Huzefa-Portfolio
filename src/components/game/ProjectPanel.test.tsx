// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { projects } from '@/data/projects';
import { createStore, type GameStore } from '@/game/state/store';
import { ProjectPanel } from './ProjectPanel';

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

async function mount(store: GameStore): Promise<void> {
  await act(async () => {
    root.render(createElement(ProjectPanel, { store }));
  });
}

function open(store: GameStore, projectId: string): Promise<void> {
  let opened: Promise<void> | undefined;
  act(() => {
    opened = store.showProject(projectId);
  });
  if (!opened) throw new Error('showProject did not return a promise');
  return opened;
}

describe('ProjectPanel', () => {
  it('shows_the_real_project_text_and_links', async () => {
    const store = createStore(null);
    const project = projects.find((item) => item.id === 'ai-anime');
    if (!project) throw new Error('missing ai-anime');

    await mount(store);
    const opened = open(store, project.id);

    expect(container.querySelector('[role="dialog"]')).not.toBeNull();
    expect(container.textContent).toContain(project.title);
    expect(container.textContent).toContain(project.tagline);
    expect(container.textContent).toContain(project.description);
    expect(container.querySelector(`a[href="${project.githubUrl}"]`)).not.toBeNull();
    expect(container.querySelector(`a[href="${project.demoUrl}"]`)).not.toBeNull();

    act(() => {
      store.closeProject();
    });
    await opened;
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it('has_no_demo_link_when_the_project_has_none', async () => {
    const store = createStore(null);
    const project = projects.find((item) => item.id === 'routing-sim');
    if (!project) throw new Error('missing routing-sim');

    await mount(store);
    const opened = open(store, project.id);

    expect(container.querySelector(`a[href="${project.githubUrl}"]`)).not.toBeNull();
    expect(container.querySelectorAll('a[target="_blank"]')).toHaveLength(1);

    act(() => {
      store.closeProject();
    });
    await opened;
  });

  it('escape_closes_and_resolves_show_project', async () => {
    const store = createStore(null);
    await mount(store);
    const opened = open(store, 'routing-sim');

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    await opened;

    expect(store.getState().project).toBeNull();
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it('the_visible_close_control_closes_it', async () => {
    const store = createStore(null);
    await mount(store);
    const opened = open(store, 'routing-sim');

    const close = container.querySelector<HTMLButtonElement>('button[data-close]');
    expect(close).not.toBeNull();

    act(() => {
      close?.click();
    });
    await opened;

    expect(store.getState().project).toBeNull();
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  const TABBABLE = 'a[href], button, input, select, textarea, [tabindex]';

  /** The panel's tab ring, in DOM order, as a browser would walk it. */
  function panelTabRing(): HTMLElement[] {
    const panel = container.querySelector<HTMLElement>('.project-panel');
    if (!panel) return [];
    return Array.from(panel.querySelectorAll<HTMLElement>(TABBABLE)).filter(
      (element) => element.tabIndex >= 0 && !element.hasAttribute('disabled'),
    );
  }

  /** jsdom has no default Tab action, so do what the browser would after the event. */
  function pressTab(options: { shiftKey?: boolean; simulateBrowser?: boolean } = {}): KeyboardEvent {
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

    if (!event.defaultPrevented && options.simulateBrowser !== false) {
      const ring = panelTabRing();
      if (ring.length > 0) {
        const index = ring.indexOf(active);
        const next = options.shiftKey
          ? index <= 0
            ? ring.length - 1
            : index - 1
          : (index + 1) % ring.length;
        act(() => {
          ring[next].focus();
        });
      }
    }
    return event;
  }

  it('tab_wraps_at_the_edges_of_the_project_panel', async () => {
    const store = createStore(null);
    await mount(store);
    const opened = open(store, 'ai-anime');
    const ring = panelTabRing();
    expect(ring.length).toBeGreaterThan(1);

    // Tab from the last control goes to the first, not the page behind it.
    act(() => ring[ring.length - 1].focus());
    const forward = pressTab({ simulateBrowser: false });
    expect(forward.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(ring[0]);

    // Shift+Tab from the first control goes to the last.
    const backward = pressTab({ shiftKey: true, simulateBrowser: false });
    expect(backward.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(ring[ring.length - 1]);

    act(() => store.closeProject());
    await opened;
  });

  it('tabs_repeatedly_without_leaving_the_project_panel', async () => {
    const store = createStore(null);
    await mount(store);
    const opened = open(store, 'ai-anime');
    const panel = container.querySelector<HTMLElement>('.project-panel');
    if (!panel) throw new Error('the project panel did not open');

    // More tabs than there are controls, in both directions.
    for (let step = 0; step < 12; step += 1) {
      pressTab();
      const active = document.activeElement;
      expect(active instanceof Node && panel.contains(active), `Tab ${step + 1} escaped`).toBe(true);
    }
    for (let step = 0; step < 12; step += 1) {
      pressTab({ shiftKey: true });
      const active = document.activeElement;
      expect(
        active instanceof Node && panel.contains(active),
        `Shift+Tab ${step + 1} escaped`,
      ).toBe(true);
    }

    act(() => store.closeProject());
    await opened;
  });

  it('intercepts_nothing_once_closed', async () => {
    const store = createStore(null);
    await mount(store);
    const opened = open(store, 'routing-sim');

    act(() => store.closeProject());
    await opened;

    const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    act(() => document.body.dispatchEvent(tab));
    expect(tab.defaultPrevented).toBe(false);

    const arrow = new KeyboardEvent('keydown', {
      key: 'ArrowRight',
      bubbles: true,
      cancelable: true,
    });
    act(() => document.body.dispatchEvent(arrow));
    expect(arrow.defaultPrevented).toBe(false);
  });
});
