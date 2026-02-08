import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const bodySchema = z.object({
  name: z.string().min(1).max(200),
  code: z.string().max(50).optional().nullable(),
});

export async function GET() {
  await requireAdmin();
  const teams = await prisma.team.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { users: true } } },
  });
  return NextResponse.json(teams);
}

export async function POST(request: Request) {
  await requireAdmin();
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const team = await prisma.team.create({
    data: {
      name: parsed.data.name.trim(),
      code: parsed.data.code?.trim() || null,
    },
  });
  return NextResponse.json(team);
}
