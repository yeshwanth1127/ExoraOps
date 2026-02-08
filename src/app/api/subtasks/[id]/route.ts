import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const bodySchema = z.object({
  status: z.enum(["pending", "in_progress", "done"]),
});

// Employee can update status if they're assigned to the task or to this subtask
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession();
  const { id } = await params;
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const subtask = await prisma.subtask.findUnique({
    where: { id },
    include: { task: { include: { assignments: true } } },
  });
  if (!subtask) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const canEdit =
    subtask.assignedToUserId === session.id ||
    subtask.task.assignments.some((a) => a.userId === session.id);
  if (!canEdit) {
    return NextResponse.json({ error: "Not assigned to this task or subtask" }, { status: 403 });
  }

  const data: { status: "pending" | "in_progress" | "done"; completedAt?: Date | null } = {
    status: parsed.data.status,
  };
  if (parsed.data.status === "done") data.completedAt = new Date();
  else data.completedAt = null;

  const updated = await prisma.subtask.update({
    where: { id },
    data,
    include: { assignedTo: { select: { id: true, name: true } } },
  });
  return NextResponse.json(updated);
}
