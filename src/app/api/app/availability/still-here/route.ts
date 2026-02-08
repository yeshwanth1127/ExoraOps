import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { recordWeakActivity } from "@/lib/availability";

export async function POST() {
  const session = await requireSession();
  const recorded = await recordWeakActivity(session.id);
  if (!recorded) {
    return NextResponse.json(
      { error: "Throttled", ok: false },
      { status: 429 }
    );
  }
  return NextResponse.json({ ok: true });
}
