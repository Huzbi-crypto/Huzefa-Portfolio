import { afterEach, describe, expect, it, vi } from 'vitest';
import { GITHUB_FALLBACK } from '@/lib/github';
import {
  githubSnapshot,
  hydrateGitHubSnapshot,
  isGitHubSnapshot,
  setGitHubSnapshot,
} from './github';

afterEach(() => {
  setGitHubSnapshot(GITHUB_FALLBACK);
  vi.unstubAllGlobals();
});

describe('the game GitHub getter', () => {
  it('starts from the committed snapshot', () => {
    expect(githubSnapshot()).toBe(GITHUB_FALLBACK);
  });

  it('rejects a malformed API response before it reaches the canvas', () => {
    expect(isGitHubSnapshot(null)).toBe(false);
    expect(isGitHubSnapshot({})).toBe(false);
    expect(isGitHubSnapshot({ ...GITHUB_FALLBACK, repositories: 'many' })).toBe(false);
    expect(isGitHubSnapshot(GITHUB_FALLBACK)).toBe(true);
  });

  it('lets a live snapshot replace the seed and restores it afterwards', () => {
    const before = githubSnapshot();
    const live = {
      ...before,
      stats: { ...before.stats, totalFollowers: before.stats.totalFollowers + 1 },
    };

    setGitHubSnapshot(live);
    expect(githubSnapshot()).toBe(live);
    expect(githubSnapshot().stats.totalFollowers).toBe(before.stats.totalFollowers + 1);

    setGitHubSnapshot(before);
    expect(githubSnapshot()).toBe(before);
  });

  it('fetches the cached route once on load and installs the live numbers', async () => {
    const live = {
      ...GITHUB_FALLBACK,
      stats: { ...GITHUB_FALLBACK.stats, totalRepos: 41, totalFollowers: 21 },
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(live), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await hydrateGitHubSnapshot();
    await hydrateGitHubSnapshot();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('/api/github/', {
      headers: { accept: 'application/json' },
    });
    expect(githubSnapshot().stats).toMatchObject({ totalRepos: 41, totalFollowers: 21 });
  });
});
