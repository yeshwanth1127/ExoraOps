import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { TeamEditForm } from "./TeamEditForm";

export default async function TeamEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const team = await prisma.team.findUnique({
    where: { id },
    include: { users: { select: { id: true, name: true, email: true } } },
  });
  if (!team) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-100">Edit team</h1>
      <TeamEditForm team={team} />
      {team.users.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-medium text-gray-100">Members</h2>
          <ul className="mt-2 space-y-1 text-sm text-gray-600">
            {team.users.map((u) => (
              <li key={u.id}>{u.name} ({u.email})</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
