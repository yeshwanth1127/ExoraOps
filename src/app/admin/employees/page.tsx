import { prisma } from "@/lib/db";
import { EmployeesList } from "./EmployeesList";

export default async function EmployeesPage() {
  const [employees, teams, workModes] = await Promise.all([
    prisma.user.findMany({
      where: { role: "employee" },
      orderBy: { name: "asc" },
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
    }),
    prisma.team.findMany({ orderBy: { name: "asc" } }),
    prisma.workMode.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
      <p className="mt-1 text-gray-500">Invite and manage employees. Set team and work mode.</p>
      <EmployeesList
        initial={employees}
        teams={teams}
        workModes={workModes}
      />
    </div>
  );
}
