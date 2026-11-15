// @vitest-environment jsdom
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { PROGRESS_KEY } from '@/game/state/progress';
import { starTotal } from '@/game/content/stars';
import { PlayDoor } from './PlayDoor';

// Next inlines this flag from next.config.ts (trailingSlash: true) at build
// time; without it the test environment would strip the slash off /play/.
process.env.__NEXT_TRAILING_SLASH = 'true';
afterAll(() => {
  delete process.env.__NEXT_TRAILING_SLASH;
});

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  window.localStorage.clear();
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

async function mount(): Promise<void> {
  await act(async () => {
    root.render(createElement(PlayDoor, null));
  });
}

describe('PlayDoor', () => {
  it('offers_a_fresh_start_when_there_is_no_save', async () => {
    await mount();
    expect(container.textContent).toContain('Play the room');
    expect(container.querySelector('a[href="/play/"]')).not.toBeNull();
    expect(container.textContent).not.toContain('stars found');
  });

  it('offers_continue_with_the_saved_star_count', async () => {
    localStorage.setItem(
      PROGRESS_KEY,
      JSON.stringify({
        version: 1,
        found: ['silly:read-note'],
        doorOpened: false,
        sound: false,
        counters: {},
      }),
    );
    await mount();
    expect(container.textContent).toContain('Continue the room');
    expect(container.textContent).toContain(`1 of ${starTotal()} stars found`);
  });

  it('treats_an_opened_door_as_progress_even_with_no_stars', async () => {
    localStorage.setItem(
      PROGRESS_KEY,
      JSON.stringify({
        version: 1,
        found: [],
        doorOpened: true,
        sound: false,
        counters: {},
      }),
    );
    await mount();
    expect(container.textContent).toContain('Continue the room');
  });
});
