"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";

interface Article {
  source: { name: string };
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
}

interface NewsData {
  articles: Article[];
  keywords: string;
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
  return `${days}d ago`;
}

export default function NewsWidget() {
  const [data, setData] = useState<NewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/news");
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Failed to load news");
        return;
      }

      setData(json.data);
    } catch {
      setError("Failed to connect to news service");
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
          News
        </h2>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="h-16 w-16 shrink-0 animate-pulse rounded-lg bg-foreground/10" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-full animate-pulse rounded bg-foreground/10" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-foreground/10" />
                <div className="h-3 w-1/3 animate-pulse rounded bg-foreground/10" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-card-border bg-card-bg p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted">
          News
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

  const { articles, keywords } = data;

  return (
    <div className="rounded-xl border border-card-border bg-card-bg p-6">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
          News
        </h2>
        <span className="text-[10px] text-muted">{keywords}</span>
      </div>

      {articles.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted">
          No articles found for your keywords
        </p>
      ) : (
        <ul className="space-y-3">
          {articles.map((article, idx) => (
            <li key={idx}>
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex gap-3"
              >
                {article.urlToImage ? (
                  <Image
                    src={article.urlToImage}
                    alt=""
                    width={64}
                    height={64}
                    className="h-16 w-16 shrink-0 rounded-lg object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-foreground/5 text-xl text-muted">
                    📰
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-medium text-foreground group-hover:text-accent">
                    {article.title}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-[10px] text-muted">
                    <span>{article.source.name}</span>
                    <span>·</span>
                    <span>{timeAgo(article.publishedAt)}</span>
                  </div>
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
