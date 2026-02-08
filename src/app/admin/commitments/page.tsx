import { prisma } from "@/lib/db";
import { getWeekStartForDate } from "@/lib/week";
import { CommitmentList } from "./CommitmentList";

export default async function AdminCommitmentsPage() {
  const weekStart = await getWeekStartForDate(new Date());
  const commitments = await prisma.weeklyCommitment.findMany({
    where: { weekStartDate: weekStart },
    include: { user: { select: { id: true, name: true, email: true, team: { select: { name: true } } } } },
    orderBy: { createdAt: "asc" },
  });
  const employees = await prisma.user.count({ where: { role: "employee", active: true } });
  const submitted = commitments.length;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-100">Weekly commitments</h1>
      <p className="mt-1 text-gray-500">
        Week of {weekStart.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
      </p>
      <p className="mt-2 text-sm text-gray-600">
        {submitted} of {employees} employees submitted
      </p>
      <CommitmentList
        weekStartDate={weekStart.toISOString().slice(0, 10)}
        initial={commitments}
        totalEmployees={employees}
      />
    </div>
  );
}
