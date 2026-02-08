import { prisma } from "@/lib/db";
import { TasksManager } from "./TasksManager";

export default async function AdminTasksPage() {
  const [milestones, tasks, employees] = await Promise.all([
    prisma.milestone.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { tasks: true } } },
    }),
    prisma.task.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: {
        milestone: { select: { id: true, name: true } },
        subtasks: { orderBy: { sortOrder: "asc" }, include: { assignedTo: { select: { id: true, name: true, email: true } } } },
        assignments: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    }),
    prisma.user.findMany({
      where: { role: "employee", active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-100">Tasks & milestones</h1>
      <p className="mt-1 text-gray-500">
        Create milestones, tasks, and subtasks. Assign the whole task to people or assign subtasks individually.
      </p>
      <TasksManager
        initialMilestones={milestones}
        initialTasks={tasks}
        employees={employees}
      />
    </div>
  );
}
