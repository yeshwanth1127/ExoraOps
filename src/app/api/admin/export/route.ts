import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getWeekStart, toDateOnly } from "@/lib/week";

export async function GET(request: Request) {
  await requireAdmin();
  const { searchParams } = new URL(request.url);
  const weeks = Math.min(Math.max(parseInt(searchParams.get("weeks") || "6", 10) || 6, 1), 12);
  const teamId = searchParams.get("teamId") || undefined;

  const def = await prisma.weekDefinition.findFirst();
  const startWeekDay = def?.startWeekDay ?? 1;
  const today = new Date();
  const weekStarts: Date[] = [];
  for (let i = 0; i < weeks; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i * 7);
    weekStarts.push(toDateOnly(getWeekStart(d, startWeekDay)));
  }

  const users = await prisma.user.findMany({
    where: { role: "employee", active: true, ...(teamId && { teamId }) },
    select: { id: true, name: true, email: true, team: { select: { name: true } } },
    orderBy: { name: "asc" },
  });
  const userIds = users.map((u) => u.id);

  const [commitments, reviews, logs] = await Promise.all([
    prisma.weeklyCommitment.findMany({
      where: { userId: { in: userIds }, weekStartDate: { in: weekStarts } },
      include: { user: { select: { id: true, name: true, email: true, team: { select: { name: true } } } } },
    }),
    prisma.weeklyReview.findMany({
      where: { userId: { in: userIds }, weekStartDate: { in: weekStarts } },
      include: { user: { select: { id: true, name: true, email: true, team: { select: { name: true } } } } },
    }),
    prisma.workLog.findMany({
      where: { userId: { in: userIds } },
      include: { user: { select: { id: true, name: true, email: true, team: { select: { name: true } } } }, workType: { select: { name: true } } },
    }),
  ]);

  const escape = (s: string) => {
    const t = String(s ?? "").replace(/"/g, '""');
    return t.includes(",") || t.includes('"') || t.includes("\n") ? `"${t}"` : t;
  };

  const rows: string[] = [];
  rows.push("Type,WeekStart,User,Team,Detail");
  for (const c of commitments) {
    rows.push(`Commitment,${c.weekStartDate.toISOString().slice(0, 10)},${escape(c.user.name)},${escape(c.user.team?.name ?? "")},${escape(c.successStatement)}`);
  }
  for (const r of reviews) {
    rows.push(`Review,${r.weekStartDate.toISOString().slice(0, 10)},${escape(r.user.name)},${escape(r.user.team?.name ?? "")},${r.commitmentAchieved ? "Achieved" : "Not achieved"}${r.reasonIfNo ? " - " + escape(r.reasonIfNo) : ""}`);
  }
  for (const log of logs) {
    const weekStart = toDateOnly(getWeekStart(log.date, startWeekDay));
    const weekStr = weekStart.toISOString().slice(0, 10);
    if (!weekStarts.some((ws) => ws.toISOString().slice(0, 10) === weekStr)) continue;
    rows.push(`WorkLog,${weekStr},${escape(log.user.name)},${escape(log.user.team?.name ?? "")},${escape(log.workType.name)}: ${escape(log.description.slice(0, 200))}`);
  }

  const csv = rows.join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="exora-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
