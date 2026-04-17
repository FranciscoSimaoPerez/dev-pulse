"use client";

import { useState, useEffect, useCallback } from "react";
import TaskModal from "@/components/TaskModal";

interface Project {
  id: string;
  name: string;
  color: string;
  _count: { tasks: number };
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  projectId: string | null;
  project: { id: string; name: string; color: string } | null;
  createdAt: string;
}

const statusLabels: Record<string, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};

const statusColors: Record<string, string> = {
  TODO: "bg-muted/20 text-muted",
  IN_PROGRESS: "bg-warning/20 text-warning",
  DONE: "bg-success/20 text-success",
};

const priorityColors: Record<string, string> = {
  HIGH: "text-danger",
  MEDIUM: "text-warning",
  LOW: "text-success",
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterPriority, setFilterPriority] = useState<string>("ALL");
  const [filterProject, setFilterProject] = useState<string>("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectColor, setNewProjectColor] = useState("#6366f1");
  const [showProjectForm, setShowProjectForm] = useState(false);

  const fetchData = useCallback(async () => {
    const [tasksRes, projectsRes] = await Promise.all([
      fetch("/api/tasks"),
      fetch("/api/projects"),
    ]);

    if (tasksRes.ok) {
      const { data } = await tasksRes.json();
      setTasks(data);
    }
    if (projectsRes.ok) {
      const { data } = await projectsRes.json();
      setProjects(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleDelete(id: string) {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    fetchData();
  }

  async function handleToggleStatus(task: Task) {
    const newStatus = task.status === "DONE" ? "TODO" : "DONE";
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchData();
  }

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newProjectName.trim(), color: newProjectColor }),
    });

    if (res.ok) {
      setNewProjectName("");
      setNewProjectColor("#6366f1");
      setShowProjectForm(false);
      fetchData();
    }
  }

  async function handleDeleteProject(id: string) {
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    if (filterProject === id) setFilterProject("ALL");
    fetchData();
  }

  const filtered = tasks.filter((t) => {
    if (filterStatus !== "ALL" && t.status !== filterStatus) return false;
    if (filterPriority !== "ALL" && t.priority !== filterPriority) return false;
    if (filterProject !== "ALL" && t.projectId !== filterProject) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
          <p className="mt-1 text-sm text-muted">Manage your projects and tasks</p>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-card-bg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
          <p className="mt-1 text-sm text-muted">
            {tasks.filter((t) => t.status !== "DONE").length} active · {tasks.filter((t) => t.status === "DONE").length} completed
          </p>
        </div>
        <button
          onClick={() => { setEditingTask(null); setModalOpen(true); }}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
        >
          + New Task
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-card-border bg-card-bg px-3 py-1.5 text-sm text-foreground focus:border-accent focus:outline-none"
        >
          <option value="ALL">All statuses</option>
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="DONE">Done</option>
        </select>
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="rounded-lg border border-card-border bg-card-bg px-3 py-1.5 text-sm text-foreground focus:border-accent focus:outline-none"
        >
          <option value="ALL">All priorities</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
        <select
          value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)}
          className="rounded-lg border border-card-border bg-card-bg px-3 py-1.5 text-sm text-foreground focus:border-accent focus:outline-none"
        >
          <option value="ALL">All projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Task list */}
        <div className="space-y-3 lg:col-span-2">
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-card-border bg-card-bg p-8 text-center text-sm text-muted">
              {tasks.length === 0 ? "No tasks yet — create one to get started!" : "No tasks match your filters"}
            </div>
          ) : (
            filtered.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-4 rounded-xl border border-card-border bg-card-bg p-4"
              >
                {/* Checkbox */}
                <button
                  onClick={() => handleToggleStatus(task)}
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                    task.status === "DONE"
                      ? "border-success bg-success"
                      : "border-card-border hover:border-accent"
                  }`}
                >
                  {task.status === "DONE" && (
                    <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${task.status === "DONE" ? "text-muted line-through" : "text-foreground"}`}>
                      {task.title}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[task.status]}`}>
                      {statusLabels[task.status]}
                    </span>
                  </div>
                  {task.description && (
                    <p className="mt-0.5 truncate text-xs text-muted">{task.description}</p>
                  )}
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted">
                    <span className={priorityColors[task.priority]}>
                      {task.priority}
                    </span>
                    {task.dueDate && (
                      <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>
                    )}
                    {task.project && (
                      <span
                        className="rounded-full px-2 py-0.5"
                        style={{ backgroundColor: task.project.color + "20", color: task.project.color }}
                      >
                        {task.project.name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => { setEditingTask(task); setModalOpen(true); }}
                    className="rounded-lg p-1.5 text-muted hover:bg-foreground/5 hover:text-foreground"
                    title="Edit"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="rounded-lg p-1.5 text-muted hover:bg-danger/10 hover:text-danger"
                    title="Delete"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Projects sidebar */}
        <div className="space-y-4">
          <div className="rounded-xl border border-card-border bg-card-bg p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Projects</h3>
              <button
                onClick={() => setShowProjectForm(!showProjectForm)}
                className="text-xs font-medium text-accent hover:text-accent-hover"
              >
                {showProjectForm ? "Cancel" : "+ New"}
              </button>
            </div>

            {showProjectForm && (
              <form onSubmit={handleCreateProject} className="mb-3 space-y-2">
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Project name"
                  className="w-full rounded-lg border border-card-border bg-background px-3 py-1.5 text-sm text-foreground placeholder-muted focus:border-accent focus:outline-none"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={newProjectColor}
                    onChange={(e) => setNewProjectColor(e.target.value)}
                    className="h-8 w-8 cursor-pointer rounded border-0 bg-transparent"
                  />
                  <button
                    type="submit"
                    className="flex-1 rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-hover"
                  >
                    Create
                  </button>
                </div>
              </form>
            )}

            {projects.length === 0 ? (
              <p className="text-xs text-muted">No projects yet</p>
            ) : (
              <ul className="space-y-2">
                {projects.map((project) => (
                  <li key={project.id} className="flex items-center justify-between">
                    <button
                      onClick={() => setFilterProject(filterProject === project.id ? "ALL" : project.id)}
                      className={`flex items-center gap-2 text-sm ${filterProject === project.id ? "font-medium text-foreground" : "text-muted hover:text-foreground"}`}
                    >
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: project.color }} />
                      {project.name}
                      <span className="text-xs text-muted">({project._count.tasks})</span>
                    </button>
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className="rounded p-1 text-muted hover:text-danger"
                      title="Delete project"
                    >
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <TaskModal
          task={editingTask}
          projects={projects}
          onClose={() => { setModalOpen(false); setEditingTask(null); }}
          onSaved={() => { setModalOpen(false); setEditingTask(null); fetchData(); }}
        />
      )}
    </div>
  );
}
