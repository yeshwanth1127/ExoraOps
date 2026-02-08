import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  isInsideWorkWindow,
  getDynamicWindowMinutes,
  isLateStart,
  todayInTimezone,
  type UserWithWorkWindow,
} from "@/lib/availability";
import { notifyAvailabilityChange } from "@/lib/availability-notifier";

export async function POST() {
  const session = await requireSession();
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      workStartTime: true,
      workEndTime: true,
      timezone: true,
      availabilityReliabilityScore: true,
    },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  const u = user as UserWithWorkWindow;
  if (!isInsideWorkWindow(u)) {
    return NextResponse.json(
      { error: "Outside work window", insideWorkWindow: false },
      { status: 400 }
    );
  }
  const tz = user.timezone || "UTC";
  const today = todayInTimezone(tz);
  const existing = await prisma.availabilitySession.findUnique({
    where: { userId_date: { userId: session.id, date: today } },
  });
  if (existing) {
    const { getCurrentAvailabilityState } = await import("@/lib/availability");
    const { state, sessionId, lastSeenAt } = await getCurrentAvailabilityState(session.id);
    return NextResponse.json({
      state: state ?? "available",
      sessionId,
      lateStart: existing.lateStart,
      startedAt: existing.startedAt,
      lastSeenAt,
    });
  }
  const now = new Date();
  const lateStart = isLateStart(u, now);
  const windowMinutes = getDynamicWindowMinutes(user.availabilityReliabilityScore);
  const endsAt = new Date(now.getTime() + windowMinutes * 60 * 1000);
  const created = await prisma.$transaction(async (tx) => {
    const sess = await tx.availabilitySession.create({
      data: {
        userId: session.id,
        date: today,
        lateStart,
        lastState: "available",
        lastStateAt: now,
      },
    });
    await tx.availabilityEvent.create({
      data: { userId: session.id, sessionId: sess.id, type: "start_work" },
    });
    await tx.availabilityWindow.create({
      data: { sessionId: sess.id, startsAt: now, endsAt },
    });
    return sess;
  });
  notifyAvailabilityChange();
  const { getCurrentAvailabilityState } = await import("@/lib/availability");
  const { lastSeenAt } = await getCurrentAvailabilityState(session.id);
  return NextResponse.json({
    state: "available",
    sessionId: created.id,
    lateStart: created.lateStart,
    startedAt: created.startedAt,
    lastSeenAt,
  });
}
