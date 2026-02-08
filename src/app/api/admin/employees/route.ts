import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { z } from "zod";

const bodySchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(200),
  teamId: z.string().cuid().optional().nullable(),
  workModeId: z.string().cuid().optional().nullable(),
  password: z.string().min(6).optional(),
});

export async function GET() {
  await requireAdmin();
  const employees = await prisma.user.findMany({
    where: { role: "employee" },
    orderBy: { name: "asc" },
    select: {
      id: true,
      email: true,
      name: true,
      active: true,
      createdAt: true,
      teamId: true,
      workModeId: true,
      team: { select: { id: true, name: true } },
      workMode: { select: { id: true, name: true } },
    },
  });
  return NextResponse.json(employees);
}

export async function POST(request: Request) {
  await requireAdmin();
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const { email, name, teamId, workModeId, password } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 400 });
  }
  const passwordHash = await hashPassword(password ?? "changeme123");
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      name: name.trim(),
      passwordHash,
      role: "employee",
      teamId: teamId || null,
      workModeId: workModeId || null,
      active: true,
    },
    select: {
      id: true,
      email: true,
      name: true,
      active: true,
      teamId: true,
      workModeId: true,
      team: { select: { id: true, name: true } },
      workMode: { select: { id: true, name: true } },
    },
  });
  return NextResponse.json(user);
}
