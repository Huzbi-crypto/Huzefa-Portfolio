import { describe, expect, it } from 'vitest';
import snapshot from '@/data/github-snapshot.json';
import {
  buildSnapshot,
  isoDate,
  languageBreakdown,
  pickRepo,
  pickUser,
  snapshotNumbers,
} from './githubSnapshot.mjs';

/** The saved repo fields the tests inspect. The builder returns more. */
type SavedRepo = {
  name: string;
  description: string | null;
  homepage: string | null;
  license: unknown;
  topics: string[];
};

const rawUser = {
  login: 'Huzbi-crypto',
  id: 7,
  avatar_url: 'https://avatars.example/huzbi.png',
  html_url: 'https://github.com/Huzbi-crypto',
  name: 'Huzbi Naru',
  company: null,
  blog: 'https://huzefa.vercel.app/',
  location: null,
  email: null,
  bio: "I'm Huzbi. I like to code and read manga 'n books.",
  twitter_username: null,
  public_repos: 3,
  public_gists: 4,
  followers: 20,
  following: 17,
  created_at: '2020-12-21T14:29:59Z',
  updated_at: '2026-11-05T00:00:00Z',
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
    license: { key: 'mit', name: 'MIT License', spdx_id: 'MIT', url: null },
  },
  {
    id: 2,
    name: 'Beta',
    full_name: 'Huzbi-crypto/Beta',
    html_url: 'https://github.com/Huzbi-crypto/Beta',
    description: null,
    fork: false,
    homepage: null,
    size: 3,
    stargazers_count: 1,
    watchers_count: 1,
    language: 'Python',
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
  {
    id: 3,
    name: 'Gamma',
    full_name: 'Huzbi-crypto/Gamma',
    html_url: 'https://github.com/Huzbi-crypto/Gamma',
    description: 'A JavaScript thing.',
    fork: true,
    homepage: 'https://example.com',
    size: 8,
    stargazers_count: 0,
    watchers_count: 0,
    language: 'JavaScript',
    forks_count: 1,
    open_issues_count: 2,
    topics: ['web'],
    visibility: 'public',
    default_branch: 'main',
    created_at: '2026-01-03T00:00:00Z',
    updated_at: '2026-04-01T00:00:00Z',
    pushed_at: '2026-04-01T00:00:00Z',
    license: null,
  },
  {
    id: 4,
    name: 'Delta',
    full_name: 'Huzbi-crypto/Delta',
    html_url: 'https://github.com/Huzbi-crypto/Delta',
    description: 'No language detected.',
    fork: false,
    homepage: null,
    size: 1,
    stargazers_count: 2,
    watchers_count: 2,
    language: null,
    forks_count: 0,
    open_issues_count: 0,
    topics: [],
    visibility: 'public',
    default_branch: 'main',
    created_at: '2026-01-04T00:00:00Z',
    updated_at: '2026-05-01T00:00:00Z',
    pushed_at: '2026-05-01T00:00:00Z',
    license: null,
  },
];

