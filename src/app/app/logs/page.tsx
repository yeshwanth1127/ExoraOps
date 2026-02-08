import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { LogsList } from "./LogsList";
import { NewLogForm } from "./NewLogForm";

export default async function LogsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [workTypes, proofTypes, logs] = await Promise.all([
    prisma.workMode.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.proofType.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.workLog.findMany({
      where: { userId: session.id },
      orderBy: { date: "desc" },
      take: 50,
      include: {
        workType: { select: { name: true } },
        proofItems: { include: { proofType: { select: { name: true } } } },
      },
    }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-100">Work logs</h1>
      <p className="mt-1 text-gray-400">Log work events with proof. No proof = no log.</p>
      <NewLogForm workTypes={workTypes} proofTypes={proofTypes} />
      <LogsList initial={logs} />
    </div>
  );
}
