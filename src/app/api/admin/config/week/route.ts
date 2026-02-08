import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const bodySchema = z.object({
  startWeekDay: z.number().min(0).max(6),
  commitmentDueDay: z.number().min(0).max(6),
  reviewDueDay: z.number().min(0).max(6),
});

export async function POST(request: Request) {
  await requireAdmin();
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const { startWeekDay, commitmentDueDay, reviewDueDay } = parsed.data;

  const existing = await prisma.weekDefinition.findFirst();
  if (existing) {
    await prisma.weekDefinition.update({
      where: { id: existing.id },
      data: { startWeekDay, commitmentDueDay, reviewDueDay },
    });
  } else {
    await prisma.weekDefinition.create({
      data: { startWeekDay, commitmentDueDay, reviewDueDay },
    });
  }
  return NextResponse.json({ ok: true });
}
