import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getCurrentAvailabilityState, isInsideWorkWindow } from "@/lib/availability";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await requireSession();
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      workStartTime: true,
      workEndTime: true,
      timezone: true,
      lastSeenAt: true,
    },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  const { state, sessionId, lastSeenAt } = await getCurrentAvailabilityState(session.id);
  const insideWorkWindow = isInsideWorkWindow({
    id: session.id,
    workStartTime: user.workStartTime,
    workEndTime: user.workEndTime,
    timezone: user.timezone,
    availabilityReliabilityScore: 1,
  });
  return NextResponse.json({
    state,
    sessionId,
    lastSeenAt: lastSeenAt?.toISOString() ?? null,
    insideWorkWindow,
  });
}
