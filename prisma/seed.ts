import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminHash = await bcrypt.hash(
    process.env.ADMIN_PASSWORD || "admin123",
    10
  );

  const admin = await prisma.user.upsert({
    where: { email: "admin@exora.local" },
    update: {},
    create: {
      email: "admin@exora.local",
      passwordHash: adminHash,
      name: "Admin",
      role: "admin",
      active: true,
    },
  });
  console.log("Admin user:", admin.email);

  const workModes = [
    { name: "Remote", sortOrder: 0 },
    { name: "Onsite", sortOrder: 1 },
    { name: "Hybrid", sortOrder: 2 },
    { name: "Field", sortOrder: 3 },
  ];
  for (const w of workModes) {
    await prisma.workMode.upsert({
      where: { name: w.name },
      update: { sortOrder: w.sortOrder },
      create: { name: w.name, sortOrder: w.sortOrder, active: true },
    });
  }
  console.log("Work modes created");

  const proofTypes = [
    { name: "Photo", sortOrder: 0 },
    { name: "Short video", sortOrder: 1 },
    { name: "Document", sortOrder: 2 },
    { name: "Client email", sortOrder: 3 },
    { name: "Voice note", sortOrder: 4 },
  ];
  for (const p of proofTypes) {
    await prisma.proofType.upsert({
      where: { name: p.name },
      update: { sortOrder: p.sortOrder },
      create: { name: p.name, sortOrder: p.sortOrder, active: true },
    });
  }
  console.log("Proof types created");

  const weekDef = await prisma.weekDefinition.findFirst();
  if (!weekDef) {
    await prisma.weekDefinition.create({
      data: {
        startWeekDay: 1, // Monday
        commitmentDueDay: 1,
        reviewDueDay: 5, // Friday
      },
    });
    console.log("Week definition created (Mon start, Fri review)");
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
