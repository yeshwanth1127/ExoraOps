import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";
import { z } from "zod";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse( await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 400 });
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: { workMode: true },
  });

  if (!user || !user.active) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  await createSession({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  const redirectTo = user.role === "admin" ? "/admin" : "/app";
  return NextResponse.json({ redirectTo });
}
