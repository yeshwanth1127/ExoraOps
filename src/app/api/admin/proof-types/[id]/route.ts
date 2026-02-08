import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const bodySchema = z.object({ active: z.boolean() });

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAdmin();
  const { id } = await params;
  const parsed = bodySchema.safeParse(await _request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  await prisma.proofType.update({
    where: { id },
    data: { active: parsed.data.active },
  });
  return NextResponse.json({ ok: true });
}
