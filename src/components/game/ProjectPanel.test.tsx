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
});
