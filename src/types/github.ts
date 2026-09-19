export interface GitHubLicense {
  key: string;
  name: string;
  spdx_id: string;
  url?: string | null;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  fork: boolean;
  homepage: string | null;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  language: string | null;
  forks_count: number;
  open_issues_count: number;
  topics: string[];
  visibility: string;
  default_branch: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  license?: GitHubLicense | null;
}

export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name: string;
  company: string | null;
  blog: string;
  location: string | null;
  email: string | null;
  bio: string;
  twitter_username: string | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

export interface GitHubLanguageBreakdown {
  language: string;
  count: number;
  percentage: number;
}

export interface GitHubStats {
  totalRepos: number;
  totalStarsGiven: number;
  totalStarsReceived: number;
  totalFollowers: number;
  totalFollowing: number;
  topLanguages: GitHubLanguageBreakdown[];
  snapshotDate: string;
}

export interface GitHubSnapshot {
  user: GitHubUser;
  stats: GitHubStats;
  repositories: GitHubRepo[];
}
