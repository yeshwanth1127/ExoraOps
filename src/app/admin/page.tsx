import { prisma } from "@/lib/db";
import { getWeekStartForDate } from "@/lib/week";
import { DashboardClient } from "./DashboardClient";

export default async function AdminDashboardPage() {
  const weekStart = await getWeekStartForDate(new Date());
  const [teamCount, userCount, teams] = await Promise.all([
    prisma.team.count(),
    prisma.user.count({ where: { role: "employee", active: true } }),
    prisma.team.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-100">Dashboard</h1>
      <p className="mt-1 text-gray-400">Person-level and team-level signals. Configure filters and export.</p>
      <div className="mt-4 flex gap-4 text-sm text-gray-400">
        <span>{teamCount} teams</span>
        <span>{userCount} employees</span>
      </div>
      <DashboardClient teams={teams} />
    </div>
  );
}
