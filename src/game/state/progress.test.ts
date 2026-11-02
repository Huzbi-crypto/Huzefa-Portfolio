import { describe, expect, it } from 'vitest';
import {
  PROGRESS_KEY,
  award,
  freshProgress,
  loadProgress,
  saveProgress,
  type Progress,
} from './progress';

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

describe('progress', () => {
  it('fresh_when_empty', () => {
    expect(loadProgress(memoryStorage())).toEqual({
      version: 1,
      found: [],
      doorOpened: false,
      sound: false,
      counters: {},
    });
  });

  it('fresh_when_corrupt_json', () => {
    const storage = memoryStorage({ [PROGRESS_KEY]: '{not valid json' });

    expect(loadProgress(storage)).toEqual(freshProgress());
  });

  it('fresh_when_wrong_version', () => {
    const storage = memoryStorage({
      [PROGRESS_KEY]: JSON.stringify({
        version: 2,
        found: ['silly:pet-cat'],
        doorOpened: true,
        sound: true,
        counters: { catPets: 4 },
      }),
    });

    expect(loadProgress(storage)).toEqual(freshProgress());
  });

  it('fresh_when_getItem_throws', () => {
    const storage = memoryStorage();
    storage.getItem = () => {
      throw new Error('storage blocked');
    };

    expect(loadProgress(storage)).toEqual(freshProgress());
  });

  it('save_swallows_setItem_throw', () => {
    const storage = memoryStorage();
    storage.setItem = () => {
      throw new Error('quota exceeded');
    };

    expect(() => saveProgress(storage, freshProgress())).not.toThrow();
  });

  it('null_storage_works', () => {
    const progress = loadProgress(null);

    expect(progress).toEqual(freshProgress());
    expect(award(progress, 'silly:pet-cat')).toBe(true);
    expect(progress.found).toEqual(['silly:pet-cat']);
    expect(() => saveProgress(null, progress)).not.toThrow();
  });

  it('round_trip', () => {
    const storage = memoryStorage();
    const progress: Progress = {
      version: 1,
      found: ['project:routing-sim', 'silly:pet-cat'],
      doorOpened: true,
      sound: true,
      counters: { catPets: 10 },
    };

    saveProgress(storage, progress);

    expect(loadProgress(storage)).toEqual(progress);
  });

  it('award_is_idempotent', () => {
    const progress = freshProgress();

    expect(award(progress, 'silly:cold-tea')).toBe(true);
    expect(award(progress, 'silly:cold-tea')).toBe(false);
    expect(progress.found).toEqual(['silly:cold-tea']);
  });

  it('drops_found_ids_not_in_allStarIds', () => {
    const storage = memoryStorage({
      [PROGRESS_KEY]: JSON.stringify({
        version: 1,
        found: ['silly:pet-cat', 'silly:removed-content'],
        doorOpened: false,
        sound: false,
        counters: {},
      }),
    });

    expect(loadProgress(storage).found).toEqual(['silly:pet-cat']);
  });
});
