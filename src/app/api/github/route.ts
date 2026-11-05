import { NextResponse } from 'next/server';
import type { GitHubSnapshot } from '@/types/github';
import { GITHUB_REVALIDATE_SECONDS, GITHUB_SWR_SECONDS } from '@/lib/github';
import { getGitHubSnapshot } from '@/lib/githubCache';

/**
 * The cached GitHub feed used by the game and the journal page.
 *
 * The route is generated ahead of time and revalidated hourly. If the live
 * request fails, `getGitHubSnapshot` returns the committed snapshot, so the
 * response is always the same shape and the game never gets an empty feed.
 */
export const dynamic = 'force-static';
export const revalidate = 3600;

export async function GET(): Promise<NextResponse<GitHubSnapshot>> {
  const { snapshot, source } = await getGitHubSnapshot();

  return NextResponse.json(snapshot, {
    status: 200,
    headers: {
      'Cache-Control': `public, s-maxage=${GITHUB_REVALIDATE_SECONDS}, stale-while-revalidate=${GITHUB_SWR_SECONDS}`,
      'X-GitHub-Data': source,
      'X-GitHub-Snapshot-Date': snapshot.stats.snapshotDate,
      ...(source === 'snapshot' ? { 'X-GitHub-Fallback': 'committed-snapshot' } : {}),
    },
  });
}
