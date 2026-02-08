import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const bodySchema = z.object({
  milestoneId: z.string().cuid().optional().nullable(),
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(2000).optional().nullable(),
  dueDate: z.string().optional().nullable(),
  sortOrder: z.number().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAdmin();
  const { id } = await params;
  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      milestone: { select: { id: true, name: true } },
      subtasks: { orderBy: { sortOrder: "asc" }, include: { assignedTo: { select: { id: true, name: true, email: true } } } },
      assignments: { include: { user: { select: { id: true, name: true, email: true } } } },
    },
  });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(task);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAdmin();
  const { id } = await params;
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const task = await prisma.task.update({
    where: { id },
    data: {
      ...(parsed.data.milestoneId !== undefined && { milestoneId: parsed.data.milestoneId || null }),
      ...(parsed.data.title !== undefined && { title: parsed.data.title.trim() }),
      ...(parsed.data.description !== undefined && { description: parsed.data.description?.trim() || null }),
      ...(parsed.data.dueDate !== undefined && { dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null }),
      ...(parsed.data.sortOrder !== undefined && { sortOrder: parsed.data.sortOrder }),
    },
    include: {
      milestone: { select: { id: true, name: true } },
      subtasks: { orderBy: { sortOrder: "asc" }, include: { assignedTo: { select: { id: true, name: true, email: true } } } },
      assignments: { include: { user: { select: { id: true, name: true, email: true } } } },
    },
  });
  return NextResponse.json(task);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAdmin();
  const { id } = await params;
  await prisma.task.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
