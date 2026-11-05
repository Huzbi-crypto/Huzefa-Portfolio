/**
 * The GitHub data the site reads, fetched from the public REST API.
 *
 * A server route (`src/app/api/github/route.ts`) and the GitHub journal page
 * both go through `getGitHubSnapshot` in `githubCache.ts`, which caches the
 * result for an hour. This module is deliberately free of Next.js imports so
 * the fetch rules can be unit tested. Every failure returns the committed
 * snapshot instead of inventing numbers, so an offline build or a GitHub
 * outage never breaks a page.
 */

import committed from '@/data/github-snapshot.json';
import type { GitHubRepo, GitHubSnapshot, GitHubUser } from '@/types/github';
import { buildSnapshot, isoDate } from '../../scripts/githubSnapshot.mjs';

export const GITHUB_OWNER = 'Huzbi-crypto';
export const GITHUB_REVALIDATE_SECONDS = 3600;
export const GITHUB_SWR_SECONDS = 86400;

const API_ROOT = 'https://api.github.com';
const FETCH_TIMEOUT_MS = 15_000;
const MAX_REPO_PAGES = 10;

/** The last committed snapshot, used until GitHub answers and whenever it fails. */
export const GITHUB_FALLBACK = committed as GitHubSnapshot;

export type GitHubSnapshotSource = {
  snapshot: GitHubSnapshot;
  /** `live` means every number came from GitHub just now. */
  source: 'live' | 'snapshot';
  /** Why the committed snapshot was used, for logs and diagnostics only. */
  reason?: string;
};

type FetchLike = (input: string, init?: RequestInit & { next?: { revalidate: number } }) => Promise<Response>;

type FetchOptions = {
  /** Injected by tests; defaults to the global fetch. */
  fetchImpl?: FetchLike;
  /** Defaults to GITHUB_TOKEN, then GH_TOKEN. */
  token?: string;
  /** The day recorded as the snapshot date. */
  now?: Date;
};

function tokenFromEnvironment(): string | undefined {
  return process.env.GITHUB_TOKEN || process.env.GH_TOKEN || undefined;
}

function githubHeaders(token: string | undefined): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'huzbi-portfolio',
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function getJson(
  path: string,
  fetchImpl: FetchLike,
  token: string | undefined,
): Promise<{ data: unknown; headers: Headers }> {
  const response = await fetchImpl(`${API_ROOT}${path}`, {
    headers: githubHeaders(token),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    // Let Next's data cache share this response between the API route and
    // the journal page. The route's own ISR window is the same length.
    next: { revalidate: GITHUB_REVALIDATE_SECONDS },
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`GET ${path} -> ${response.status} ${response.statusText}${detail ? `: ${detail.slice(0, 200)}` : ''}`);
  }

  return { data: await response.json(), headers: response.headers };
}

/** Every public repository, newest push first, following GitHub's paging. */
async function fetchRepositories(fetchImpl: FetchLike, token: string | undefined): Promise<GitHubRepo[]> {
  const repositories: GitHubRepo[] = [];

  for (let page = 1; page <= MAX_REPO_PAGES; page += 1) {
    const { data } = await getJson(
      `/users/${GITHUB_OWNER}/repos?per_page=100&type=owner&sort=pushed&page=${page}`,
      fetchImpl,
      token,
    );
    if (!Array.isArray(data)) throw new Error('GitHub returned a repository page that is not a list');
    repositories.push(...(data as GitHubRepo[]));
    if (data.length < 100) return repositories;
  }

  throw new Error(`GitHub returned more than ${MAX_REPO_PAGES * 100} repositories; refusing a partial list`);
}

/**
 * Count the repos Huzbi has starred. A one-item page with the Link header's
 * last page number gives the total without downloading hundreds of entries.
 * This is a nice-to-have: without it the committed total is kept.
 */
async function fetchStarsGiven(fetchImpl: FetchLike, token: string | undefined): Promise<number | null> {
  const { data, headers } = await getJson(
    `/users/${GITHUB_OWNER}/starred?per_page=1`,
    fetchImpl,
    token,
  );
  const last = headers.get('link')?.match(/[?&]page=(\d+)>;\s*rel="last"/i);
  if (last) return Number(last[1]);
  return Array.isArray(data) ? data.length : 0;
}

function assertUsableSnapshot(snapshot: GitHubSnapshot): void {
  if (snapshot.user.login !== GITHUB_OWNER) {
    throw new Error(`GitHub answered for ${snapshot.user.login}, expected ${GITHUB_OWNER}`);
  }
  if (snapshot.repositories.length === 0) {
    throw new Error('GitHub returned no public repositories');
  }
  if (snapshot.stats.totalRepos !== snapshot.repositories.length) {
    throw new Error('Snapshot repository count does not match the repository list');
  }
}

/**
 * Fetch the profile, every public repository and the starred total, then
 * reduce them to exactly the committed snapshot shape.
 */
export async function fetchLiveGitHubSnapshot(options: FetchOptions = {}): Promise<GitHubSnapshot> {
  const fetchImpl = options.fetchImpl ?? (globalThis.fetch as FetchLike);
  if (!fetchImpl) throw new Error('No fetch implementation is available');
  const token = options.token ?? tokenFromEnvironment();

  const { data: userData } = await getJson(`/users/${GITHUB_OWNER}`, fetchImpl, token);
  const user = userData as GitHubUser;
  if (!user || typeof user !== 'object') throw new Error('GitHub returned an invalid profile');

  const repositories = await fetchRepositories(fetchImpl, token);

  let totalStarsGiven = GITHUB_FALLBACK.stats.totalStarsGiven;
  try {
    const counted = await fetchStarsGiven(fetchImpl, token);
    if (counted !== null) totalStarsGiven = counted;
  } catch (error) {
    console.warn(
      `github: could not count starred repos (${errorMessage(error)}); keeping ${totalStarsGiven}.`,
    );
  }

  const snapshot = buildSnapshot({
    user,
    repos: repositories,
    totalStarsGiven,
    date: isoDate(options.now ?? new Date()),
  }) as GitHubSnapshot;

  assertUsableSnapshot(snapshot);
  return snapshot;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * The only entry point pages and routes need: live data when it works, the
 * committed snapshot when it does not, with a clear log either way.
 */
export async function loadGitHubSnapshot(options: FetchOptions = {}): Promise<GitHubSnapshotSource> {
  try {
    return { snapshot: await fetchLiveGitHubSnapshot(options), source: 'live' };
  } catch (error) {
    const reason = errorMessage(error);
    console.warn(
      `github: live fetch failed (${reason}); using the committed snapshot from ` +
        `${GITHUB_FALLBACK.stats.snapshotDate}.`,
    );
    return { snapshot: GITHUB_FALLBACK, source: 'snapshot', reason };
  }
}
