#!/usr/bin/env node
/**
 * Refresh `src/data/github-snapshot.json` from GitHub.
 *
 * The site deliberately works from a committed snapshot, not a live request.
 * Run this when Huzbi's numbers change:
 *
 *   pnpm refresh:github
 *
 * It asks the authenticated `gh` CLI first. If `gh` cannot run, it falls back
 * to the REST API with GITHUB_TOKEN/GH_TOKEN. Nothing is written unless every
 * request succeeds: on failure the script prints the real error and leaves the
 * old snapshot untouched instead of inventing numbers.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSnapshot, isoDate } from './githubSnapshot.mjs';

const OWNER = 'Huzbi-crypto';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = resolve(ROOT, 'src/data/github-snapshot.json');

function fail(message, error) {
  console.error(`refresh:github failed: ${message}`);
  if (error) console.error(error instanceof Error ? error.message : String(error));
  console.error('The old snapshot was left untouched.');
  process.exit(1);
}

function readOldSnapshot() {
  try {
    return JSON.parse(readFileSync(SNAPSHOT_PATH, 'utf8'));
  } catch (error) {
    fail(`could not read ${SNAPSHOT_PATH}`, error);
  }
}

function gh(args) {
  // Trim the newline gh adds; callers parse JSON or headers.
  return execFileSync('gh', ['api', ...args], {
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  }).trimEnd();
}

function ghJson(args) {
  return JSON.parse(gh(args));
}

/** Count every starred repo from the Link header's last page, without paging. */
function ghStarredCount() {
  const raw = gh(['--include', 'user/starred?per_page=1']);
  const last = raw.match(/[?&]page=(\d+)>;\s*rel="last"/i);
  if (last) return Number(last[1]);

  // No Link header means zero or one starred repo; the body is a JSON array.
  const body = raw.split(/\r?\n\r?\n/).slice(1).join('\n\n').trim();
  if (!body) return 0;
  const parsed = JSON.parse(body);
  return Array.isArray(parsed) ? parsed.length : 0;
}

function ghPages(path) {
  const raw = gh(['--paginate', '--slurp', path]);
  const pages = JSON.parse(raw);
  return pages.flatMap((page) => (Array.isArray(page) ? page : [page]));
}

async function restJson(path, token) {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'huzbi-portfolio-refresh',
    },
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`GET ${path} -> ${response.status} ${response.statusText}\n${detail}`);
  }
  return { data: await response.json(), headers: response.headers };
}

async function restStarredCount(token) {
  const { headers } = await restJson('/user/starred?per_page=1', token);
  const link = headers.get('link') ?? '';
  const last = link.match(/[?&]page=(\d+)>;\s*rel="last"/i);
  if (last) return Number(last[1]);
  const { data } = await restJson('/user/starred?per_page=1', token);
  return Array.isArray(data) ? data.length : 0;
}

/** Try gh first, then the REST API with a token. Both return the same shape. */
async function fetchFromGitHub() {
  try {
    const user = ghJson(['user']);
    const repos = ghPages(`users/${OWNER}/repos?per_page=100&type=owner`);
    let totalStarsGiven = null;
    try {
      totalStarsGiven = ghStarredCount();
    } catch (error) {
      console.warn(
        `warning: could not count starred repos with gh (${error.message}); keeping the old totalStarsGiven.`,
      );
    }
    return { user, repos, totalStarsGiven, source: 'gh api' };
  } catch (ghError) {
    console.warn(`warning: gh api failed (${ghError.message}); trying the REST API.`);

    const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
    if (!token) throw ghError;

    const { data: user } = await restJson('/user', token);
    const repos = [];
    for (let page = 1; ; page += 1) {
      const { data } = await restJson(
        `/users/${OWNER}/repos?per_page=100&type=owner&page=${page}`,
        token,
      );
      repos.push(...data);
      if (data.length < 100) break;
    }

    let totalStarsGiven = null;
    try {
      totalStarsGiven = await restStarredCount(token);
    } catch (error) {
      console.warn(
        `warning: could not count starred repos over REST (${error.message}); keeping the old totalStarsGiven.`,
      );
    }
    return { user, repos, totalStarsGiven, source: 'REST API' };
  }
}

async function main() {
  const old = readOldSnapshot();
  const { user, repos, totalStarsGiven, source } = await fetchFromGitHub();

  const snapshot = buildSnapshot({
    user,
    repos,
    totalStarsGiven: totalStarsGiven ?? old?.stats?.totalStarsGiven ?? 0,
    date: isoDate(),
  });

  writeFileSync(SNAPSHOT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');

  const { stats } = snapshot;
  console.log(`Refreshed ${SNAPSHOT_PATH} from ${source} on ${stats.snapshotDate}.`);
  console.log(
    `${stats.totalRepos} repos, ${stats.totalStarsReceived} stars received, ` +
      `${stats.totalFollowers} followers, ${stats.totalStarsGiven} stars given.`,
  );
  if (stats.topLanguages.length > 0) {
    console.log(
      `Top languages: ${stats.topLanguages
        .slice(0, 3)
        .map((entry) => `${entry.language} ${entry.count}`)
        .join(', ')}.`,
    );
  }
}

main().catch((error) => fail('GitHub request failed', error));
