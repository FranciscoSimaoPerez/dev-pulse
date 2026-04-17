import { auth } from "@/auth";
import { db } from "@/lib/db";
import { encrypt, decrypt } from "@/lib/crypto";

function decryptOrNull(value: string | null): string | null {
  if (!value) return null;
  try {
    return decrypt(value);
  } catch {
    // Value may be stored unencrypted (legacy) — return as-is
    return value;
  }
}

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

  // Return settings but mask sensitive fields (show only last 4 chars of decrypted value)
  const pat = decryptOrNull(settings.githubPAT);
  const owKey = decryptOrNull(settings.openWeatherKey);
  const naKey = decryptOrNull(settings.newsApiKey);

  return Response.json({
    data: {
      githubUsername: settings.githubUsername || "",
      githubPAT: pat ? maskSecret(pat) : "",
      weatherCity: settings.weatherCity || "",
      openWeatherKey: owKey ? maskSecret(owKey) : "",
      newsApiKey: naKey ? maskSecret(naKey) : "",
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

  // Only update secrets if the user provided a new (non-masked) value — encrypt before storing
  if (typeof githubPAT === "string" && !isMasked(githubPAT)) {
    data.githubPAT = githubPAT.trim() ? encrypt(githubPAT.trim()) : null;
  } else if (existing) {
    data.githubPAT = existing.githubPAT;
  }

  if (typeof openWeatherKey === "string" && !isMasked(openWeatherKey)) {
    data.openWeatherKey = openWeatherKey.trim() ? encrypt(openWeatherKey.trim()) : null;
  } else if (existing) {
    data.openWeatherKey = existing.openWeatherKey;
  }

  if (typeof newsApiKey === "string" && !isMasked(newsApiKey)) {
    data.newsApiKey = newsApiKey.trim() ? encrypt(newsApiKey.trim()) : null;
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

  const patDecrypted = decryptOrNull(settings.githubPAT);
  const owDecrypted = decryptOrNull(settings.openWeatherKey);
  const naDecrypted = decryptOrNull(settings.newsApiKey);

  return Response.json({
    data: {
      githubUsername: settings.githubUsername || "",
      githubPAT: patDecrypted ? maskSecret(patDecrypted) : "",
      weatherCity: settings.weatherCity || "",
      openWeatherKey: owDecrypted ? maskSecret(owDecrypted) : "",
      newsApiKey: naDecrypted ? maskSecret(naDecrypted) : "",
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
