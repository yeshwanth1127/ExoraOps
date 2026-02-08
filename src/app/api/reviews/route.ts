import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getWeekStartForDate, toDateOnly } from "@/lib/week";
import { z } from "zod";

const bodySchema = z.object({
  commitmentAchieved: z.boolean(),
  reasonIfNo: z.string().max(500).optional().nullable(),
  weekStartDate: z.string().optional(),
});

export async function GET(request: Request) {
  const session = await requireSession();
  const { searchParams } = new URL(request.url);
  const weekStart = searchParams.get("weekStart");
  const weekStartDate = weekStart
    ? toDateOnly(new Date(weekStart))
    : await getWeekStartForDate(new Date());

  const review = await prisma.weeklyReview.findUnique({
    where: {
      userId_weekStartDate: { userId: session.id, weekStartDate },
    },
  });
  return NextResponse.json(review ?? null);
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

  await prisma.weeklyReview.upsert({
    where: {
      userId_weekStartDate: { userId: session.id, weekStartDate },
    },
    update: {
      commitmentAchieved: parsed.data.commitmentAchieved,
      reasonIfNo: parsed.data.commitmentAchieved ? null : (parsed.data.reasonIfNo?.trim() || null),
    },
    create: {
      userId: session.id,
      weekStartDate,
      commitmentAchieved: parsed.data.commitmentAchieved,
      reasonIfNo: parsed.data.commitmentAchieved ? null : (parsed.data.reasonIfNo?.trim() || null),
    },
  });
  return NextResponse.json({ ok: true });
}
