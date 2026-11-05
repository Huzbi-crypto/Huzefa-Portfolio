import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  GITHUB_FALLBACK,
  fetchLiveGitHubSnapshot,
  loadGitHubSnapshot,
} from './github';

const rawUser = {
  login: 'Huzbi-crypto',
  id: 76440095,
  avatar_url: 'https://avatars.example/huzbi.png',
  html_url: 'https://github.com/Huzbi-crypto',
  name: 'Huzbi Naru',
  company: null,
  blog: 'https://huzefa.vercel.app/',
  location: null,
  email: null,
  bio: "I'm Huzbi.",
  twitter_username: null,
  public_repos: 2,
  public_gists: 4,
  followers: 21,
  following: 18,
  created_at: '2020-12-21T14:29:59Z',
  updated_at: '2026-11-06T00:00:00Z',
};

const rawRepos = [
  {
    id: 1,
    name: 'Alpha',
    full_name: 'Huzbi-crypto/Alpha',
    html_url: 'https://github.com/Huzbi-crypto/Alpha',
    description: 'A Python thing.',
    fork: false,
    homepage: '',
    size: 10,
    stargazers_count: 4,
    watchers_count: 4,
    language: 'Python',
    forks_count: 0,
    open_issues_count: 0,
    topics: ['python'],
    visibility: 'public',
    default_branch: 'main',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-02-01T00:00:00Z',
    pushed_at: '2026-02-01T00:00:00Z',
    license: null,
  },
  {
    id: 2,
    name: 'Beta',
    full_name: 'Huzbi-crypto/Beta',
    html_url: 'https://github.com/Huzbi-crypto/Beta',
    description: null,
    fork: true,
    homepage: null,
    size: 3,
    stargazers_count: 1,
    watchers_count: 1,
    language: 'JavaScript',
    forks_count: 0,
    open_issues_count: 0,
    topics: [],
    visibility: 'public',
    default_branch: 'main',
    created_at: '2026-01-02T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z',
    pushed_at: '2026-03-01T00:00:00Z',
    license: null,
  },
];

type Call = { url: string; init?: RequestInit & { next?: { revalidate: number } } };

function json(data: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

function fakeFetch(
  handler: (url: string) => Response,
): { fetchImpl: (url: string, init?: Call['init']) => Promise<Response>; calls: Call[] } {
  const calls: Call[] = [];
  return {
    calls,
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return handler(url);
    },
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('the live GitHub loader', () => {
  it('builds the committed snapshot shape from the public API', async () => {
    const { fetchImpl, calls } = fakeFetch((url) => {
      if (url.endsWith('/users/Huzbi-crypto')) return json(rawUser);
      if (url.includes('/repos?')) return json(rawRepos);
      if (url.includes('/starred?')) {
        return json([{ id: 9 }], {
          link: '<https://api.github.com/user/starred?per_page=1&page=351>; rel="last"',
        });
      }
      throw new Error(`unexpected URL ${url}`);
    });

    const snapshot = await fetchLiveGitHubSnapshot({
      fetchImpl,
      token: 'test-token',
      now: new Date(2026, 10, 6),
    });

    expect(snapshot.stats).toMatchObject({
      totalRepos: 2,
      totalStarsReceived: 5,
      totalFollowers: 21,
      totalFollowing: 18,
      totalStarsGiven: 351,
      snapshotDate: '2026-11-06',
    });
    expect(snapshot.repositories.map((repo) => repo.name).sort()).toEqual(['Alpha', 'Beta']);
    expect(
      calls.every(
        (call) =>
          (call.init?.headers as Record<string, string> | undefined)?.Authorization ===
          'Bearer test-token',
      ),
    ).toBe(true);
    expect(calls.every((call) => call.init?.next?.revalidate === 3600)).toBe(true);
  });

  it('keeps the committed stars-given total when that count fails', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { fetchImpl } = fakeFetch((url) => {
      if (url.endsWith('/users/Huzbi-crypto')) return json(rawUser);
      if (url.includes('/repos?')) return json(rawRepos);
      if (url.includes('/starred?')) return new Response('nope', { status: 403 });
      throw new Error(`unexpected URL ${url}`);
    });

    const snapshot = await fetchLiveGitHubSnapshot({
      fetchImpl,
      token: 'test-token',
      now: new Date(2026, 10, 6),
    });

    expect(snapshot.stats.totalStarsGiven).toBe(GITHUB_FALLBACK.stats.totalStarsGiven);
  });
});

describe('the GitHub fallback', () => {
  it('returns the committed snapshot when GitHub fails', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { fetchImpl } = fakeFetch(() => new Response('rate limited', { status: 403 }));

    const result = await loadGitHubSnapshot({ fetchImpl, token: 'test-token' });

    expect(result.source).toBe('snapshot');
    expect(result.snapshot).toBe(GITHUB_FALLBACK);
    expect(result.reason).toMatch(/403/);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('using the committed snapshot'));
  });

  it('refuses an empty repository list instead of inventing zeroes', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { fetchImpl } = fakeFetch((url) => {
      if (url.endsWith('/users/Huzbi-crypto')) return json(rawUser);
      if (url.includes('/repos?')) return json([]);
      if (url.includes('/starred?')) return json([]);
      throw new Error(`unexpected URL ${url}`);
    });

    const result = await loadGitHubSnapshot({ fetchImpl, token: 'test-token' });

    expect(result.source).toBe('snapshot');
    expect(result.snapshot.stats.totalRepos).toBe(GITHUB_FALLBACK.stats.totalRepos);
  });

  it('logs and falls back when no token and no network are available', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { fetchImpl } = fakeFetch(() => {
      throw new Error('offline');
    });

    const result = await loadGitHubSnapshot({ fetchImpl, token: '' });

    expect(result.source).toBe('snapshot');
    expect(result.snapshot).toBe(GITHUB_FALLBACK);
    expect(warn).toHaveBeenCalled();
  });
});
