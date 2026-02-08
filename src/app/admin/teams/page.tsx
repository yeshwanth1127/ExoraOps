import { prisma } from "@/lib/db";
import Link from "next/link";
import { TeamsList } from "./TeamsList";

export default async function TeamsPage() {
  const teams = await prisma.team.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { users: true } } },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-100">Teams</h1>
      <p className="mt-1 text-gray-500">Create and edit teams. Assign employees to teams from Employees.</p>
      <TeamsList initial={teams} />
    </div>
  );
}
