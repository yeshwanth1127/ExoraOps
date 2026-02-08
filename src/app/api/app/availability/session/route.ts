import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { todayInTimezone } from "@/lib/availability";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await requireSession();
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { timezone: true },
    });
    const tz = user?.timezone ?? "UTC";
    const today = todayInTimezone(tz);
    const sess = await prisma.availabilitySession.findUnique({
      where: { userId_date: { userId: session.id, date: today } },
      select: { id: true, startedAt: true, endedAt: true, lateStart: true, lastState: true },
    });
    return NextResponse.json(sess ?? null);
  } catch (err) {
    console.error("GET /api/app/availability/session", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Session error" },
      { status: 500 }
    );
  }
}
