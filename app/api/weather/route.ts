import { auth } from "@/auth";
import { db } from "@/lib/db";
import { decrypt } from "@/lib/crypto";

interface ForecastHour {
  time: string;
  temp_c: number;
  temp_f: number;
  condition: { text: string; code: number };
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await db.userSettings.findUnique({
    where: { userId: session.user.id },
  });

  if (!settings?.openWeatherKey || !settings?.weatherCity) {
    return Response.json(
      { error: "Weather not configured. Add your city and API key in Settings." },
      { status: 400 }
    );
  }

  const { searchParams } = new URL(request.url);
  const units = searchParams.get("units") || "metric";
  const city = encodeURIComponent(settings.weatherCity);

  let key: string;
  try {
    key = decrypt(settings.openWeatherKey);
  } catch {
    key = settings.openWeatherKey;
  }

  try {
    // WeatherAPI.com forecast endpoint includes current + forecast
    const res = await fetch(
      `https://api.weatherapi.com/v1/forecast.json?key=${key}&q=${city}&days=1&aqi=no`
    );

    if (!res.ok) {
      const status = res.status;
      if (status === 401 || status === 403) {
        return Response.json(
          { error: "Invalid WeatherAPI key. Check Settings." },
          { status: 401 }
        );
      }
      if (status === 400) {
        const body = await res.json().catch(() => null);
        const code = body?.error?.code;
        if (code === 1006) {
          return Response.json(
            { error: "City not found. Check your city name in Settings." },
            { status: 404 }
          );
        }
        return Response.json(
          { error: "Invalid request to weather service" },
          { status: 400 }
        );
      }
      return Response.json(
        { error: "Failed to fetch weather data" },
        { status: 502 }
      );
    }

    const data = await res.json();
    const current = data.current;
    const forecastDay = data.forecast?.forecastday?.[0];

    // Get upcoming hours from now
    const nowEpoch = current.last_updated_epoch;
    const upcomingHours: ForecastHour[] = (forecastDay?.hour || [])
      .filter((h: { time_epoch: number }) => h.time_epoch > nowEpoch)
      .slice(0, 8);

    return Response.json({
      data: {
        city: data.location.name,
        current: {
          temp: units === "metric" ? current.temp_c : current.temp_f,
          feels_like: units === "metric" ? current.feelslike_c : current.feelslike_f,
          humidity: current.humidity,
          wind_speed: units === "metric" ? current.wind_kph : current.wind_mph,
          condition: current.condition.text,
          code: current.condition.code,
          is_day: current.is_day,
        },
        forecast: upcomingHours.map((h) => ({
          time: h.time,
          temp: units === "metric" ? h.temp_c : h.temp_f,
          condition: h.condition.text,
          code: h.condition.code,
        })),
        units,
      },
    });
  } catch {
    return Response.json(
      { error: "Failed to connect to weather service" },
      { status: 502 }
    );
  }
}
