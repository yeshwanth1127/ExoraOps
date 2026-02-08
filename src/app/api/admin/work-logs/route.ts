import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  await requireAdmin();
  const { searchParams } = new URL(request.url);
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const teamId = searchParams.get("teamId");
  const userId = searchParams.get("userId");

  const where: { userId?: string; date?: { gte?: Date; lte?: Date }; user?: { teamId: string } } = {};
  if (userId) where.userId = userId;
  if (teamId) where.user = { teamId };
  if (fromParam || toParam) {
    where.date = {};
    if (fromParam) where.date.gte = new Date(fromParam);
    if (toParam) where.date.lte = new Date(toParam);
  }

  const logs = await prisma.workLog.findMany({
    where,
    orderBy: { date: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true, team: { select: { name: true } } } },
      workType: { select: { id: true, name: true } },
      proofItems: { include: { proofType: { select: { id: true, name: true } } } },
    },
  });
  return NextResponse.json(logs);
}
