import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { recordStrongActivity } from "@/lib/availability";
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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession();
  const { id } = await params;
  const log = await prisma.workLog.findFirst({
    where: { id, userId: session.id },
    include: {
      workType: true,
      proofItems: { include: { proofType: true } },
    },
  });
  if (!log) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(log);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession();
  const { id } = await params;
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body. At least one proof item required." }, { status: 400 });
  }
  const existing = await prisma.workLog.findFirst({ where: { id, userId: session.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { date, workTypeId, description, proofItems } = parsed.data;
  const dateOnly = new Date(date);
  dateOnly.setHours(0, 0, 0, 0);

  await prisma.proofItem.deleteMany({ where: { workLogId: id } });
  const log = await prisma.workLog.update({
    where: { id },
    data: {
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
  await recordStrongActivity(session.id).catch(() => {});
  return NextResponse.json(log);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession();
  const { id } = await params;
  const existing = await prisma.workLog.findFirst({ where: { id, userId: session.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.workLog.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
