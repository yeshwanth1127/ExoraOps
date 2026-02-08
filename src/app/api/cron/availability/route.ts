import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const CRON_SECRET = process.env.CRON_SECRET || "dev-cron-secret";

/** Expire availability windows (Available -> Soft-Away), run decay (Soft-Away -> Away), mark missed pings, update reliability. */
export async function POST(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const now = new Date();
  const softAwayMaxMinutes = 25;

  // 1) Sessions with a window that has ended and still available -> soft_away
  const sessionsWithExpiredWindow = await prisma.availabilitySession.findMany({
    where: { lastState: "available" },
    include: { windows: { orderBy: { endsAt: "desc" }, take: 1 } },
  });
  for (const sess of sessionsWithExpiredWindow) {
    const latest = sess.windows[0];
    if (latest && latest.endsAt < now) {
      await prisma.availabilitySession.update({
        where: { id: sess.id },
        data: { lastState: "soft_away", lastStateAt: now },
      });
      await prisma.availabilityEvent.create({
        data: {
          userId: sess.userId,
          sessionId: sess.id,
          type: "state_change",
        },
      });
    }
  }

  // 2) Sessions in soft_away for > softAwayMaxMinutes -> away
  const softAwayCutoff = new Date(now.getTime() - softAwayMaxMinutes * 60 * 1000);
  await prisma.availabilitySession.updateMany({
    where: { lastState: "soft_away", lastStateAt: { lt: softAwayCutoff } },
    data: { lastState: "away", lastStateAt: now },
  });

  // 3) Missed pings: open pings past SLA -> set missedAt and decrease target user reliability
  const openPings = await prisma.ping.findMany({
    where: { respondedAt: null, missedAt: null },
    select: { id: true, targetUserId: true, sentAt: true, slaMinutes: true },
  });
  for (const ping of openPings) {
    const deadline = new Date(ping.sentAt.getTime() + ping.slaMinutes * 60 * 1000);
    if (now <= deadline) continue;
    const user = await prisma.user.findUnique({
      where: { id: ping.targetUserId },
      select: { availabilityReliabilityScore: true },
    });
    if (!user) continue;
    const newScore = Math.max(0, Math.min(1, user.availabilityReliabilityScore - 0.05));
    await prisma.ping.update({
      where: { id: ping.id },
      data: { missedAt: now },
    });
    await prisma.user.update({
      where: { id: ping.targetUserId },
      data: { availabilityReliabilityScore: newScore, lastReliabilityAt: now },
    });
  }

  return NextResponse.json({ ok: true });
}
