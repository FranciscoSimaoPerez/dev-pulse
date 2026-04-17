"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  project: { id: string; name: string; color: string } | null;
}

const priorityColors: Record<string, string> = {
  HIGH: "text-danger",
  MEDIUM: "text-warning",
  LOW: "text-success",
};

export default function TasksWidget() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quickAdd, setQuickAdd] = useState("");
  const [adding, setAdding] = useState(false);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks");
      if (!res.ok) throw new Error("Failed to load tasks");
      const { data } = await res.json();
      setTasks(data);
      setError("");
    } catch {
      setError("Could not load tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  async function handleQuickAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!quickAdd.trim()) return;
    setAdding(true);

    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: quickAdd.trim() }),
    });

    if (res.ok) {
      setQuickAdd("");
      fetchTasks();
    }
    setAdding(false);
  }

  async function toggleStatus(task: Task) {
    const newStatus = task.status === "DONE" ? "TODO" : "DONE";
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchTasks();
  }

  // Show only incomplete tasks + recently completed, max 5
  const activeTasks = tasks
    .filter((t) => t.status !== "DONE")
    .slice(0, 5);
  const doneCount = tasks.filter((t) => t.status === "DONE").length;
  const totalCount = tasks.length;

  if (loading) {
    return (
      <div className="rounded-xl border border-card-border bg-card-bg p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted">Tasks</h2>
        <div className="space-y-3">
          <div className="h-4 w-3/4 animate-pulse rounded bg-foreground/10" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-foreground/10" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-foreground/10" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-card-border bg-card-bg p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Tasks</h2>
        <span className="text-xs text-muted">
          {doneCount}/{totalCount} done
        </span>
      </div>

      {error && (
        <div className="mb-3 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</div>
      )}

      {/* Quick add */}
      <form onSubmit={handleQuickAdd} className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={quickAdd}
            onChange={(e) => setQuickAdd(e.target.value)}
            placeholder="Quick add task..."
            className="flex-1 rounded-lg border border-card-border bg-background px-3 py-1.5 text-sm text-foreground placeholder-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <button
            type="submit"
            disabled={adding || !quickAdd.trim()}
            className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
          >
            +
          </button>
        </div>
      </form>

      {/* Task list */}
      {activeTasks.length === 0 && totalCount === 0 ? (
        <p className="py-4 text-center text-sm text-muted">No tasks yet</p>
      ) : (
        <ul className="space-y-2">
          {activeTasks.map((task) => (
            <li key={task.id} className="flex items-center gap-3">
              <button
                onClick={() => toggleStatus(task)}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-card-border hover:border-accent"
              >
                {task.status === "DONE" && (
                  <svg className="h-3 w-3 text-accent" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
              <span className={`flex-1 truncate text-sm ${task.status === "DONE" ? "text-muted line-through" : "text-foreground"}`}>
                {task.title}
              </span>
              <span className={`text-xs font-medium ${priorityColors[task.priority] || "text-muted"}`}>
                {task.priority === "HIGH" ? "!" : task.priority === "MEDIUM" ? "•" : ""}
              </span>
              {task.project && (
                <span
                  className="rounded-full px-2 py-0.5 text-xs"
                  style={{ backgroundColor: task.project.color + "20", color: task.project.color }}
                >
                  {task.project.name}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Link to full tasks page */}
      {totalCount > 0 && (
        <Link href="/tasks" className="mt-4 block text-center text-xs font-medium text-accent hover:text-accent-hover">
          View all tasks →
        </Link>
      )}
    </div>
  );
}
