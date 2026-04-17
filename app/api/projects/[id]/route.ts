import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await db.project.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  // Unlink tasks from this project before deleting
  await db.task.updateMany({
    where: { projectId: id },
    data: { projectId: null },
  });

  await db.project.delete({ where: { id } });

  return Response.json({ data: { id } });
}
