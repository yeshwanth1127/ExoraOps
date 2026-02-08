import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getCurrentAvailabilityState, todayInTimezone } from "@/lib/availability";
import { z } from "zod";

export async function GET(request: Request) {
  await requireAdmin();
  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get("teamId") ?? undefined;
  const where = { role: "employee" as const, active: true };
  if (teamId) (where as { teamId?: string }).teamId = teamId;
  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      teamId: true,
      team: { select: { id: true, name: true } },
      lastSeenAt: true,
      workStartTime: true,
      workEndTime: true,
      timezone: true,
    },
  });
  const withState = await Promise.all(
    users.map(async (u) => {
      const { state, sessionId } = await getCurrentAvailabilityState(u.id);
      const tz = u.timezone || "UTC";
      const today = todayInTimezone(tz);
      const session = await prisma.availabilitySession.findUnique({
        where: { userId_date: { userId: u.id, date: today } },
        select: { startedAt: true, endedAt: true },
      });
      return {
        ...u,
        availabilityState: state,
        sessionId,
        lastSeenAt: u.lastSeenAt?.toISOString() ?? null,
        workStartTime: u.workStartTime ?? null,
        workEndTime: u.workEndTime ?? null,
        timezone: u.timezone ?? null,
        sessionStartedAt: session?.startedAt?.toISOString() ?? null,
        sessionEndedAt: session?.endedAt?.toISOString() ?? null,
      };
    })
  );
  return NextResponse.json(withState);
}
