import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST() {
  const session = await requireSession();
  await prisma.user.update({
    where: { id: session.id },
    data: { lastSeenAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