describe('the committed GitHub snapshot', () => {
  it('keeps the exact shape the site and the game read', () => {
    expect(snapshot.user.login).toBe('Huzbi-crypto');
    expect(Array.isArray(snapshot.repositories)).toBe(true);
    expect(snapshot.repositories.length).toBeGreaterThan(0);
    expect(snapshot.stats.totalRepos).toBe(snapshot.repositories.length);
    expect(snapshot.stats.totalRepos).toBe(snapshot.user.public_repos);
    expect(snapshot.stats.totalStarsReceived).toBe(
      snapshot.repositories.reduce((sum, repo) => sum + repo.stargazers_count, 0),
    );
    expect(snapshot.stats.totalFollowers).toBe(snapshot.user.followers);
    expect(snapshot.stats.totalFollowing).toBe(snapshot.user.following);
    expect(Number.isInteger(snapshot.stats.totalStarsGiven)).toBe(true);
    expect(snapshot.stats.totalStarsGiven).toBeGreaterThanOrEqual(0);
  });

  it('has a real snapshot date, not a placeholder', () => {
    expect(snapshot.stats.snapshotDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const [year, month, day] = snapshot.stats.snapshotDate.split('-').map(Number);
    const taken = new Date(year, month - 1, day).getTime();
    expect(Number.isNaN(taken)).toBe(false);
    expect(taken).toBeLessThanOrEqual(Date.now());
  });

  it('counts every repository language honestly', () => {
    const withLanguage = snapshot.repositories.filter((repo) => repo.language).length;
    const counted = snapshot.stats.topLanguages.reduce((sum, entry) => sum + entry.count, 0);
    expect(counted).toBe(withLanguage);
    for (const entry of snapshot.stats.topLanguages) {
      expect(entry.percentage).toBeGreaterThan(0);
      expect(entry.percentage).toBeLessThanOrEqual(100);
      expect(Math.round(entry.percentage * 10)).toBe(entry.percentage * 10);
    }
  });

  it('exposes the numbers the plaque engraves', () => {
    const numbers = snapshotNumbers(snapshot);
    expect(numbers.repos).toBe(snapshot.stats.totalRepos);
    expect(numbers.stars).toBe(snapshot.stats.totalStarsReceived);
    expect(numbers.followers).toBe(snapshot.stats.totalFollowers);
    expect(numbers.date).toBe(snapshot.stats.snapshotDate);
  });
});

describe('the snapshot builder', () => {
  it('recomputes stats from the repos and preserves the stars given', () => {
    const built = buildSnapshot({
      user: rawUser,
      repos: rawRepos,
      totalStarsGiven: 351,
      date: '2026-11-05',
    });

    expect(built.stats).toEqual({
      totalRepos: 4,
      totalStarsGiven: 351,
      totalStarsReceived: 7,
      totalFollowers: 20,
      totalFollowing: 17,
      topLanguages: [
        { language: 'Python', count: 2, percentage: 66.7 },
        { language: 'JavaScript', count: 1, percentage: 33.3 },
      ],
      snapshotDate: '2026-11-05',
    });
    expect(built.repositories).toHaveLength(4);
    // The list is newest-pushed first, with a name tie-breaker.
    expect((built.repositories as SavedRepo[]).map((repo) => repo.name)).toEqual([
      'Delta',
      'Gamma',
      'Beta',
      'Alpha',
    ]);
  });

  it('keeps null repo text as null and copies topics instead of aliasing them', () => {
    const built = buildSnapshot({
      user: rawUser,
      repos: rawRepos,
      totalStarsGiven: 0,
      date: '2026-11-05',
    });
    const repos = built.repositories as SavedRepo[];
    const beta = repos.find((repo) => repo.name === 'Beta')!;
    expect(beta.description).toBeNull();
    expect(beta.homepage).toBeNull();
    expect(beta.license).toBeNull();

    const alpha = repos.find((repo) => repo.name === 'Alpha')!;
    expect(alpha.topics).toEqual(['python']);
    expect(alpha.topics).not.toBe(rawRepos[0].topics);
  });

  it('rounds language percentages to one decimal and sorts by count', () => {
    const languages = languageBreakdown([
      { language: 'C' },
      { language: 'C' },
      { language: 'Python' },
      { language: null },
    ]);
    expect(languages).toEqual([
      { language: 'C', count: 2, percentage: 66.7 },
      { language: 'Python', count: 1, percentage: 33.3 },
    ]);
  });

  it('rejects an impossible snapshot date instead of writing it', () => {
    expect(() =>
      buildSnapshot({ user: rawUser, repos: rawRepos, totalStarsGiven: 0, date: 'today' }),
    ).toThrow(/YYYY-MM-DD/);
  });

  it('picks only the fields the site reads', () => {
    expect(Object.keys(pickUser(rawUser))).not.toContain('plan');
    expect((pickUser({}) as Record<string, unknown>).name).toBe('');
    expect(Object.keys(pickRepo(rawRepos[0]))).not.toContain('permissions');
  });

  it('dates a snapshot on the local calendar day', () => {
    expect(isoDate(new Date(2026, 10, 5, 23, 59, 59))).toBe('2026-11-05');
    expect(isoDate(new Date(2026, 0, 1, 0, 0, 0))).toBe('2026-01-01');
  });
});
