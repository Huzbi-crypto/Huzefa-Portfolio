import type { Metadata } from 'next';
import Link from 'next/link';
import snapshot from '@/data/github-snapshot.json';
import contributionData from '@/data/github-contributions.json';
import type {
  GitHubContributionDay,
  GitHubContributionsResponse,
  GitHubRepo,
  GitHubSnapshot,
} from '@/types/github';
import { JournalPage } from '@/components/journal/JournalPage';
import { PixelPanel } from '@/components/journal/PixelPanel';
import { PixelArt } from '@/components/journal/PixelArt';
import { ICONS, SCENE } from '@/components/journal/journalArt';

export const metadata: Metadata = {
  title: 'GitHub Log | Huzbi',
  description:
    'The honest GitHub snapshot: 38 public repositories, the language breakdown, and a year of lit contribution windows.',
};

const HEAT_CELL = 11;
const HEAT_LEFT = 30;
const HEAT_TOP = 20;

function formatDay(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function formatMonth(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/** Group a year of days into calendar weeks, Sunday first, with honest gaps. */
function toWeeks(days: GitHubContributionDay[]): (GitHubContributionDay | null)[][] {
  const weeks: (GitHubContributionDay | null)[][] = [];
  let week: (GitHubContributionDay | null)[] = [];

  if (days.length === 0) return weeks;

  const firstDow = new Date(`${days[0].date}T00:00:00Z`).getUTCDay();
  for (let index = 0; index < firstDow; index += 1) week.push(null);

  for (const day of days) {
    week.push(day);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }

  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  return weeks;
}

function streakStats(days: GitHubContributionDay[]) {
  let activeDays = 0;
  let longest = 0;
  let run = 0;

  for (const day of days) {
    if (day.count > 0) {
      activeDays += 1;
      run += 1;
      if (run > longest) longest = run;
    } else {
      run = 0;
    }
  }

  let current = 0;
  for (let index = days.length - 1; index >= 0; index -= 1) {
    if (days[index].count > 0) current += 1;
    else break;
  }

  return { activeDays, longest, current };
}

/**
 * The GitHub log: the same real snapshot the game's observatory reads, drawn
 * as a journal spread. Static on purpose — it reads in full with no scripts,
 * and the snapshot date is always shown so nothing pretends to be live.
 */
export default function GitHubHubPage() {
  const data = snapshot as GitHubSnapshot;
  const contributions = contributionData as GitHubContributionsResponse;
  const days = contributions.contributions;
  const weeks = toWeeks(days);
  const streaks = streakStats(days);
  const totalContributions =
    contributions.total.lastYear || days.reduce((sum, day) => sum + day.count, 0);

  const monthLabels: { label: string; column: number }[] = [];
  let lastLabelColumn = -10;
  weeks.forEach((week, column) => {
    const firstOfMonth = week.find(
      (day) => day && new Date(`${day.date}T00:00:00Z`).getUTCDate() === 1,
    );
    if (!firstOfMonth) return;
    if (column === 0 || column - lastLabelColumn >= 3) {
      monthLabels.push({ label: formatMonth(firstOfMonth.date), column });
      lastLabelColumn = column;
    }
  });

  const heatWidth = HEAT_LEFT + weeks.length * HEAT_CELL;
  const heatHeight = HEAT_TOP + 7 * HEAT_CELL;
  const languages = data.stats.topLanguages;

  return (
    <JournalPage
      title={data.user.name}
      lede={data.user.bio}
      art={
        <div className="j-page-art">
          <PixelArt grid={SCENE.window} scale={5} label="The room's window onto the night sky" />
          <PixelArt grid={ICONS.star} scale={7} />
        </div>
      }
    >
      <PixelPanel as="section" aria-labelledby="profile-heading">
        <p className="j-kicker">GitHub profile / @{data.user.login}</p>
        <h2 id="profile-heading">The account behind the commits</h2>
        <p>
          Public repos: {data.user.public_repos}. Gists: {data.user.public_gists}.
          Member since{' '}
          {new Date(data.user.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            timeZone: 'UTC',
          })}
          . This is the same snapshot the constellation in the dark reads, taken{' '}
          {formatDay(data.stats.snapshotDate)}.
        </p>
        <ul className="j-meta">
          <li>
            <a href={data.user.html_url} target="_blank" rel="noopener noreferrer">
              github.com/{data.user.login}
            </a>
          </li>
          <li>
            <a href={data.user.blog} target="_blank" rel="noopener noreferrer">
              {data.user.blog.replace('https://', '')}
            </a>
          </li>
        </ul>
        <div className="j-row">
          <a
            href={data.user.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="j-btn"
          >
            Follow on GitHub
          </a>
          <a
            href="https://github.com/Huzbi-crypto?tab=stars"
            target="_blank"
            rel="noopener noreferrer"
            className="j-btn"
            data-kind="ghost"
          >
            View {data.stats.totalStarsGiven} starred repos
          </a>
        </div>
      </PixelPanel>

      <section className="j-section" aria-labelledby="numbers-heading">
        <h2 id="numbers-heading">The numbers</h2>
        <div className="j-grid" data-cols="4">
          <PixelPanel tone="dim">
            <p className="j-stat">
              <span className="j-stat-num">{data.stats.totalRepos}</span>
              <span className="j-stat-label">Public repositories</span>
            </p>
          </PixelPanel>
          <PixelPanel tone="dim">
            <p className="j-stat">
              <span className="j-stat-num">{data.stats.totalStarsGiven}</span>
              <span className="j-stat-label">Repos starred by Huzbi</span>
            </p>
          </PixelPanel>
          <PixelPanel tone="dim">
            <p className="j-stat">
              <span className="j-stat-num">{data.stats.totalStarsReceived}</span>
              <span className="j-stat-label">Stars received on repos</span>
            </p>
          </PixelPanel>
          <PixelPanel tone="dim">
            <p className="j-stat">
              <span className="j-stat-num">{data.stats.totalFollowers}</span>
              <span className="j-stat-label">
                Followers · {data.stats.totalFollowing} following
              </span>
            </p>
          </PixelPanel>
        </div>
      </section>

      <PixelPanel as="section" aria-labelledby="languages-heading">
        <p className="j-kicker">Primary languages spectrum</p>
        <h2 id="languages-heading">{languages.length} languages detected</h2>
        <div className="j-bar" aria-hidden="true">
          {languages.map((language, index) => (
            <span
              key={language.language}
              data-i={index % 8}
              style={{ width: `${language.percentage}%` }}
            />
          ))}
        </div>
        <ul className="j-key">
          {languages.map((language, index) => (
            <li key={language.language}>
              <i data-i={index % 8} aria-hidden="true" />
              <span>
                {language.language} · {language.percentage}% ({language.count} repos)
              </span>
            </li>
          ))}
        </ul>
      </PixelPanel>

      <PixelPanel as="section" aria-labelledby="wall-heading">
        <p className="j-kicker">Pixel activity / illuminated habitat</p>
        <h2 id="wall-heading">The year&apos;s lit windows</h2>
        <p className="j-muted">
          Every square is one day of commits, experiments and code activity.
          Brighter windows held more work.
        </p>
        <div className="j-grid" data-cols="3">
          <p className="j-stat">
            <span className="j-stat-num">{totalContributions.toLocaleString('en-US')}</span>
            <span className="j-stat-label">Contributions in the year</span>
          </p>
          <p className="j-stat">
            <span className="j-stat-num">{streaks.longest}</span>
            <span className="j-stat-label">Longest streak, days</span>
          </p>
          <p className="j-stat">
            <span className="j-stat-num">{streaks.activeDays}</span>
            <span className="j-stat-label">Days with work</span>
          </p>
        </div>
        <figure className="j-figure">
          <div className="j-heat-scroll" tabIndex={0}>
            <svg
              className="j-heat"
              viewBox={`0 0 ${heatWidth} ${heatHeight}`}
              role="img"
              aria-labelledby="heat-title heat-desc"
              shapeRendering="crispEdges"
            >
              <title id="heat-title">Contribution windows for the last year</title>
              <desc id="heat-desc">
                {`${totalContributions} contributions across ${streaks.activeDays} active days, between ${formatDay(days[0].date)} and ${formatDay(days[days.length - 1].date)}.`}
              </desc>
              {monthLabels.map((label) => (
                <text
                  key={`${label.label}-${label.column}`}
                  x={HEAT_LEFT + label.column * HEAT_CELL}
                  y={10}
                >
                  {label.label}
                </text>
              ))}
              {['Sun', 'Tue', 'Thu', 'Sat'].map((label, index) => (
                <text key={label} x={0} y={HEAT_TOP + index * 2 * HEAT_CELL + 8}>
                  {label}
                </text>
              ))}
              {weeks.map((week, column) =>
                week.map((day, row) =>
                  day ? (
                    <rect
                      key={day.date}
                      x={HEAT_LEFT + column * HEAT_CELL}
                      y={HEAT_TOP + row * HEAT_CELL}
                      width={9}
                      height={9}
                      data-l={day.level}
                    >
                      <title>
                        {`${day.count} contributions on ${formatDay(day.date)}`}
                      </title>
                    </rect>
                  ) : null,
                ),
              )}
            </svg>
          </div>
          <figcaption className="j-figcaption">
            {formatDay(days[0].date)} to {formatDay(days[days.length - 1].date)}.
            Current streak: {streaks.current} {streaks.current === 1 ? 'day' : 'days'}.
          </figcaption>
        </figure>
      </PixelPanel>

      <section className="j-section" aria-labelledby="repos-heading">
        <h2 id="repos-heading">All {data.repositories.length} public repositories</h2>
        <p className="j-muted">
          The full catalog, exactly as the snapshot recorded it. Names open the
          real repository.
        </p>
        <div className="j-grid">
          {data.repositories.map((repo: GitHubRepo) => (
            <PixelPanel as="article" key={repo.id} className="j-repo">
              <div className="j-repo-head">
                <h3 className="j-repo-name">
                  <a href={repo.html_url} target="_blank" rel="noopener noreferrer">
                    {repo.name}
                  </a>
                </h3>
                <span className="j-repo-meta">
                  <span>
                    <strong>{repo.stargazers_count}</strong> stars
                  </span>
                  <span>
                    <strong>{repo.forks_count}</strong> forks
                  </span>
                </span>
              </div>
              <p>{repo.description || 'No description in the repository manifest.'}</p>
              {repo.topics.length > 0 ? (
                <div className="j-row">
                  {repo.topics.slice(0, 3).map((topic) => (
                    <span className="j-chip" key={topic}>
                      #{topic}
                    </span>
                  ))}
                </div>
              ) : null}
              <p className="j-repo-meta">
                <span>{repo.language || 'Markdown'}</span>
                <span>Last push {formatDay(repo.pushed_at.slice(0, 10))}</span>
              </p>
            </PixelPanel>
          ))}
        </div>
      </section>

      <PixelPanel as="section" tone="note" aria-labelledby="snapshot-heading">
        <p className="j-kicker">Snapshot, not a live feed</p>
        <h2 id="snapshot-heading">Taken {formatDay(data.stats.snapshotDate)}.</h2>
        <p>
          This page reads the committed snapshot so it stays readable and honest
          with scripts off. The room&apos;s observatory draws the same stars, and
          the profile itself is always live over on GitHub.
        </p>
        <div className="j-row">
          <a
            href={data.user.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="j-btn"
          >
            Open the live profile
          </a>
          <Link href="/projects/" className="j-btn" data-kind="ghost">
            The project lab
          </Link>
        </div>
      </PixelPanel>
    </JournalPage>
  );
}
