import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const bodySchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(2000).optional().nullable(),
  assignedToUserId: z.string().cuid().optional().nullable(),
  sortOrder: z.number().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAdmin();
  const { id: taskId } = await params;
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const maxOrder = await prisma.subtask.findFirst({
    where: { taskId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  const subtask = await prisma.subtask.create({
    data: {
      taskId,
      title: parsed.data.title.trim(),
      description: parsed.data.description?.trim() || null,
      assignedToUserId: parsed.data.assignedToUserId || null,
      sortOrder: parsed.data.sortOrder ?? (maxOrder ? maxOrder.sortOrder + 1 : 0),
    },
    include: { assignedTo: { select: { id: true, name: true, email: true } } },
  });
  return NextResponse.json(subtask);
}
