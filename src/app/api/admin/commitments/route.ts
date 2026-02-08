import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getWeekStartForDate, toDateOnly } from "@/lib/week";

export async function GET(request: Request) {
  await requireAdmin();
  const { searchParams } = new URL(request.url);
  const weekStartParam = searchParams.get("weekStart");
  const weekStartDate = weekStartParam
    ? toDateOnly(new Date(weekStartParam))
    : await getWeekStartForDate(new Date());

  const commitments = await prisma.weeklyCommitment.findMany({
    where: { weekStartDate },
    include: { user: { select: { id: true, name: true, email: true, team: { select: { name: true } } } } },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ weekStartDate, commitments });
}
