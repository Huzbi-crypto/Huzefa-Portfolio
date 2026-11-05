/**
 * The game's copy of the GitHub snapshot.
 *
 * The committed JSON is the instant, offline-safe value. On the client the
 * game asks `/api/github` once on load; that route serves GitHub data cached
 * for an hour. Updating the value here is enough for the plaque and the star
 * map to redraw with the fresh numbers, because both read through
 * `githubSnapshot()` when they draw.
 */

import committed from '@/data/github-snapshot.json';
import type { GitHubSnapshot } from '@/types/github';

const fallback = committed as GitHubSnapshot;

let current: GitHubSnapshot = fallback;
let hydrationStarted = false;

/** The numbers to draw right now: live when it arrived, committed otherwise. */
export function githubSnapshot(): GitHubSnapshot {
  return current;
}

/** Replace the snapshot after a successful live fetch. */
export function setGitHubSnapshot(snapshot: GitHubSnapshot): void {
  current = snapshot;
}

/** A shallow shape check, so a bad API response never reaches the canvas. */
export function isGitHubSnapshot(value: unknown): value is GitHubSnapshot {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<GitHubSnapshot>;
  return (
    Boolean(candidate.user) &&
    typeof candidate.user?.login === 'string' &&
    Boolean(candidate.stats) &&
    typeof candidate.stats?.totalRepos === 'number' &&
    typeof candidate.stats?.totalStarsReceived === 'number' &&
    typeof candidate.stats?.totalFollowers === 'number' &&
    typeof candidate.stats?.snapshotDate === 'string' &&
    Array.isArray(candidate.repositories)
  );
}

/**
 * Fetch the cached feed once per page load. Any failure is logged and leaves
 * the committed snapshot in place; it is never allowed to break the game.
 */
export async function hydrateGitHubSnapshot(): Promise<void> {
  if (hydrationStarted) return;
  hydrationStarted = true;

  try {
    const response = await fetch('/api/github/', {
      headers: { accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data: unknown = await response.json();
    if (!isGitHubSnapshot(data)) throw new Error('the response was not a GitHub snapshot');

    setGitHubSnapshot(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`github: live data unavailable (${message}); keeping the committed snapshot.`);
  }
}
