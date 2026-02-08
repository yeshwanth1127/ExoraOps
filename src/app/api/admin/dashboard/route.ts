import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getWeekStart, toDateOnly } from "@/lib/week";

export async function GET(request: Request) {
  await requireAdmin();
  const { searchParams } = new URL(request.url);
  const weeksParam = searchParams.get("weeks"); // e.g. 6
  const teamId = searchParams.get("teamId");
  const def = await prisma.weekDefinition.findFirst();
  const startWeekDay = def?.startWeekDay ?? 1;

  const weeks = Math.min(Math.max(parseInt(weeksParam || "6", 10) || 6, 1), 12);
  const today = new Date();
  const weekStarts: Date[] = [];
  for (let i = 0; i < weeks; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i * 7);
    weekStarts.push(toDateOnly(getWeekStart(d, startWeekDay)));
  }

  const userIds = teamId
    ? (await prisma.user.findMany({ where: { role: "employee", active: true, teamId }, select: { id: true } })).map((u) => u.id)
    : (await prisma.user.findMany({ where: { role: "employee", active: true }, select: { id: true } })).map((u) => u.id);

  const [users, commitments, reviews, logCounts] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true, team: { select: { id: true, name: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.weeklyCommitment.findMany({
      where: { userId: { in: userIds }, weekStartDate: { in: weekStarts } },
      select: { userId: true, weekStartDate: true },
    }),
    prisma.weeklyReview.findMany({
      where: { userId: { in: userIds }, weekStartDate: { in: weekStarts } },
      select: { userId: true, weekStartDate: true, commitmentAchieved: true },
    }),
    Promise.resolve([]),
  ]);

  const commitmentSet = new Set(commitments.map((c) => `${c.userId}:${c.weekStartDate.toISOString().slice(0, 10)}`));
  const reviewSet = new Set(reviews.map((r) => `${r.userId}:${r.weekStartDate.toISOString().slice(0, 10)}`));
  const reviewAchieved = new Set(reviews.filter((r) => r.commitmentAchieved).map((r) => `${r.userId}:${r.weekStartDate.toISOString().slice(0, 10)}`));

  const rangeStart = weekStarts[weekStarts.length - 1];
  const rangeEnd = new Date(weekStarts[0]);
  rangeEnd.setDate(rangeEnd.getDate() + 6);
  const logs = await prisma.workLog.findMany({
    where: {
      userId: { in: userIds },
      date: { gte: rangeStart, lte: rangeEnd },
    },
    select: { userId: true, date: true },
  });
  const logsByUserWeek = new Map<string, number>();
  for (const log of logs) {
    const ws = getWeekStart(log.date, startWeekDay);
    const key = `${log.userId}:${toDateOnly(ws).toISOString().slice(0, 10)}`;
    logsByUserWeek.set(key, (logsByUserWeek.get(key) ?? 0) + 1);
  }

  const personLevel = users.map((u) => {
    const byWeek = weekStarts.map((ws) => {
      const key = `${u.id}:${ws.toISOString().slice(0, 10)}`;
      const hasCommitment = commitmentSet.has(key);
      const hasReview = reviewSet.has(key);
      const achieved = reviewAchieved.has(key);
      const logCount = logsByUserWeek.get(key) ?? 0;
      return { weekStart: ws.toISOString().slice(0, 10), hasCommitment, hasReview, achieved, logCount };
    });
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      team: u.team,
      byWeek,
      summary: {
        weeksWithCommitment: byWeek.filter((w) => w.hasCommitment).length,
        weeksWithReview: byWeek.filter((w) => w.hasReview).length,
        weeksAchieved: byWeek.filter((w) => w.achieved).length,
        totalLogs: byWeek.reduce((s, w) => s + w.logCount, 0),
      },
    };
  });

  const teams = await prisma.team.findMany({
    where: teamId ? { id: teamId } : undefined,
    include: { _count: { select: { users: true } } },
    orderBy: { name: "asc" },
  });

  const teamLevel = teams.map((t) => {
    const memberIds = personLevel.filter((p) => p.team?.id === t.id).map((p) => p.id);
    const members = personLevel.filter((p) => p.team?.id === t.id);
    const totalLogs = members.reduce((s, m) => s + m.summary.totalLogs, 0);
    const totalCommitments = members.reduce((s, m) => s + m.summary.weeksWithCommitment, 0);
    const totalAchieved = members.reduce((s, m) => s + m.summary.weeksAchieved, 0);
    return {
      id: t.id,
      name: t.name,
      memberCount: memberIds.length,
      totalLogs,
      totalCommitments,
      totalAchieved,
      weeks: weekStarts.length,
    };
  });

  return NextResponse.json({
    weekStarts: weekStarts.map((d) => d.toISOString().slice(0, 10)),
    personLevel,
    teamLevel,
  });
}
