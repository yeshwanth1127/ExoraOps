import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { todayInTimezone } from "@/lib/availability";
import { notifyAvailabilityChange } from "@/lib/availability-notifier";
import { prisma } from "@/lib/db";

export async function POST() {
  const session = await requireSession();
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { timezone: true },
  });
  const tz = user?.timezone || "UTC";
  const today = todayInTimezone(tz);
  const existing = await prisma.availabilitySession.findUnique({
    where: { userId_date: { userId: session.id, date: today } },
  });
  if (!existing) {
    return NextResponse.json({ error: "No active session" }, { status: 400 });
  }
  if (existing.endedAt) {
    return NextResponse.json({ ok: true, endedAt: existing.endedAt });
  }
  const now = new Date();
  await prisma.availabilitySession.update({
    where: { id: existing.id },
    data: { endedAt: now },
  });
  notifyAvailabilityChange();
  return NextResponse.json({ ok: true, endedAt: now.toISOString() });
}
