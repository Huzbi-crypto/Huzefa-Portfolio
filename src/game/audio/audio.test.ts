// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PROGRESS_KEY } from '@/game/state/progress';
import { createStore } from '@/game/state/store';
import { createAudio } from './audio';
import { FakeAudioContext } from './fakeAudio';
import { TUNES } from './tunes';

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

function frequencies(ctx: FakeAudioContext): number[] {
  return ctx.oscillators.map(
    (oscillator) => oscillator.frequency.events.find((event) => event.kind === 'set')?.value ?? 0,
  );
}

function setVisibility(value: DocumentVisibilityState): void {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => value,
  });
  document.dispatchEvent(new Event('visibilitychange'));
}

beforeEach(() => {
  setVisibility('visible');
});

afterEach(() => {
  setVisibility('visible');
});

describe('game audio', () => {
  it('silent_until_enabled', () => {
    const ctx = new FakeAudioContext();
    const audio = createAudio(() => ctx, createStore(null));

    audio.setScene('dark');
    audio.playSfx('star');

    expect(ctx.oscillators).toHaveLength(0);
    audio.dispose();
  });

  it('no_context_created_before_enabled', () => {
    let created = 0;
    const ctx = new FakeAudioContext();
    const audio = createAudio(() => {
      created += 1;
      return ctx;
    }, createStore(null));

    audio.playSfx('door');
    audio.setScene('workshop');
    expect(created).toBe(0);

    audio.setEnabled(true);
    expect(created).toBe(1);

    audio.setEnabled(false);
    audio.playSfx('blip');
    expect(created).toBe(1);
    audio.dispose();
  });

  it('choice_persists_across_reload', () => {
    const storage = memoryStorage();
    const store = createStore(storage);
    const audio = createAudio(() => new FakeAudioContext(), store);

    audio.setEnabled(true);
    expect(store.getState().sound).toBe(true);
    expect(JSON.parse(storage.getItem(PROGRESS_KEY) ?? '{}').sound).toBe(true);

    const reloaded = createStore(storage);
    expect(reloaded.getState().sound).toBe(true);
    const again = createAudio(() => new FakeAudioContext(), reloaded);
    expect(again.isEnabled()).toBe(true);

    again.setEnabled(false);
    expect(JSON.parse(storage.getItem(PROGRESS_KEY) ?? '{}').sound).toBe(false);
    expect(createStore(storage).getState().sound).toBe(false);

    audio.dispose();
    again.dispose();
  });

  it('null_context_never_throws', () => {
    const audio = createAudio(() => null, createStore(null));

    expect(() => {
      audio.setEnabled(true);
      audio.setScene('dark');
      audio.playSfx('star');
      setVisibility('hidden');
      setVisibility('visible');
      audio.setEnabled(false);
      audio.dispose();
    }).not.toThrow();
  });

  it('suspended_context_is_resumed_only_after_a_gesture', async () => {
    const store = createStore(null);
    store.setSound(true);
    const ctx = new FakeAudioContext({ state: 'suspended' });
    let created = 0;
    const audio = createAudio(() => {
      created += 1;
      return ctx;
    }, store);

    expect(audio.isEnabled()).toBe(true);
    audio.setScene('dark');
    audio.playSfx('star');
    expect(created).toBe(0);
    expect(ctx.resumeCalls).toBe(0);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    await Promise.resolve();
    await Promise.resolve();

    expect(created).toBe(1);
    expect(ctx.resumeCalls).toBe(1);
    expect(ctx.state).toBe('running');
    expect(ctx.oscillators.length).toBe(TUNES.dark.notes.length);
    audio.dispose();
  });

  it('scene_change_swaps_tune', () => {
    const ctx = new FakeAudioContext();
    const audio = createAudio(() => ctx, createStore(null));

    audio.setEnabled(true);
    const room = frequencies(ctx);
    expect(room).toHaveLength(TUNES.room.notes.length);

    audio.setScene('dark');
    const dark = frequencies(ctx).slice(room.length);
    expect(dark).toHaveLength(TUNES.dark.notes.length);
    expect(dark).not.toEqual(room);

    audio.dispose();
  });

  it('hidden_tab_suspends_and_returns', async () => {
    const ctx = new FakeAudioContext();
    const audio = createAudio(() => ctx, createStore(null));
    audio.setEnabled(true);
    const before = ctx.oscillators.length;

    setVisibility('hidden');
    expect(ctx.suspendCalls).toBe(1);

    setVisibility('visible');
    await Promise.resolve();
    await Promise.resolve();

    expect(ctx.resumeCalls).toBe(1);
    expect(ctx.oscillators.length).toBeGreaterThan(before);
    audio.dispose();
  });

  it('a_new_star_plays_the_star_sound', () => {
    const ctx = new FakeAudioContext();
    const store = createStore(null);
    const audio = createAudio(() => ctx, store);
    audio.setEnabled(true);
    const before = ctx.oscillators.length;

    store.award('silly:pet-cat');

    expect(ctx.oscillators.length - before).toBe(3);
    audio.dispose();
  });

  it('opening_the_project_panel_plays_open_and_close', async () => {
    const ctx = new FakeAudioContext();
    const store = createStore(null);
    const audio = createAudio(() => ctx, store);
    audio.setEnabled(true);
    const before = ctx.oscillators.length;

    const opened = store.showProject('routing-sim');
    const afterOpen = ctx.oscillators.length;
    expect(afterOpen - before).toBe(2);

    store.closeProject();
    await opened;
    expect(ctx.oscillators.length - afterOpen).toBe(2);
    audio.dispose();
  });

  it('dialogue_start_plays_a_blip', () => {
    const ctx = new FakeAudioContext();
    const store = createStore(null);
    const audio = createAudio(() => ctx, store);
    audio.setEnabled(true);
    const before = ctx.oscillators.length;

    void store.say(['Hello.']);

    expect(ctx.oscillators.length - before).toBe(1);
    audio.dispose();
  });
});
