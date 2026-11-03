// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { createStore } from '@/game/state/store';
import { hasWalked, noteWalked } from './controlsHint';

beforeEach(() => {
  window.localStorage.clear();
});

describe('controls hint', () => {
  it('controls_hint_leaves_after_walking', () => {
    const store = createStore(window.localStorage);
    expect(hasWalked(store)).toBe(false);

    noteWalked(store);

    expect(hasWalked(store)).toBe(true);
  });

  it('controls_hint_stays_gone_after_reload', () => {
    noteWalked(createStore(window.localStorage));

    // A reload builds a new store from the same saved progress.
    const reloaded = createStore(window.localStorage);

    expect(hasWalked(reloaded)).toBe(true);
  });

  it('walking_twice_keeps_one_saved_mark', () => {
    const store = createStore(window.localStorage);
    noteWalked(store);
    noteWalked(store);

    expect(store.count('walked')).toBe(1);
  });
});
