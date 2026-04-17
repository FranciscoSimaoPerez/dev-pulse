import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projects = await db.project.findMany({
    where: { userId: session.user.id },
    include: { _count: { select: { tasks: true } } },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ data: projects });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, color } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return Response.json({ error: "Name is required" }, { status: 400 });
  }

  if (color && !/^#[0-9a-fA-F]{6}$/.test(color)) {
    return Response.json({ error: "Invalid color format" }, { status: 400 });
  }

  const project = await db.project.create({
    data: {
      name: name.trim(),
      color: color || "#6366f1",
      userId: session.user.id,
    },
    include: { _count: { select: { tasks: true } } },
  });

  return Response.json({ data: project }, { status: 201 });
}
