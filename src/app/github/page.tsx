'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { useGitHubData } from '@/hooks/useGitHubData';
import { ContributionWall } from '@/components/github/ContributionWall';
import { StarCluster } from '@/components/github/StarCluster';
import {
  Star,
  GitFork,
  BookOpen,
  ExternalLink,
  Search,
  RefreshCw,
  Users,
  Code2,
  Flame,
  Radio,
} from 'lucide-react';
import { GithubIcon } from '@/components/icons';

const LANGUAGE_DOT_COLORS: Record<string, string> = {
  Python: '#3572A5',
  JavaScript: '#F1E05A',
  'C++': '#F34B7D',
  C: '#555555',
  HTML: '#E34C26',
  CSS: '#563D7C',
  Java: '#B07219',
  default: '#8C929D',
};

type SortOption = 'stars' | 'updated' | 'name' | 'size';

export default function GitHubHubPage() {
  const {
    user,
    stats,
    repositories,
    statusLabel,
    isLive,
    isLoading,
    error,
    lastUpdated,
    refetch,
  } = useGitHubData();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('stars');

  // Distinct languages from repositories
  const availableLanguages = useMemo(() => {
    const set = new Set<string>();
    repositories.forEach((r) => {
      if (r.language) set.add(r.language);
    });
    return Array.from(set).sort();
  }, [repositories]);

  // Filtered and sorted repositories
  const filteredRepos = useMemo(() => {
    return repositories
      .filter((repo) => {
        if (selectedLanguage !== 'all' && repo.language !== selectedLanguage) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = repo.name.toLowerCase().includes(q);
          const matchDesc = (repo.description || '').toLowerCase().includes(q);
          const matchLang = (repo.language || '').toLowerCase().includes(q);
          const matchTopic = repo.topics?.some((t) => t.toLowerCase().includes(q));
          if (!matchName && !matchDesc && !matchLang && !matchTopic) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'stars') {
          const diff = (b.stargazers_count || 0) - (a.stargazers_count || 0);
          if (diff !== 0) return diff;
          return new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime();
        }
        if (sortBy === 'updated') {
          return new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime();
        }
        if (sortBy === 'size') {
          return (b.size || 0) - (a.size || 0);
        }
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        return 0;
      });
  }, [repositories, selectedLanguage, searchQuery, sortBy]);

  return (
    <main className="min-h-screen bg-bg text-fg font-sans selection:bg-accent selection:text-bg pb-24">
      {/* Page Hero: Profile & Snapshot Meta */}
      <section className="max-w-6xl mx-auto px-4 sm:px-8 pt-6 sm:pt-10 pb-8">
        {/* Error / Nap Banner if API rate limited or unreachable */}
        {error && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-accent-secondary/15 border border-accent-secondary/40 mb-6 text-xs font-mono">
            <div className="flex items-center gap-2.5">
              <Radio className="w-4 h-4 text-accent-secondary animate-pulse" />
              <div>
                <span className="font-bold text-fg">GitHub data is taking a nap.</span>{' '}
                <span className="text-fg-muted hidden sm:inline">
                  (Showing cached snapshot archive). You can still visit the profile directly.
                </span>
              </div>
            </div>
            <a
              href={user.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-bg-surface hover:bg-bg-hover text-accent-secondary font-bold border border-accent-secondary/40 transition-colors"
            >
              <span>OPEN GITHUB</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* Sync Status Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-bg-surface border border-border mb-8 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isLive ? 'bg-accent shadow-crt animate-pulse-subtle' : 'bg-accent-secondary'
              }`}
            />
            <span className="text-fg font-medium">STATUS: {statusLabel}</span>
            <span className="text-fg-subtle hidden sm:inline">
              (Synced: {lastUpdated})
            </span>
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-bg-deep hover:bg-bg-hover text-fg-muted hover:text-fg border border-border transition-colors disabled:opacity-50"
            title="Fetch fresh data from GitHub API"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin text-accent' : ''}`} />
            <span>{isLoading ? 'Syncing...' : 'Refresh API'}</span>
          </button>
        </div>

        {/* Profile Card Header */}
        <div className="p-6 sm:p-8 rounded-2xl bg-bg-surface border border-border shadow-subtle grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Avatar and Identity */}
          <div className="lg:col-span-8 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-border bg-bg-deep flex-shrink-0">
              <Image
                src={user.avatar_url}
                alt={user.name}
                fill
                sizes="96px"
                className="object-cover"
                priority
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-fg">
                  {user.name}
                </h1>
                <a
                  href={user.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-0.5 rounded text-xs font-mono bg-bg-deep border border-border text-accent hover:underline flex items-center gap-1"
                >
                  <GithubIcon className="w-3.5 h-3.5" />
                  <span>@{user.login}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <p className="text-sm text-fg-muted font-sans max-w-xl">
                {user.bio}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-fg-subtle pt-1">
                {user.blog && (
                  <a
                    href={user.blog}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-accent transition-colors underline decoration-accent/30"
                  >
                    {user.blog.replace('https://', '')}
                  </a>
                )}
                <span>Member since {new Date(user.created_at).getFullYear()}</span>
              </div>
            </div>
          </div>

          {/* Direct CTA */}
          <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-2.5 justify-end">
            <a
              href={user.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-bg font-mono text-xs font-bold shadow-crt hover:opacity-95 transition-all"
            >
              <GithubIcon className="w-4 h-4" />
              <span>Follow on GitHub</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <a
              href="https://github.com/Huzbi-crypto?tab=stars"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-bg-deep hover:bg-bg-hover text-fg border border-border font-mono text-xs transition-colors"
            >
              <Star className="w-3.5 h-3.5 text-accent-secondary" />
              <span>View 349 Starred Repos</span>
            </a>
          </div>
        </div>

        {/* Key GitHub Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div className="p-4 rounded-xl bg-bg-surface border border-border">
            <div className="flex items-center justify-between text-fg-subtle font-mono text-xs">
              <span>REPOSITORIES</span>
              <BookOpen className="w-3.5 h-3.5 text-accent" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-fg mt-1">
              {stats.totalRepos}
            </div>
            <div className="text-[11px] font-mono text-fg-muted mt-0.5">Public projects</div>
          </div>

          <div className="p-4 rounded-xl bg-bg-surface border border-border">
            <div className="flex items-center justify-between text-fg-subtle font-mono text-xs">
              <span>GITHUB STARS</span>
              <Star className="w-3.5 h-3.5 text-accent-secondary fill-accent-secondary" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-accent-secondary mt-1">
              {stats.totalStarsGiven}
            </div>
            <div className="text-[11px] font-mono text-fg-muted mt-0.5">
              Profile Stars ({stats.totalStarsReceived} on repos)
            </div>
          </div>

          <div className="p-4 rounded-xl bg-bg-surface border border-border">
            <div className="flex items-center justify-between text-fg-subtle font-mono text-xs">
              <span>STARS RECEIVED</span>
              <Flame className="w-3.5 h-3.5 text-accent-tertiary" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-accent-tertiary mt-1">
              {stats.totalStarsReceived}
            </div>
            <div className="text-[11px] font-mono text-fg-muted mt-0.5">Across public repositories</div>
          </div>

          <div className="p-4 rounded-xl bg-bg-surface border border-border">
            <div className="flex items-center justify-between text-fg-subtle font-mono text-xs">
              <span>COMMUNITY</span>
              <Users className="w-3.5 h-3.5 text-accent-cream" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-fg mt-1">
              {stats.totalFollowers}
            </div>
            <div className="text-[11px] font-mono text-fg-muted mt-0.5">
              {stats.totalFollowing} following
            </div>
          </div>
        </div>

        {/* Languages Breakdown Bar */}
        <div className="mt-6 p-5 rounded-xl bg-bg-surface border border-border">
          <div className="flex items-center justify-between font-mono text-xs text-fg-muted mb-3">
            <div className="flex items-center gap-2 text-accent">
              <Code2 className="w-4 h-4" />
              <span>PRIMARY LANGUAGES SPECTRUM</span>
            </div>
            <span>{stats.topLanguages.length} Languages Detected</span>
          </div>

          {/* Multi-segmented Progress Bar */}
          <div className="h-3 w-full rounded-full bg-bg-deep overflow-hidden flex mb-4">
            {stats.topLanguages.map((lang) => (
              <div
                key={lang.language}
                style={{
                  width: `${lang.percentage}%`,
                  backgroundColor:
                    LANGUAGE_DOT_COLORS[lang.language] || LANGUAGE_DOT_COLORS.default,
                }}
                title={`${lang.language}: ${lang.percentage}% (${lang.count} repos)`}
                className="h-full transition-all duration-300 first:rounded-l-full last:rounded-r-full hover:opacity-80"
              />
            ))}
          </div>

          {/* Language Pills */}
          <div className="flex flex-wrap gap-2.5">
            {stats.topLanguages.map((lang) => (
              <button
                key={lang.language}
                type="button"
                onClick={() =>
                  setSelectedLanguage(
                    selectedLanguage === lang.language ? 'all' : lang.language
                  )
                }
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono border transition-colors ${
                  selectedLanguage === lang.language
                    ? 'bg-accent/20 text-accent border-accent font-bold'
                    : 'bg-bg-deep text-fg-muted border-border hover:text-fg'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor:
                      LANGUAGE_DOT_COLORS[lang.language] || LANGUAGE_DOT_COLORS.default,
                  }}
                />
                <span>{lang.language}</span>
                <span className="text-fg-subtle text-[11px]">
                  {lang.percentage}% ({lang.count})
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 1: PIXEL CONTRIBUTION WALL */}
      <section className="max-w-6xl mx-auto px-4 sm:px-8 py-6">
        <ContributionWall repositories={repositories} />
      </section>

      {/* SECTION 2: CELESTIAL STAR CLUSTER */}
      <section className="max-w-6xl mx-auto px-4 sm:px-8 py-6">
        <StarCluster repositories={repositories} />
      </section>

      {/* SECTION 3: ALL 38 REPOSITORIES EXPLORER */}
      <section className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
        <div className="border-b border-border/70 pb-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-fg flex items-center gap-2">
                <GithubIcon className="w-5 h-5 text-accent" />
                <span>All {repositories.length} Public Repositories</span>
              </h2>
              <p className="text-xs font-mono text-fg-muted mt-1">
                Search, filter, and inspect Huzbi&apos;s full open-source codebase archive.
              </p>
            </div>

            {/* Filter by language quick dropdown or pills */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-fg-subtle hidden md:inline">Sort:</span>
              <div className="flex items-center gap-1 text-xs font-mono bg-bg-surface p-1 rounded-lg border border-border">
                <button
                  type="button"
                  onClick={() => setSortBy('stars')}
                  className={`px-2 py-1 rounded transition-colors ${
                    sortBy === 'stars'
                      ? 'bg-accent text-bg font-bold'
                      : 'text-fg-muted hover:text-fg'
                  }`}
                >
                  Most Stars
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy('updated')}
                  className={`px-2 py-1 rounded transition-colors ${
                    sortBy === 'updated'
                      ? 'bg-accent text-bg font-bold'
                      : 'text-fg-muted hover:text-fg'
                  }`}
                >
                  Recent Push
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy('name')}
                  className={`px-2 py-1 rounded transition-colors ${
                    sortBy === 'name'
                      ? 'bg-accent text-bg font-bold'
                      : 'text-fg-muted hover:text-fg'
                  }`}
                >
                  Name (A-Z)
                </button>
              </div>
            </div>
          </div>

          {/* Search bar & Language Pills */}
          <div className="mt-5 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-subtle" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by repo name, keyword, or topic..."
                className="w-full pl-9 pr-4 py-2 rounded-lg bg-bg-surface border border-border focus:border-accent focus:ring-1 focus:ring-accent text-xs font-mono text-fg placeholder:text-fg-subtle outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-fg-subtle hover:text-fg"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Language filter buttons */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
              <button
                type="button"
                onClick={() => setSelectedLanguage('all')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  selectedLanguage === 'all'
                    ? 'bg-accent text-bg font-bold shadow-crt'
                    : 'bg-bg-surface text-fg-muted hover:text-fg border border-border'
                }`}
              >
                All Languages
              </button>
              {(availableLanguages.length > 0 ? availableLanguages : ['Python', 'JavaScript', 'C++', 'C', 'Java']).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() =>
                    setSelectedLanguage(selectedLanguage === lang ? 'all' : lang)
                  }
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    selectedLanguage === lang
                      ? 'bg-accent text-bg font-bold shadow-crt'
                      : 'bg-bg-surface text-fg-muted hover:text-fg border border-border'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Repository Cards Grid */}
        {filteredRepos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredRepos.map((repo) => {
              const langColor =
                LANGUAGE_DOT_COLORS[repo.language || ''] || LANGUAGE_DOT_COLORS.default;

              return (
                <div
                  key={repo.id}
                  className="p-5 rounded-xl bg-bg-surface border border-border hover:border-accent/60 transition-all duration-200 flex flex-col justify-between group shadow-subtle hover:shadow-crt"
                >
                  <div>
                    {/* Top line: Name & Stars */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <a
                        href={repo.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-sm text-fg group-hover:text-accent transition-colors flex items-center gap-1.5 break-all"
                      >
                        <span>{repo.name}</span>
                        <ExternalLink className="w-3 h-3 text-fg-subtle opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      </a>

                      <div className="flex items-center gap-2 flex-shrink-0 text-xs font-mono">
                        {repo.stargazers_count > 0 && (
                          <span className="flex items-center gap-1 text-accent-secondary font-semibold">
                            <Star className="w-3 h-3 fill-current" />
                            <span>{repo.stargazers_count}</span>
                          </span>
                        )}
                        {repo.forks_count > 0 && (
                          <span className="flex items-center gap-1 text-fg-subtle">
                            <GitFork className="w-3 h-3" />
                            <span>{repo.forks_count}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-fg-muted font-sans line-clamp-3 leading-relaxed">
                      {repo.description || 'No description provided in repository manifest.'}
                    </p>

                    {/* Topic Tags */}
                    {repo.topics && repo.topics.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {repo.topics.slice(0, 3).map((topic) => (
                          <span
                            key={topic}
                            className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-bg-deep text-accent-tertiary border border-border/50"
                          >
                            #{topic}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Card Footer: Language & Pushed At */}
                  <div className="pt-4 mt-4 border-t border-border/50 flex items-center justify-between text-xs font-mono text-fg-subtle">
                    <span className="flex items-center gap-1.5 text-fg">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: langColor }}
                      />
                      <span>{repo.language || 'Markdown'}</span>
                    </span>

                    <span title={`Last pushed: ${repo.pushed_at}`}>
                      {new Date(repo.pushed_at).toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty Search Result */
          <div className="p-12 text-center rounded-2xl bg-bg-surface border border-dashed border-border/80">
            <h3 className="font-mono text-base font-bold text-fg">
              No matching repositories found
            </h3>
            <p className="text-xs text-fg-muted font-sans mt-1">
              Try adjusting your search terms or reset the language filter.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedLanguage('all');
              }}
              className="mt-4 px-4 py-1.5 rounded-lg bg-bg-deep border border-border text-accent text-xs font-mono"
            >
              Reset Filters
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
