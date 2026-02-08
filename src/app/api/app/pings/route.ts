import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await requireSession();
  const pings = await prisma.ping.findMany({
    where: { targetUserId: session.id, respondedAt: null },
    orderBy: { sentAt: "desc" },
    select: {
      id: true,
      sentAt: true,
      fromUser: { select: { name: true } },
    },
  });
  return NextResponse.json(pings);
}
