import { auth } from "@/auth";

function WidgetSkeleton({ title }: { title: string }) {
  return (
    <div className="rounded-xl border border-card-border bg-card-bg p-6">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted">
        {title}
      </h2>
      <div className="space-y-3">
        <div className="h-4 w-3/4 animate-pulse rounded bg-foreground/10" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-foreground/10" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-foreground/10" />
      </div>
    </div>
  );
}

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
        <WidgetSkeleton title="Tasks" />
        <WidgetSkeleton title="GitHub" />
        <WidgetSkeleton title="Weather" />
        <WidgetSkeleton title="News" />
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
