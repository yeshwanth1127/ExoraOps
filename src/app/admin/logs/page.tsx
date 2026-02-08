import { prisma } from "@/lib/db";
import { AdminLogsList } from "./AdminLogsList";

export default async function AdminLogsPage() {
  const [logs, teams] = await Promise.all([
    prisma.workLog.findMany({
      orderBy: { date: "desc" },
      take: 100,
      include: {
        user: { select: { id: true, name: true, email: true, team: { select: { id: true, name: true } } } },
        workType: { select: { name: true } },
        proofItems: { include: { proofType: { select: { name: true } } } },
      },
    }),
    prisma.team.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-100">Work logs</h1>
      <p className="mt-1 text-gray-500">All work logs with proof. Filter by date or team.</p>
      <AdminLogsList initial={logs} teams={teams} />
    </div>
  );
}
