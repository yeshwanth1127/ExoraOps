import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Tasks where I'm assigned (whole task) or I have subtasks assigned to me
export async function GET() {
  const session = await requireSession();
  const userId = session.id;

  const tasks = await prisma.task.findMany({
    where: {
      OR: [
        { assignments: { some: { userId } } },
        { subtasks: { some: { assignedToUserId: userId } } },
      ],
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: {
      milestone: { select: { id: true, name: true, dueDate: true } },
      subtasks: { orderBy: { sortOrder: "asc" }, include: { assignedTo: { select: { id: true, name: true } } } },
      assignments: { include: { user: { select: { id: true, name: true } } } },
    },
  });
  return NextResponse.json(tasks);
}
