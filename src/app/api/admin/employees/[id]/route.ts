import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { z } from "zod";

const bodySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  teamId: z.string().cuid().nullable().optional(),
  workModeId: z.string().cuid().nullable().optional(),
  active: z.boolean().optional(),
  password: z.string().min(6).optional(),
  workStartTime: z.string().max(10).nullable().optional(),
  workEndTime: z.string().max(10).nullable().optional(),
  timezone: z.string().max(80).nullable().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAdmin();
  const { id } = await params;
  const user = await prisma.user.findFirst({
    where: { id, role: "employee" },
    include: { team: true, workMode: true },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { passwordHash: _, ...rest } = user;
  return NextResponse.json(rest);
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
  const data: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) data.name = parsed.data.name.trim();
  if (parsed.data.teamId !== undefined) data.teamId = parsed.data.teamId;
  if (parsed.data.workModeId !== undefined) data.workModeId = parsed.data.workModeId;
  if (parsed.data.active !== undefined) data.active = parsed.data.active;
  if (parsed.data.password !== undefined) data.passwordHash = await hashPassword(parsed.data.password);
  if (parsed.data.workStartTime !== undefined) data.workStartTime = parsed.data.workStartTime;
  if (parsed.data.workEndTime !== undefined) data.workEndTime = parsed.data.workEndTime;
  if (parsed.data.timezone !== undefined) data.timezone = parsed.data.timezone;
  const user = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      active: true,
      teamId: true,
      workModeId: true,
      workStartTime: true,
      workEndTime: true,
      timezone: true,
      team: { select: { id: true, name: true } },
      workMode: { select: { id: true, name: true } },
    },
  });
  return NextResponse.json(user);
}
