import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { MyTasksList } from "./MyTasksList";

export default async function MyTasksPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const tasks = await prisma.task.findMany({
    where: {
      OR: [
        { assignments: { some: { userId: session.id } } },
        { subtasks: { some: { assignedToUserId: session.id } } },
      ],
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: {
      milestone: { select: { id: true, name: true, dueDate: true } },
      subtasks: { orderBy: { sortOrder: "asc" }, include: { assignedTo: { select: { id: true, name: true } } } },
      assignments: { include: { user: { select: { id: true, name: true } } } },
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-100">My tasks</h1>
      <p className="mt-1 text-gray-400">
        Tasks and subtasks assigned to you. Expand a task and mark subtasks done as you complete them.
      </p>
      <MyTasksList initialTasks={tasks} />
    </div>
  );
}
