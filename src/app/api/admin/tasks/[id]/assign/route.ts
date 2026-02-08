import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const bodySchema = z.object({ userId: z.string().cuid() });

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
  await prisma.taskAssignment.upsert({
    where: { taskId_userId: { taskId, userId: parsed.data.userId } },
    update: {},
    create: { taskId, userId: parsed.data.userId },
  });
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { assignments: { include: { user: { select: { id: true, name: true, email: true } } } } },
  });
  return NextResponse.json(task);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAdmin();
  const { id: taskId } = await params;
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }
  await prisma.taskAssignment.deleteMany({
    where: { taskId, userId },
  });
  return NextResponse.json({ ok: true });
}
