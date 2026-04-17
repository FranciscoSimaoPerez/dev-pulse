import { auth } from "@/auth";
import TasksWidget from "@/components/TasksWidget";
import GitHubWidget from "@/components/GitHubWidget";
import WeatherWidget from "@/components/WeatherWidget";
import NewsWidget from "@/components/NewsWidget";

export default async function DashboardPage() {
  const session = await auth();
  const firstName = session?.user?.name?.split(" ")[0] || "there";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Good {getGreeting()}, {firstName}
        </h1>
        <p className="mt-1 text-sm text-muted">
          Here&apos;s what&apos;s happening today
        </p>
      </div>

      {/* Widget grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <TasksWidget />
        <GitHubWidget />
        <WeatherWidget />
        <NewsWidget />
      </div>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}
