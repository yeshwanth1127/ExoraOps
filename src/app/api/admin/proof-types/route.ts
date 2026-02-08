import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const bodySchema = z.object({ name: z.string().min(1).max(100) });

export async function POST(request: Request) {
  await requireAdmin();
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  }
  const maxOrder = await prisma.proofType.findFirst({ orderBy: { sortOrder: "desc" }, select: { sortOrder: true } });
  const proofType = await prisma.proofType.create({
    data: {
      name: parsed.data.name.trim(),
      sortOrder: (maxOrder?.sortOrder ?? -1) + 1,
      active: true,
    },
  });
  return NextResponse.json(proofType);
}
