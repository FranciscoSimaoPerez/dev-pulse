import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await db.userSettings.findUnique({
    where: { userId: session.user.id },
  });

  if (!settings) {
    return Response.json({ data: null });
  }

  // Return settings but mask sensitive fields (show only last 4 chars)
  return Response.json({
    data: {
      githubUsername: settings.githubUsername || "",
      githubPAT: settings.githubPAT ? maskSecret(settings.githubPAT) : "",
      weatherCity: settings.weatherCity || "",
      openWeatherKey: settings.openWeatherKey
        ? maskSecret(settings.openWeatherKey)
        : "",
      newsApiKey: settings.newsApiKey ? maskSecret(settings.newsApiKey) : "",
      newsKeywords: settings.newsKeywords || "",
    },
  });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    githubUsername,
    githubPAT,
    weatherCity,
    openWeatherKey,
    newsApiKey,
    newsKeywords,
  } = body;

  // Build update data — only update secrets if they're not masked values
  const existing = await db.userSettings.findUnique({
    where: { userId: session.user.id },
  });

  const data: Record<string, string | null> = {
    githubUsername: typeof githubUsername === "string" ? githubUsername.trim() : null,
    weatherCity: typeof weatherCity === "string" ? weatherCity.trim() : null,
    newsKeywords: typeof newsKeywords === "string" ? newsKeywords.trim() : null,
  };

  // Only update secrets if the user provided a new (non-masked) value
  if (typeof githubPAT === "string" && !isMasked(githubPAT)) {
    data.githubPAT = githubPAT.trim() || null;
  } else if (existing) {
    data.githubPAT = existing.githubPAT;
  }

  if (typeof openWeatherKey === "string" && !isMasked(openWeatherKey)) {
    data.openWeatherKey = openWeatherKey.trim() || null;
  } else if (existing) {
    data.openWeatherKey = existing.openWeatherKey;
  }

  if (typeof newsApiKey === "string" && !isMasked(newsApiKey)) {
    data.newsApiKey = newsApiKey.trim() || null;
  } else if (existing) {
    data.newsApiKey = existing.newsApiKey;
  }

  const settings = await db.userSettings.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      ...data,
    },
    update: data,
  });

  return Response.json({
    data: {
      githubUsername: settings.githubUsername || "",
      githubPAT: settings.githubPAT ? maskSecret(settings.githubPAT) : "",
      weatherCity: settings.weatherCity || "",
      openWeatherKey: settings.openWeatherKey
        ? maskSecret(settings.openWeatherKey)
        : "",
      newsApiKey: settings.newsApiKey ? maskSecret(settings.newsApiKey) : "",
      newsKeywords: settings.newsKeywords || "",
    },
  });
}

function maskSecret(value: string): string {
  if (value.length <= 4) return "••••";
  return "••••" + value.slice(-4);
}

function isMasked(value: string): boolean {
  return value.startsWith("••••");
}
