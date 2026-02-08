"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type User = { id: string; name: string };
type Subtask = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  assignedTo: User | null;
};
type Task = {
  id: string;
  title: string;
  description: string | null;
  dueDate: Date | null;
  milestone: { id: string; name: string; dueDate: Date | null } | null;
  subtasks: Subtask[];
  assignments: { user: User }[];
};

export function MyTasksList({ initialTasks }: { initialTasks: Task[] }) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks);
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(new Set());

  function toggleTask(id: string) {
    setExpandedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function setSubtaskStatus(subtaskId: string, taskId: string, status: string) {
    const res = await fetch(`/api/subtasks/${subtaskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) return;
    const updated = await res.json();
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              subtasks: task.subtasks.map((s) => (s.id === subtaskId ? updated : s)),
            }
          : task
      )
    );
    router.refresh();
  }

  const doneCount = (t: Task) => t.subtasks.filter((s) => s.status === "done").length;
  const totalCount = (t: Task) => t.subtasks.length;

  return (
    <ul className="mt-6 space-y-3">
      {tasks.map((task) => (
        <li
          key={task.id}
          className="rounded-xl border border-purple-900/50 bg-gray-900/80 shadow-sm transition-shadow hover:shadow-md"
        >
          <button
            type="button"
            onClick={() => toggleTask(task.id)}
            className="flex w-full items-center gap-3 px-4 py-4 text-left"
          >
            <span className="text-gray-400">
              {expandedTaskIds.has(task.id) ? "▼" : "▶"}
            </span>
            <span className="font-semibold text-gray-100">{task.title}</span>
            {task.milestone && (
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                {task.milestone.name}
              </span>
            )}
            {task.dueDate && (
              <span className="text-sm text-gray-500">
                Due {new Date(task.dueDate).toLocaleDateString()}
              </span>
            )}
            <span className="ml-auto rounded-full bg-purple-100 px-2.5 py-0.5 text-sm font-medium text-purple-800">
              {doneCount(task)} / {totalCount(task)} done
            </span>
          </button>
          {expandedTaskIds.has(task.id) && (
            <div className="border-t border-gray-100 bg-gray-50/80 px-4 py-4">
              {task.description && (
                <p className="mb-3 text-sm text-gray-600">{task.description}</p>
              )}
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                Subtasks
              </p>
              <ul className="space-y-2">
                {task.subtasks.map((st) => (
                  <li
                    key={st.id}
                    className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${
                      st.status === "done"
                        ? "border-green-200 bg-green-50/50"
                        : "border-gray-100 bg-gray-900/80"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setSubtaskStatus(
                          st.id,
                          task.id,
                          st.status === "done" ? "pending" : "done"
                        )
                      }
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded border-2 text-sm ${
                        st.status === "done"
                          ? "border-green-500 bg-green-500 text-white"
                          : "border-purple-500 hover:border-purple-400"
                      }`}
                      title={st.status === "done" ? "Mark not done" : "Mark done"}
                    >
                      {st.status === "done" ? "✓" : ""}
                    </button>
                    <span
                      className={
                        st.status === "done"
                          ? "text-gray-500 line-through"
                          : "font-medium text-gray-100"
                      }
                    >
                      {st.title}
                    </span>
                    {st.assignedTo && (
                      <span className="ml-auto text-xs text-gray-500">
                        Assigned to {st.assignedTo.name}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
      {tasks.length === 0 && (
        <li className="rounded-xl border border-dashed border-purple-900/50 bg-gray-900/40 px-6 py-8 text-center text-gray-500">
          No tasks assigned to you yet. Your admin will assign tasks or subtasks to you.
        </li>
      )}
    </ul>
  );
}
