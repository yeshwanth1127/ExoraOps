import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getWeekStartForDate, toDateOnly } from "@/lib/week";
import { z } from "zod";

const bodySchema = z.object({
  successStatement: z.string().min(1).max(500),
  weekStartDate: z.string().optional(), // ISO date; if omitted, use current week
});

export async function GET(request: Request) {
  const session = await requireSession();
  const { searchParams } = new URL(request.url);
  const weekStart = searchParams.get("weekStart"); // admin can pass week
  let weekStartDate: Date;
  if (weekStart) {
    weekStartDate = toDateOnly(new Date(weekStart));
  } else {
    weekStartDate = await getWeekStartForDate(new Date());
  }
  const commitment = await prisma.weeklyCommitment.findUnique({
    where: {
      userId_weekStartDate: {
        userId: session.id,
        weekStartDate,
      },
    },
  });
  return NextResponse.json(commitment ?? null);
}

export async function POST(request: Request) {
  const session = await requireSession();
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const weekStartDate = parsed.data.weekStartDate
    ? toDateOnly(new Date(parsed.data.weekStartDate))
    : await getWeekStartForDate(new Date());

  await prisma.weeklyCommitment.upsert({
    where: {
      userId_weekStartDate: { userId: session.id, weekStartDate },
    },
    update: { successStatement: parsed.data.successStatement.trim() },
    create: {
      userId: session.id,
      weekStartDate,
      successStatement: parsed.data.successStatement.trim(),
    },
  });
  return NextResponse.json({ ok: true });
}
