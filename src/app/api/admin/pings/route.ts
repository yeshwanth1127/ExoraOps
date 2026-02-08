import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSlaMinutes } from "@/lib/availability";
import { notifyPingSent } from "@/lib/ping-notifier";
import { z } from "zod";

const postSchema = z.object({ targetUserId: z.string().cuid() });

export async function GET(request: Request) {
  await requireAdmin();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status"); // "open" | "responded" | omit = all
  const where: { respondedAt: Date | null } | Record<string, never> = {};
  if (status === "open") where.respondedAt = null;
  if (status === "responded") (where as { respondedAt: { not: null } }).respondedAt = { not: null };
  const pings = await prisma.ping.findMany({
    where: Object.keys(where).length ? where : undefined,
    orderBy: { sentAt: "desc" },
    take: 100,
    include: {
      fromUser: { select: { id: true, name: true } },
      targetUser: { select: { id: true, name: true, email: true } },
    },
  });
  return NextResponse.json(pings);
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  const parsed = postSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const target = await prisma.user.findUnique({
    where: { id: parsed.data.targetUserId, role: "employee" },
    select: { id: true, availabilityReliabilityScore: true },
  });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
  const slaMinutes = getSlaMinutes(target.availabilityReliabilityScore);
  const ping = await prisma.ping.create({
    data: {
      fromUserId: session.id,
      targetUserId: target.id,
      slaMinutes,
    },
    include: {
      fromUser: { select: { id: true, name: true } },
      targetUser: { select: { id: true, name: true, email: true } },
    },
  });
  notifyPingSent(target.id);
  return NextResponse.json(ping);
}
