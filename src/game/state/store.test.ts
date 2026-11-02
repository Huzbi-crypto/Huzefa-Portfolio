import { describe, expect, it } from 'vitest';
import { starTotal } from '@/game/content/stars';
import { PROGRESS_KEY } from './progress';
import { createStore } from './store';

function memoryStorage(initial: Record<string, string> = {}): Storage {
  const data = new Map(Object.entries(initial));

  return {
    get length() {
      return data.size;
    },
    clear() {
      data.clear();
    },
    getItem(key: string) {
      return data.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(data.keys())[index] ?? null;
    },
    removeItem(key: string) {
      data.delete(key);
    },
    setItem(key: string, value: string) {
      data.set(key, value);
    },
  };
}

const CHOICES = [
  { id: 'open', label: 'OPEN IT' },
  { id: 'stay', label: 'STAY' },
];

describe('createStore', () => {
  it('subscribers_notified', () => {
    const store = createStore(null);
    let calls = 0;
    const unsubscribe = store.subscribe(() => {
      calls += 1;
    });

    store.award('silly:pet-cat');
    expect(calls).toBe(1);

    store.increment('cat-pets');
    expect(calls).toBe(2);

    store.setDoorOpened();
    expect(calls).toBe(3);

    unsubscribe();
    store.award('silly:cold-tea');
    expect(calls).toBe(3);
  });

  it('say_resolves_with_choice', async () => {
    const store = createStore(null);
    store.setReducedMotion(true);

    const opened = store.say(['Open the door?'], CHOICES);
    store.advance();
    await expect(opened).resolves.toBe('open');

    const stayed = store.say(['Open the door?'], CHOICES);
    store.advance('stay');
    await expect(stayed).resolves.toBe('stay');

    const plain = store.say(['No choice here.']);
    store.advance();
    await expect(plain).resolves.toBeUndefined();
  });

  it('award_persists', () => {
    const storage = memoryStorage();
    const store = createStore(storage);

    expect(store.award('silly:pet-cat')).toBe(true);
    expect(store.award('silly:pet-cat')).toBe(false);

    const saved = JSON.parse(storage.getItem(PROGRESS_KEY) ?? '{}');
    expect(saved.found).toEqual(['silly:pet-cat']);

    expect(createStore(storage).getState().found).toEqual(['silly:pet-cat']);
  });

  it('state_snapshot_is_stable_between_changes', () => {
    const store = createStore(null);
    const first = store.getState();

    expect(store.getState()).toBe(first);
    expect(first.total).toBe(starTotal());

    store.increment('cat-pets');
    const second = store.getState();

    expect(second).not.toBe(first);
    expect(store.getState()).toBe(second);
    expect(second.found).toBe(store.getState().found);
  });

  it('reduced_motion_makes_dialogue_instant', () => {
    const store = createStore(null);
    store.setReducedMotion(true);

    void store.say(['A line long enough to type']);

    const dialogue = store.getState().dialogue;
    expect(dialogue).not.toBeNull();
    expect(dialogue?.instant).toBe(true);
    expect(dialogue?.typed).toBe('A line long enough to type'.length);
  });

  it('increments_and_counts', () => {
    const store = createStore(null);

    expect(store.count('cat-pets')).toBe(0);

    store.increment('cat-pets');
    store.increment('cat-pets');

    expect(store.count('cat-pets')).toBe(2);
    expect(store.getState().found).toEqual([]);
  });

  it('door_opened_persists', () => {
    const storage = memoryStorage();
    const store = createStore(storage);

    expect(store.getState().doorOpened).toBe(false);

    store.setDoorOpened();

    expect(store.getState().doorOpened).toBe(true);
    expect(createStore(storage).getState().doorOpened).toBe(true);
  });

  it('old_save_keeps_found_stars_when_total_grows', () => {
    const storage = memoryStorage({
      [PROGRESS_KEY]: JSON.stringify({
        version: 1,
        found: ['silly:read-note', 'project:routing-sim'],
        doorOpened: true,
        sound: false,
        counters: {},
      }),
    });
    const store = createStore(storage);
    const state = store.getState();

    expect(state.found).toEqual(['silly:read-note', 'project:routing-sim']);
    expect(state.total).toBe(starTotal());
    expect(state.total).toBeGreaterThan(state.found.length);
  });

  it('tick_advances_typing_and_notifies', () => {
    const store = createStore(null);
    void store.say(['Hello there']);
    let calls = 0;
    store.subscribe(() => {
      calls += 1;
    });

    store.tick(100);

    expect(store.getState().dialogue?.typed).toBe(4);
    expect(calls).toBe(1);
  });
});
