import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const bodySchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(2000).optional().nullable(),
  assignedToUserId: z.string().cuid().optional().nullable(),
  status: z.enum(["pending", "in_progress", "done"]).optional(),
  sortOrder: z.number().optional(),
});

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
  const data: { title?: string; description?: string | null; assignedToUserId?: string | null; status?: "pending" | "in_progress" | "done"; sortOrder?: number; completedAt?: Date | null } = {};
  if (parsed.data.title !== undefined) data.title = parsed.data.title.trim();
  if (parsed.data.description !== undefined) data.description = parsed.data.description?.trim() || null;
  if (parsed.data.assignedToUserId !== undefined) data.assignedToUserId = parsed.data.assignedToUserId || null;
  if (parsed.data.status !== undefined) {
    data.status = parsed.data.status;
    if (parsed.data.status === "done") data.completedAt = new Date();
    else data.completedAt = null;
  }
  if (parsed.data.sortOrder !== undefined) data.sortOrder = parsed.data.sortOrder;
  const subtask = await prisma.subtask.update({
    where: { id },
    data,
    include: { assignedTo: { select: { id: true, name: true, email: true } } },
  });
  return NextResponse.json(subtask);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAdmin();
  const { id } = await params;
  await prisma.subtask.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
