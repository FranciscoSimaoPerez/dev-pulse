import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await db.task.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    return Response.json({ error: "Task not found" }, { status: 404 });
  }

  const body = await request.json();
  const { title, description, status, priority, dueDate, projectId } = body;

  const validStatuses = ["TODO", "IN_PROGRESS", "DONE"];
  const validPriorities = ["LOW", "MEDIUM", "HIGH"];

  if (title !== undefined && (typeof title !== "string" || title.trim().length === 0)) {
    return Response.json({ error: "Title cannot be empty" }, { status: 400 });
  }

  if (status !== undefined && !validStatuses.includes(status)) {
    return Response.json({ error: "Invalid status" }, { status: 400 });
  }

  if (priority !== undefined && !validPriorities.includes(priority)) {
    return Response.json({ error: "Invalid priority" }, { status: 400 });
  }

  if (projectId !== undefined && projectId !== null) {
    const project = await db.project.findFirst({
      where: { id: projectId, userId: session.user.id },
    });
    if (!project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }
  }

  const task = await db.task.update({
    where: { id },
    data: {
      ...(title !== undefined && { title: title.trim() }),
      ...(description !== undefined && { description: description?.trim() || null }),
      ...(status !== undefined && { status }),
      ...(priority !== undefined && { priority }),
      ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      ...(projectId !== undefined && { projectId: projectId || null }),
    },
    include: { project: true },
  });

  return Response.json({ data: task });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await db.task.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    return Response.json({ error: "Task not found" }, { status: 404 });
  }

  await db.task.delete({ where: { id } });

  return Response.json({ data: { id } });
}
