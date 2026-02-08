import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { EmployeeEditForm } from "./EmployeeEditForm";

export default async function EmployeeEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await prisma.user.findFirst({
    where: { id, role: "employee" },
    include: { team: true, workMode: true },
  });
  if (!user) notFound();
  const teams = await prisma.team.findMany({ orderBy: { name: "asc" } });
  const workModes = await prisma.workMode.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-100">Edit employee</h1>
      <p className="mt-1 text-sm text-gray-500">{user.email}</p>
      <EmployeeEditForm
        employee={{
          id: user.id,
          name: user.name,
          teamId: user.teamId,
          workModeId: user.workModeId,
          active: user.active,
          workStartTime: user.workStartTime ?? undefined,
          workEndTime: user.workEndTime ?? undefined,
          timezone: user.timezone ?? undefined,
        }}
        teams={teams}
        workModes={workModes}
      />
    </div>
  );
}
