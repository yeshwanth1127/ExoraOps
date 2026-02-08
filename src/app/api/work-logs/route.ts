import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const proofItemSchema = z.object({
  proofTypeId: z.string().cuid(),
  url: z.string().min(1).max(2000),
  caption: z.string().max(500).optional().nullable(),
});

const bodySchema = z.object({
  date: z.string(),
  workTypeId: z.string().cuid(),
  description: z.string().min(1).max(2000),
  proofItems: z.array(proofItemSchema).min(1),
});

export async function GET(request: Request) {
  const session = await requireSession();
  const { searchParams } = new URL(request.url);
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const from = fromParam ? new Date(fromParam) : undefined;
  const to = toParam ? new Date(toParam) : undefined;

  const where: { userId: string; date?: { gte?: Date; lte?: Date } } = { userId: session.id };
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = from;
    if (to) where.date.lte = to;
  }

  const logs = await prisma.workLog.findMany({
    where,
    orderBy: { date: "desc" },
    include: {
      workType: { select: { id: true, name: true } },
      proofItems: { include: { proofType: { select: { id: true, name: true } } } },
    },
  });
  return NextResponse.json(logs);
}

export async function POST(request: Request) {
  const session = await requireSession();
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body. At least one proof item required." }, { status: 400 });
  }
  const { date, workTypeId, description, proofItems } = parsed.data;
  const dateOnly = new Date(date);
  dateOnly.setHours(0, 0, 0, 0);

  const workType = await prisma.workMode.findUnique({ where: { id: workTypeId } });
  if (!workType?.active) {
    return NextResponse.json({ error: "Invalid work type" }, { status: 400 });
  }

  const log = await prisma.workLog.create({
    data: {
      userId: session.id,
      date: dateOnly,
      workTypeId,
      description: description.trim(),
      proofItems: {
        create: proofItems.map((p) => ({
          proofTypeId: p.proofTypeId,
          url: p.url,
          caption: p.caption?.trim() || null,
        })),
      },
    },
    include: {
      workType: { select: { id: true, name: true } },
      proofItems: { include: { proofType: { select: { id: true, name: true } } } },
    },
  });
  return NextResponse.json(log);
}
