import { auth } from "@/auth";
import { db } from "@/lib/db";
import { decrypt } from "@/lib/crypto";

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
  repo: { name: string };
  created_at: string;
  payload: Record<string, unknown>;
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await db.userSettings.findUnique({
    where: { userId: session.user.id },
  });

  if (!settings?.githubPAT || !settings?.githubUsername) {
    return Response.json(
      { error: "GitHub not configured. Add your PAT and username in Settings." },
      { status: 400 }
    );
  }

  let pat: string;
  try {
    pat = decrypt(settings.githubPAT);
  } catch {
    // Fallback for unencrypted legacy values
    pat = settings.githubPAT;
  }

  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get("endpoint") || "overview";

  const headers: HeadersInit = {
    Authorization: `Bearer ${pat}`,
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "DevPulse",
  };

  try {
    switch (endpoint) {
      case "overview": {
        const [userRes, reposRes, eventsRes] = await Promise.all([
          fetch(`https://api.github.com/users/${encodeURIComponent(settings.githubUsername)}`, { headers }),
          fetch(`https://api.github.com/user/repos?sort=updated&per_page=5&type=all`, { headers }),
          fetch(`https://api.github.com/users/${encodeURIComponent(settings.githubUsername)}/events?per_page=10`, { headers }),
        ]);

        if (!userRes.ok) {
          const status = userRes.status;
          if (status === 401) {
            return Response.json({ error: "Invalid GitHub PAT. Check your token in Settings." }, { status: 401 });
          }
          if (status === 404) {
            return Response.json({ error: "GitHub user not found. Check your username in Settings." }, { status: 404 });
          }
          return Response.json({ error: "Failed to fetch GitHub profile" }, { status: 502 });
        }

        const user: GitHubUser = await userRes.json();
        const repos: GitHubRepo[] = reposRes.ok ? await reposRes.json() : [];
        const events: GitHubEvent[] = eventsRes.ok ? await eventsRes.json() : [];

        return Response.json({
          data: {
            user: {
              login: user.login,
              name: user.name,
              avatar_url: user.avatar_url,
              html_url: user.html_url,
              public_repos: user.public_repos,
              followers: user.followers,
              following: user.following,
              bio: user.bio,
            },
            repos: repos.map((r) => ({
              id: r.id,
              name: r.name,
              full_name: r.full_name,
              html_url: r.html_url,
              description: r.description,
              language: r.language,
              stargazers_count: r.stargazers_count,
              forks_count: r.forks_count,
              updated_at: r.updated_at,
              visibility: r.visibility,
            })),
            events: events.slice(0, 10).map((e) => ({
              id: e.id,
              type: e.type,
              repo: e.repo.name,
              created_at: e.created_at,
            })),
          },
        });
      }

      default:
        return Response.json({ error: "Invalid endpoint" }, { status: 400 });
    }
  } catch {
    return Response.json({ error: "Failed to connect to GitHub" }, { status: 502 });
  }
}
