import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const bodySchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  dueDate: z.string().optional().nullable(),
});

export async function GET() {
  await requireAdmin();
  const milestones = await prisma.milestone.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { tasks: true } } },
  });
  return NextResponse.json(milestones);
}

export async function POST(request: Request) {
  await requireAdmin();
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const milestone = await prisma.milestone.create({
    data: {
      name: parsed.data.name.trim(),
      description: parsed.data.description?.trim() || null,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
    },
  });
  return NextResponse.json(milestone);
}
