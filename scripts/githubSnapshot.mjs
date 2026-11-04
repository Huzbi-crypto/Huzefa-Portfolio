/**
 * Pure helpers behind `pnpm refresh:github`.
 *
 * The site reads a committed snapshot, never a live API, so the shape here is
 * exactly what `src/types/github.ts` describes. Everything in this file takes
 * its data as arguments and returns a fresh object: the network lives in
 * `refresh-github.mjs`, which keeps these rules easy to test.
 */

/** Only the fields the site actually reads are saved, in the same shape. */
export const USER_FIELDS = [
  'login',
  'id',
  'avatar_url',
  'html_url',
  'name',
  'company',
  'blog',
  'location',
  'email',
  'bio',
  'twitter_username',
  'public_repos',
  'public_gists',
  'followers',
  'following',
  'created_at',
  'updated_at',
];

export const REPO_FIELDS = [
  'id',
  'name',
  'full_name',
  'html_url',
  'description',
  'fork',
  'homepage',
  'size',
  'stargazers_count',
  'watchers_count',
  'language',
  'forks_count',
  'open_issues_count',
  'topics',
  'visibility',
  'default_branch',
  'created_at',
  'updated_at',
  'pushed_at',
];

/** Today's calendar date where the refresh runs, which is what the plaque says. */
export function isoDate(now = new Date()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Keep the profile fields the site knows about. Missing optional text becomes
 * an empty string rather than `null`, so the page never renders "null".
 */
export function pickUser(user) {
  const saved = {};
  for (const field of USER_FIELDS) saved[field] = user?.[field] ?? null;
  for (const field of ['name', 'blog', 'bio']) {
    if (saved[field] == null) saved[field] = '';
  }
  return saved;
}

/** One public repo, with GitHub's own values and no invented ones. */
export function pickRepo(repo) {
  const saved = {};
  for (const field of REPO_FIELDS) saved[field] = repo?.[field] ?? null;
  saved.description = saved.description ?? null;
  saved.homepage = saved.homepage ?? null;
  saved.language = saved.language ?? null;
  saved.topics = Array.isArray(saved.topics) ? [...saved.topics] : [];
  saved.license = repo?.license ?? null;
  return saved;
}

/**
 * Count primary languages across the repos that declare one. Percentages use
 * the same denominator the committed snapshot always has: repos with a
 * language, not every repo, rounded to one decimal.
 */
export function languageBreakdown(repos) {
  const counts = new Map();
  for (const repo of repos) {
    if (!repo.language) continue;
    counts.set(repo.language, (counts.get(repo.language) ?? 0) + 1);
  }
  const total = [...counts.values()].reduce((sum, count) => sum + count, 0);
  return [...counts.entries()]
    .map(([language, count]) => ({
      language,
      count,
      percentage: total === 0 ? 0 : Math.round((count / total) * 1000) / 10,
    }))
    .sort((a, b) => b.count - a.count || a.language.localeCompare(b.language));
}

/**
 * Build the committed snapshot from GitHub's raw responses.
 *
 * `totalStarsGiven` cannot be derived from a profile or a repo list, so the
 * caller passes it in: fetched when the API allows it, otherwise carried over
 * from the old snapshot. `date` is the day the snapshot was taken.
 */
export function buildSnapshot({ user, repos, totalStarsGiven, date }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(`Snapshot date must be YYYY-MM-DD, got ${date}`);
  }

  const savedRepos = repos
    .map(pickRepo)
    .sort(
      (a, b) =>
        String(b.pushed_at ?? '').localeCompare(String(a.pushed_at ?? '')) ||
        String(a.name).localeCompare(String(b.name)),
    );

  return {
    user: pickUser(user),
    stats: {
      totalRepos: savedRepos.length,
      totalStarsGiven,
      totalStarsReceived: savedRepos.reduce(
        (sum, repo) => sum + Number(repo.stargazers_count ?? 0),
        0,
      ),
      totalFollowers: Number(user?.followers ?? 0),
      totalFollowing: Number(user?.following ?? 0),
      topLanguages: languageBreakdown(savedRepos),
      snapshotDate: date,
    },
    repositories: savedRepos,
  };
}

/** Read a snapshot's numbers without trusting its formatting. */
export function snapshotNumbers(snapshot) {
  return {
    repos: snapshot?.stats?.totalRepos,
    stars: snapshot?.stats?.totalStarsReceived,
    followers: snapshot?.stats?.totalFollowers,
    date: snapshot?.stats?.snapshotDate,
  };
}
