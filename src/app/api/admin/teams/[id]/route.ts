import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const bodySchema = z.object({
  name: z.string().min(1).max(200),
  code: z.string().max(50).optional().nullable(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAdmin();
  const { id } = await params;
  const team = await prisma.team.findUnique({
    where: { id },
    include: { users: true },
  });
  if (!team) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(team);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAdmin();
  const { id } = await params;
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const team = await prisma.team.update({
    where: { id },
    data: {
      name: parsed.data.name.trim(),
      code: parsed.data.code?.trim() || null,
    },
  });
  return NextResponse.json(team);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAdmin();
  const { id } = await params;
  await prisma.team.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
