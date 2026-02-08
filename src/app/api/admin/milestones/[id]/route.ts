import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const bodySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  dueDate: z.string().optional().nullable(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAdmin();
  const { id } = await params;
  const milestone = await prisma.milestone.findUnique({
    where: { id },
    include: { tasks: { orderBy: { sortOrder: "asc" }, include: { subtasks: { orderBy: { sortOrder: "asc" } }, assignments: { include: { user: { select: { id: true, name: true, email: true } } } } } } },
  });
  if (!milestone) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(milestone);
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
  const milestone = await prisma.milestone.update({
    where: { id },
    data: {
      ...(parsed.data.name !== undefined && { name: parsed.data.name.trim() }),
      ...(parsed.data.description !== undefined && { description: parsed.data.description?.trim() || null }),
      ...(parsed.data.dueDate !== undefined && { dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null }),
    },
  });
  return NextResponse.json(milestone);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAdmin();
  const { id } = await params;
  await prisma.milestone.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
