// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { personalInfo } from '@/data/personal';
import { projects } from '@/data/projects';
import { copy } from '@/game/content/copy';
import { SILLY_STARS, allStarIds, projectStarId, readStarId } from '@/game/content/stars';
import { createStore, type GameStore } from '@/game/state/store';
import { Journal, journalEntries } from './Journal';

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

async function mount(store: GameStore, isBlocked: () => boolean = () => false): Promise<void> {
  await act(async () => {
    root.render(createElement(Journal, { store, isBlocked }));
  });
}

function press(key: string): void {
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
  });
}

describe('journalEntries', () => {
  it('every_star_has_a_journal_entry', () => {
    const entries = journalEntries([]);
    expect(entries.map((e) => e.id).sort()).toEqual([...allStarIds()].sort());
  });

  it('unfound_entries_hide_title_and_body', () => {
    const project = projects[0];
    const entries = journalEntries([]);
    for (const entry of entries) {
      expect(entry.found).toBe(false);
      expect(entry.url).toBeUndefined();
    }
    const hidden = entries.find((e) => e.id === projectStarId(project.id));
    expect(hidden?.title).not.toContain(project.title);
    expect(hidden?.body).not.toContain(project.description);
  });

  it('found_entries_show_the_real_text', () => {
    const project = projects[0];
    const book = personalInfo.readingList[0];
    const entries = journalEntries([projectStarId(project.id), readStarId(book.title)]);
    const p = entries.find((e) => e.id === projectStarId(project.id));
    const b = entries.find((e) => e.id === readStarId(book.title));
    expect(p).toMatchObject({ found: true, title: project.title, body: project.description, url: project.githubUrl });
    expect(b).toMatchObject({ found: true, title: book.title });
    expect(b?.body).toContain(book.note ?? '');
  });

  it('every_silly_star_has_its_own_words', () => {
    // Every silly star must have authored copy, not the generic fallback that
    // `openEntry` uses when an id is added without journal words.
    for (const id of SILLY_STARS) {
      const words = copy.journal.silly[id];
      expect(words, id).toBeDefined();
      expect(words.title.length, id).toBeGreaterThan(0);
      expect(words.body.length, id).toBeGreaterThan(0);
      expect(words.body, id).not.toBe(copy.journal.fallbackBody);
    }
  });
});

describe('Journal overlay', () => {
  it('journal_opens_with_J_and_a_visible_button_and_closes_with_esc', async () => {
    const store = createStore(null);
    await mount(store);

    const button = container.querySelector('button.journal-button') as HTMLButtonElement;
    expect(button).not.toBeNull();
    expect(container.querySelector('[role="dialog"]')).toBeNull();

    press('j');
    expect(container.querySelector('[role="dialog"]')).not.toBeNull();
    press('Escape');
    expect(container.querySelector('[role="dialog"]')).toBeNull();

    act(() => button.click());
    expect(container.querySelector('[role="dialog"]')).not.toBeNull();
    press('Escape');
    expect(container.querySelector('[role="dialog"]')).toBeNull();

    press('J');
    expect(container.querySelector('[role="dialog"]')).not.toBeNull();
    press('j');
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it('does_not_open_over_a_dialogue_or_another_panel', async () => {
    const store = createStore(null);
    await mount(store, () => true);
    press('j');
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it('close_button_closes_and_focus_returns', async () => {
    const store = createStore(null);
    await mount(store);
    const button = container.querySelector('button.journal-button') as HTMLButtonElement;
    button.focus();
    act(() => button.click());
    const close = container.querySelector('[data-close]') as HTMLButtonElement;
    expect(document.activeElement).toBe(close);
    act(() => close.click());
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(button);
  });

  it('shows_found_text_and_hides_the_rest_in_real_dom', async () => {
    const store = createStore(null);
    const project = projects[0];
    store.award(projectStarId(project.id));
    await mount(store);
    press('j');
    const text = container.textContent ?? '';
    expect(text).toContain(project.title);
    expect(text).toContain(project.description);
    for (const other of projects.slice(1)) expect(text).not.toContain(other.title);
    expect(container.querySelector(`a[href="${project.githubUrl}"]`)).not.toBeNull();
  });

  it('updates_while_open_when_a_star_is_found', async () => {
    const store = createStore(null);
    await mount(store);
    press('j');
    const project = projects[1];
    expect(container.textContent).not.toContain(project.title);
    act(() => {
      store.award(projectStarId(project.id));
    });
    expect(container.textContent).toContain(project.title);
  });

  it('typing_j_in_a_field_is_not_a_shortcut', async () => {
    const store = createStore(null);
    await mount(store);
    const input = document.createElement('input');
    document.body.appendChild(input);
    act(() => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'j', bubbles: true }));
    });
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    input.remove();
  });
});
