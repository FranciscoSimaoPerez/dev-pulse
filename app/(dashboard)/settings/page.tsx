"use client";

import { useEffect, useState, useCallback } from "react";

interface Settings {
  githubUsername: string;
  githubPAT: string;
  weatherCity: string;
  openWeatherKey: string;
  newsApiKey: string;
  newsKeywords: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    githubUsername: "",
    githubPAT: "",
    weatherCity: "",
    openWeatherKey: "",
    newsApiKey: "",
    newsKeywords: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      const json = await res.json();
      if (res.ok && json.data) {
        setSettings({
          githubUsername: json.data.githubUsername || "",
          githubPAT: json.data.githubPAT || "",
          weatherCity: json.data.weatherCity || "",
          openWeatherKey: json.data.openWeatherKey || "",
          newsApiKey: json.data.newsApiKey || "",
          newsKeywords: json.data.newsKeywords || "",
        });
      }
    } catch {
      // Settings may not exist yet — that's fine
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const json = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: "Settings saved successfully" });
      } else {
        setMessage({ type: "error", text: json.error || "Failed to save" });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to save settings" });
    } finally {
      setSaving(false);
    }
  }

  function updateField(field: keyof Settings, value: string) {
    setSettings((prev) => ({ ...prev, [field]: value }));
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="mt-1 text-sm text-muted">
            Configure your API keys and preferences
          </p>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-xl border border-card-border bg-card-bg"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted">
          Configure your API keys and preferences
        </p>
      </div>

      {message && (
        <div
          className={`rounded-lg border p-3 text-sm ${
            message.type === "success"
              ? "border-success/20 bg-success/5 text-success"
              : "border-danger/20 bg-danger/5 text-danger"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* GitHub */}
        <fieldset className="rounded-xl border border-card-border bg-card-bg p-6">
          <legend className="px-2 text-sm font-semibold uppercase tracking-wider text-muted">
            GitHub
          </legend>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="githubUsername"
                className="mb-1 block text-sm font-medium text-foreground"
              >
                Username
              </label>
              <input
                id="githubUsername"
                type="text"
                value={settings.githubUsername}
                onChange={(e) => updateField("githubUsername", e.target.value)}
                placeholder="your-github-username"
                className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <div>
              <label
                htmlFor="githubPAT"
                className="mb-1 block text-sm font-medium text-foreground"
              >
                Personal Access Token
              </label>
              <input
                id="githubPAT"
                type="password"
                value={settings.githubPAT}
                onChange={(e) => updateField("githubPAT", e.target.value)}
                placeholder="ghp_xxxxxxxxxxxx"
                className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <p className="mt-1 text-xs text-muted">
                Generate at GitHub → Settings → Developer settings → Personal
                access tokens
              </p>
            </div>
          </div>
        </fieldset>

        {/* Weather */}
        <fieldset className="rounded-xl border border-card-border bg-card-bg p-6">
          <legend className="px-2 text-sm font-semibold uppercase tracking-wider text-muted">
            Weather
          </legend>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="weatherCity"
                className="mb-1 block text-sm font-medium text-foreground"
              >
                City
              </label>
              <input
                id="weatherCity"
                type="text"
                value={settings.weatherCity}
                onChange={(e) => updateField("weatherCity", e.target.value)}
                placeholder="London"
                className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <div>
              <label
                htmlFor="openWeatherKey"
                className="mb-1 block text-sm font-medium text-foreground"
              >
                WeatherAPI Key
              </label>
              <input
                id="openWeatherKey"
                type="password"
                value={settings.openWeatherKey}
                onChange={(e) => updateField("openWeatherKey", e.target.value)}
                placeholder="your-api-key"
                className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <p className="mt-1 text-xs text-muted">
                Get a free key at weatherapi.com
              </p>
            </div>
          </div>
        </fieldset>

        {/* News */}
        <fieldset className="rounded-xl border border-card-border bg-card-bg p-6">
          <legend className="px-2 text-sm font-semibold uppercase tracking-wider text-muted">
            News
          </legend>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="newsApiKey"
                className="mb-1 block text-sm font-medium text-foreground"
              >
                NewsAPI Key
              </label>
              <input
                id="newsApiKey"
                type="password"
                value={settings.newsApiKey}
                onChange={(e) => updateField("newsApiKey", e.target.value)}
                placeholder="your-api-key"
                className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <div>
              <label
                htmlFor="newsKeywords"
                className="mb-1 block text-sm font-medium text-foreground"
              >
                Keywords
              </label>
              <input
                id="newsKeywords"
                type="text"
                value={settings.newsKeywords}
                onChange={(e) => updateField("newsKeywords", e.target.value)}
                placeholder="typescript, react, nextjs"
                className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <p className="mt-1 text-xs text-muted">
                Comma-separated keywords for filtering news articles
              </p>
            </div>
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent/90 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </form>
    </div>
  );
}
