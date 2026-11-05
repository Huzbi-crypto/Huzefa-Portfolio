import { unstable_cache } from 'next/cache';
import {
  GITHUB_REVALIDATE_SECONDS,
  loadGitHubSnapshot,
  type GitHubSnapshotSource,
} from './github';

/**
 * One server-side cache entry shared by `/api/github` and `/github/`.
 *
 * `revalidate` makes Next refresh the entry after an hour while keeping the
 * last good value available, and the route/page send an explicit
 * `s-maxage=3600, stale-while-revalidate=86400` header for any CDN in front.
 * If GitHub fails, `loadGitHubSnapshot` returns the committed snapshot and
 * the build or page still succeeds.
 */
const cached = unstable_cache(
  async (): Promise<GitHubSnapshotSource> => loadGitHubSnapshot(),
  ['github-snapshot'],
  { revalidate: GITHUB_REVALIDATE_SECONDS, tags: ['github-snapshot'] },
);

export async function getGitHubSnapshot(): Promise<GitHubSnapshotSource> {
  return cached();
}
