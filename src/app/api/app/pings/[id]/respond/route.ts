import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession();
  const { id } = await params;
  const ping = await prisma.ping.findUnique({
    where: { id },
    select: { id: true, targetUserId: true, respondedAt: true },
  });
  if (!ping || ping.targetUserId !== session.id) {
    return NextResponse.json({ error: "Ping not found" }, { status: 404 });
  }
  if (ping.respondedAt) {
    return NextResponse.json({ ok: true, alreadyResponded: true });
  }
  await prisma.ping.update({
    where: { id },
    data: { respondedAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
