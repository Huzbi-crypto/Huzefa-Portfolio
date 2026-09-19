'use client';

import { useState, useEffect, useCallback } from 'react';
import type { GitHubSnapshot, GitHubUser, GitHubRepo, GitHubStats, GitHubLanguageBreakdown } from '@/types/github';
import initialSnapshot from '@/data/github-snapshot.json';

const CACHE_KEY = 'huzbi_github_data_v1';
const CACHE_TIME_KEY = 'huzbi_github_data_time_v1';
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes client cache

export interface UseGitHubDataReturn {
  user: GitHubUser;
  stats: GitHubStats;
  repositories: GitHubRepo[];
  status: 'cached' | 'fetching' | 'live' | 'error';
  isLive: boolean;
  isCached: boolean;
  isLoading: boolean;
  error: string | null;
  statusLabel: string;
  lastUpdated: string;
  refetch: () => Promise<void>;
}

function calculateLanguagesBreakdown(repos: GitHubRepo[]): GitHubLanguageBreakdown[] {
  const languageCounts: Record<string, number> = {};
  let totalWithLanguage = 0;

  for (const repo of repos) {
    if (repo.language && !repo.fork) {
      languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1;
      totalWithLanguage++;
    }
  }

  if (totalWithLanguage === 0) {
    return (initialSnapshot as GitHubSnapshot).stats.topLanguages;
  }

  const sorted = Object.entries(languageCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([language, count]) => ({
      language,
      count,
      percentage: Number(((count / totalWithLanguage) * 100).toFixed(1)),
    }));

  return sorted;
}

export function useGitHubData(): UseGitHubDataReturn {
  const fallbackSnapshot = initialSnapshot as GitHubSnapshot;

  const [data, setData] = useState<GitHubSnapshot>(fallbackSnapshot);
  const [status, setStatus] = useState<'cached' | 'fetching' | 'live' | 'error'>('cached');
  const [isLive, setIsLive] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>(fallbackSnapshot.stats.snapshotDate);

  const fetchLiveGitHubData = useCallback(async (force = false) => {
    // Check localStorage cache first if not forced
    if (!force && typeof window !== 'undefined') {
      try {
        const cachedRaw = localStorage.getItem(CACHE_KEY);
        const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
        if (cachedRaw && cachedTime) {
          const age = Date.now() - Number(cachedTime);
          if (age < CACHE_TTL_MS) {
            const parsed = JSON.parse(cachedRaw) as GitHubSnapshot;
            if (parsed.user && Array.isArray(parsed.repositories)) {
              setData(parsed);
              setIsLive(true);
              setStatus('live');
              setLastUpdated(parsed.stats.snapshotDate || new Date(Number(cachedTime)).toISOString().split('T')[0]);
              return;
            }
          }
        }
      } catch {
        // Fall through to fetch
      }
    }

    setStatus('fetching');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

      const [userRes, reposRes] = await Promise.all([
        fetch('https://api.github.com/users/Huzbi-crypto', {
          signal: controller.signal,
          headers: { Accept: 'application/vnd.github.v3+json' },
        }),
        fetch('https://api.github.com/users/Huzbi-crypto/repos?per_page=100&sort=pushed', {
          signal: controller.signal,
          headers: { Accept: 'application/vnd.github.v3+json' },
        }),
      ]);

      clearTimeout(timeoutId);

      // Check for rate limits or errors
      if (!userRes.ok || !reposRes.ok) {
        const isRateLimited = userRes.status === 403 || reposRes.status === 403;
        const msg = isRateLimited
          ? 'GitHub API rate limit reached (60 req/hr unauthenticated)'
          : `GitHub API error: ${userRes.status}/${reposRes.status}`;
        
        setError(msg);
        setStatus('cached');
        setIsLive(false);
        return;
      }

      const rawUser = await userRes.json();
      const rawRepos = await reposRes.json();

      if (!Array.isArray(rawRepos)) {
        throw new Error('Invalid repository payload from GitHub API');
      }

      const totalStarsReceived = rawRepos.reduce(
        (sum: number, repo: { stargazers_count?: number }) => sum + (repo.stargazers_count || 0),
        0
      );

      const topLanguages = calculateLanguagesBreakdown(rawRepos as GitHubRepo[]);
      const nowIso = new Date().toISOString().split('T')[0];

      const freshSnapshot: GitHubSnapshot = {
        user: {
          login: rawUser.login,
          id: rawUser.id,
          avatar_url: rawUser.avatar_url,
          html_url: rawUser.html_url,
          name: rawUser.name || 'Huzbi Naru',
          company: rawUser.company,
          blog: rawUser.blog,
          location: rawUser.location,
          email: rawUser.email,
          bio: rawUser.bio || "I'm Huzbi. I like to code and read manga 'n books.",
          twitter_username: rawUser.twitter_username,
          public_repos: rawUser.public_repos,
          public_gists: rawUser.public_gists || 0,
          followers: rawUser.followers,
          following: rawUser.following,
          created_at: rawUser.created_at,
          updated_at: rawUser.updated_at,
        },
        stats: {
          totalRepos: rawUser.public_repos,
          totalStarsGiven: fallbackSnapshot.stats.totalStarsGiven, // stars given isn't directly exposed on basic user endpoint
          totalStarsReceived,
          totalFollowers: rawUser.followers,
          totalFollowing: rawUser.following,
          topLanguages,
          snapshotDate: nowIso,
        },
        repositories: rawRepos as GitHubRepo[],
      };

      setData(freshSnapshot);
      setIsLive(true);
      setStatus('live');
      setError(null);
      setLastUpdated(nowIso);

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(freshSnapshot));
          localStorage.setItem(CACHE_TIME_KEY, String(Date.now()));
        } catch {
          // Ignore storage quota errors
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to reach GitHub API';
      setError(message);
      setStatus('cached');
      setIsLive(false);
      // Data remains intact with offline fallback
    }
  }, [fallbackSnapshot.stats.snapshotDate, fallbackSnapshot.stats.totalStarsGiven]);

  useEffect(() => {
    // Run background refresh on mount
    fetchLiveGitHubData();
  }, [fetchLiveGitHubData]);

  const statusLabel = isLive
    ? 'Live from GitHub API'
    : status === 'fetching'
    ? 'Checking GitHub API...'
    : 'GitHub snapshot cached';

  return {
    user: data.user,
    stats: data.stats,
    repositories: data.repositories,
    status,
    isLive,
    isCached: !isLive,
    isLoading: status === 'fetching',
    error,
    statusLabel,
    lastUpdated,
    refetch: () => fetchLiveGitHubData(true),
  };
}
