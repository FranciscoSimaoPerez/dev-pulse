"use client";

import { useEffect, useState, useCallback } from "react";

interface WeatherCurrent {
  temp: number;
  feels_like: number;
  humidity: number;
  wind_speed: number;
  condition: string;
  code: number;
  is_day: number;
}

interface ForecastItem {
  time: string;
  temp: number;
  condition: string;
  code: number;
}

interface WeatherData {
  city: string;
  current: WeatherCurrent;
  forecast: ForecastItem[];
  units: string;
}

function weatherEmoji(code: number, isDay: number): string {
  // WeatherAPI condition codes: https://www.weatherapi.com/docs/weather_conditions.json
  if (code === 1000) return isDay ? "☀️" : "🌙";
  if (code === 1003) return isDay ? "⛅" : "☁️";
  if ([1006, 1009].includes(code)) return "☁️";
  if ([1030, 1135, 1147].includes(code)) return "🌫️";
  if ([1063, 1150, 1153, 1180, 1183, 1240].includes(code)) return isDay ? "🌦️" : "🌧️";
  if ([1186, 1189, 1192, 1195, 1243, 1246].includes(code)) return "🌧️";
  if ([1066, 1069, 1072, 1168, 1171, 1198, 1201, 1204, 1207, 1237, 1249, 1252].includes(code)) return "🌨️";
  if ([1114, 1117, 1210, 1213, 1216, 1219, 1222, 1225, 1255, 1258, 1261, 1264].includes(code)) return "❄️";
  if ([1087, 1273, 1276, 1279, 1282].includes(code)) return "⛈️";
  return "🌡️";
}

function formatHour(timeStr: string): string {
  const date = new Date(timeStr);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function WeatherWidget() {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/weather");
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Failed to load weather");
        return;
      }

      setData(json.data);
    } catch {
      setError("Failed to connect to weather service");
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
          Weather
        </h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 animate-pulse rounded-lg bg-foreground/10" />
            <div className="space-y-1.5">
              <div className="h-6 w-16 animate-pulse rounded bg-foreground/10" />
              <div className="h-3 w-24 animate-pulse rounded bg-foreground/10" />
            </div>
          </div>
          <div className="h-4 w-full animate-pulse rounded bg-foreground/10" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-foreground/10" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-card-border bg-card-bg p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted">
          Weather
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

  const { city, current, forecast, units } = data;
  const unitSymbol = units === "metric" ? "°C" : "°F";
  const windUnit = units === "metric" ? "km/h" : "mph";

  return (
    <div className="rounded-xl border border-card-border bg-card-bg p-6">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted">
        Weather
      </h2>

      {/* Current conditions */}
      <div className="mb-4 flex items-center gap-4">
        <span className="text-4xl">{weatherEmoji(current.code, current.is_day)}</span>
        <div>
          <div className="text-3xl font-bold text-foreground">
            {Math.round(current.temp)}{unitSymbol}
          </div>
          <p className="text-sm capitalize text-muted">
            {current.condition}
          </p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-sm font-medium text-foreground">{city}</p>
          <p className="text-xs text-muted">
            Feels like {Math.round(current.feels_like)}{unitSymbol}
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="mb-4 flex gap-4 rounded-lg bg-foreground/5 px-4 py-2.5 text-xs text-muted">
        <span>
          💧 <span className="font-medium text-foreground">{current.humidity}%</span>{" "}
          humidity
        </span>
        <span>
          💨 <span className="font-medium text-foreground">{current.wind_speed}</span>{" "}
          {windUnit}
        </span>
      </div>

      {/* Forecast */}
      {forecast.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium text-muted">Forecast</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {forecast.map((item, idx) => (
              <div
                key={idx}
                className="flex shrink-0 flex-col items-center rounded-lg border border-card-border px-3 py-2"
              >
                <span className="text-[10px] text-muted">
                  {formatHour(item.time)}
                </span>
                <span className="my-1 text-lg">
                  {weatherEmoji(item.code, 1)}
                </span>
                <span className="text-xs font-medium text-foreground">
                  {Math.round(item.temp)}{unitSymbol}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
