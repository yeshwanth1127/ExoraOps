import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const bodySchema = z.object({
  milestoneId: z.string().cuid().optional().nullable(),
  title: z.string().min(1).max(500),
  description: z.string().max(2000).optional().nullable(),
  dueDate: z.string().optional().nullable(),
});

export async function GET(request: Request) {
  await requireAdmin();
  const { searchParams } = new URL(request.url);
  const milestoneId = searchParams.get("milestoneId");
  const tasks = await prisma.task.findMany({
    where: milestoneId ? { milestoneId } : undefined,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: {
      milestone: { select: { id: true, name: true } },
      subtasks: { orderBy: { sortOrder: "asc" }, include: { assignedTo: { select: { id: true, name: true, email: true } } } },
      assignments: { include: { user: { select: { id: true, name: true, email: true } } } },
    },
  });
  return NextResponse.json(tasks);
}

export async function POST(request: Request) {
  await requireAdmin();
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const task = await prisma.task.create({
    data: {
      milestoneId: parsed.data.milestoneId || null,
      title: parsed.data.title.trim(),
      description: parsed.data.description?.trim() || null,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
    },
    include: {
      milestone: { select: { id: true, name: true } },
      subtasks: true,
      assignments: true,
    },
  });
  return NextResponse.json(task);
}
