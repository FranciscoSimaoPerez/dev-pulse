import { auth } from "@/auth";
import { db } from "@/lib/db";
import { decrypt } from "@/lib/crypto";

interface NewsArticle {
  source: { name: string };
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await db.userSettings.findUnique({
    where: { userId: session.user.id },
  });

  if (!settings?.newsApiKey) {
    return Response.json(
      { error: "News not configured. Add your NewsAPI key in Settings." },
      { status: 400 }
    );
  }

  let apiKey: string;
  try {
    apiKey = decrypt(settings.newsApiKey);
  } catch {
    apiKey = settings.newsApiKey;
  }

  const keywords = settings.newsKeywords?.trim() || "technology";
  const encodedKeywords = encodeURIComponent(keywords);

  try {
    const res = await fetch(
      `https://newsapi.org/v2/everything?q=${encodedKeywords}&sortBy=publishedAt&pageSize=10&language=en`,
      {
        headers: {
          "X-Api-Key": apiKey,
        },
      }
    );

    if (!res.ok) {
      const status = res.status;
      if (status === 401) {
        return Response.json(
          { error: "Invalid NewsAPI key. Check Settings." },
          { status: 401 }
        );
      }
      if (status === 429) {
        return Response.json(
          { error: "NewsAPI rate limit reached. Try again later." },
          { status: 429 }
        );
      }
      return Response.json(
        { error: "Failed to fetch news" },
        { status: 502 }
      );
    }

    const data = await res.json();

    const articles: NewsArticle[] = (data.articles || [])
      .filter((a: NewsArticle) => a.title && a.title !== "[Removed]")
      .slice(0, 10)
      .map((a: NewsArticle) => ({
        source: { name: a.source?.name || "Unknown" },
        title: a.title,
        description: a.description,
        url: a.url,
        urlToImage: a.urlToImage,
        publishedAt: a.publishedAt,
      }));

    return Response.json({
      data: {
        articles,
        keywords: settings.newsKeywords || "technology",
      },
    });
  } catch {
    return Response.json(
      { error: "Failed to connect to news service" },
      { status: 502 }
    );
  }
}
