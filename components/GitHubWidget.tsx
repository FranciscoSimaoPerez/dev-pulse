"use client";

import { useEffect, useState, useCallback } from "react";

interface GitHubUser {
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
  public_repos: number;
  followers: number;
  following: number;
  bio: string | null;
}

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  visibility: string;
}

interface GitHubEvent {
  id: string;
  type: string;
  repo: string;
  created_at: string;
}

interface GitHubData {
  user: GitHubUser;
  repos: GitHubRepo[];
  events: GitHubEvent[];
}

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Rust: "#dea584",
  Go: "#00ADD8",
  Java: "#b07219",
  "C++": "#f34b7d",
  C: "#555555",
  Ruby: "#701516",
  PHP: "#4F5D95",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Dart: "#00B4AB",
  Shell: "#89e051",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Vue: "#41b883",
  Svelte: "#ff3e00",
};

function formatEventType(type: string): string {
  const map: Record<string, string> = {
    PushEvent: "Pushed to",
    CreateEvent: "Created",
    DeleteEvent: "Deleted",
    PullRequestEvent: "PR on",
    IssuesEvent: "Issue on",
    IssueCommentEvent: "Commented on",
    WatchEvent: "Starred",
    ForkEvent: "Forked",
    ReleaseEvent: "Released",
    PublicEvent: "Made public",
  };
  return map[type] || type.replace("Event", "");
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

export default function GitHubWidget() {
  const [data, setData] = useState<GitHubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"repos" | "activity">("repos");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/github?endpoint=overview");
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Failed to load GitHub data");
        return;
      }

      setData(json.data);
    } catch {
      setError("Failed to connect to GitHub");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="rounded-xl border border-card-border bg-card-bg p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted">
          GitHub
        </h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 animate-pulse rounded-full bg-foreground/10" />
            <div className="space-y-1.5">
              <div className="h-4 w-24 animate-pulse rounded bg-foreground/10" />
              <div className="h-3 w-16 animate-pulse rounded bg-foreground/10" />
            </div>
          </div>
          <div className="h-4 w-3/4 animate-pulse rounded bg-foreground/10" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-foreground/10" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-foreground/10" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-card-border bg-card-bg p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted">
          GitHub
        </h2>
        <div className="rounded-lg border border-danger/20 bg-danger/5 p-4">
          <p className="text-sm text-danger">{error}</p>
          <button
            onClick={fetchData}
            className="mt-2 text-xs font-medium text-accent hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { user, repos, events } = data;

  return (
    <div className="rounded-xl border border-card-border bg-card-bg p-6">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted">
        GitHub
      </h2>

      {/* Profile header */}
      <div className="mb-4 flex items-center gap-3">
        <img
          src={user.avatar_url}
          alt={user.login}
          className="h-10 w-10 rounded-full"
        />
        <div className="min-w-0 flex-1">
          <a
            href={user.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block truncate text-sm font-semibold text-foreground hover:text-accent"
          >
            {user.name || user.login}
          </a>
          <p className="text-xs text-muted">@{user.login}</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="mb-4 flex gap-4 text-xs text-muted">
        <span>
          <span className="font-semibold text-foreground">
            {user.public_repos}
          </span>{" "}
          repos
        </span>
        <span>
          <span className="font-semibold text-foreground">
            {user.followers}
          </span>{" "}
          followers
        </span>
        <span>
          <span className="font-semibold text-foreground">
            {user.following}
          </span>{" "}
          following
        </span>
      </div>

      {/* Tab toggle */}
      <div className="mb-3 flex gap-1 rounded-lg bg-foreground/5 p-0.5">
        <button
          onClick={() => setTab("repos")}
          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            tab === "repos"
              ? "bg-card-bg text-foreground shadow-sm"
              : "text-muted hover:text-foreground"
          }`}
        >
          Repos
        </button>
        <button
          onClick={() => setTab("activity")}
          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            tab === "activity"
              ? "bg-card-bg text-foreground shadow-sm"
              : "text-muted hover:text-foreground"
          }`}
        >
          Activity
        </button>
      </div>

      {/* Repos tab */}
      {tab === "repos" && (
        <ul className="space-y-2">
          {repos.length === 0 && (
            <li className="py-2 text-center text-xs text-muted">
              No repositories found
            </li>
          )}
          {repos.map((repo) => (
            <li
              key={repo.id}
              className="rounded-lg border border-card-border p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <a
                  href={repo.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-sm font-medium text-accent hover:underline"
                >
                  {repo.name}
                </a>
                <span className="shrink-0 rounded-full border border-card-border px-2 py-0.5 text-[10px] text-muted">
                  {repo.visibility}
                </span>
              </div>
              {repo.description && (
                <p className="mt-1 line-clamp-1 text-xs text-muted">
                  {repo.description}
                </p>
              )}
              <div className="mt-2 flex items-center gap-3 text-xs text-muted">
                {repo.language && (
                  <span className="flex items-center gap-1">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{
                        backgroundColor:
                          LANGUAGE_COLORS[repo.language] || "#8b8b8b",
                      }}
                    />
                    {repo.language}
                  </span>
                )}
                {repo.stargazers_count > 0 && (
                  <span>★ {repo.stargazers_count}</span>
                )}
                {repo.forks_count > 0 && (
                  <span>⑂ {repo.forks_count}</span>
                )}
                <span className="ml-auto">{timeAgo(repo.updated_at)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Activity tab */}
      {tab === "activity" && (
        <ul className="space-y-1.5">
          {events.length === 0 && (
            <li className="py-2 text-center text-xs text-muted">
              No recent activity
            </li>
          )}
          {events.map((event) => (
            <li
              key={event.id}
              className="flex items-baseline justify-between gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-foreground/5"
            >
              <span className="min-w-0 truncate text-foreground">
                <span className="text-muted">
                  {formatEventType(event.type)}
                </span>{" "}
                {event.repo.split("/").pop()}
              </span>
              <span className="shrink-0 text-muted">
                {timeAgo(event.created_at)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
