"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Milestone = { id: string; name: string; description: string | null; dueDate: Date | null; _count: { tasks: number } };
type User = { id: string; name: string; email: string };
type Subtask = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  sortOrder: number;
  assignedTo: User | null;
};
type Task = {
  id: string;
  title: string;
  description: string | null;
  dueDate: Date | null;
  milestoneId: string | null;
  milestone: { id: string; name: string } | null;
  subtasks: Subtask[];
  assignments: { user: User }[];
};

export function TasksManager({
  initialMilestones,
  initialTasks,
  employees,
}: {
  initialMilestones: Milestone[];
  initialTasks: Task[];
  employees: User[];
}) {
  const router = useRouter();
  const [milestones, setMilestones] = useState(initialMilestones);
  const [tasks, setTasks] = useState(initialTasks);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null);
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(new Set());
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [addingSubtaskForTaskId, setAddingSubtaskForTaskId] = useState<string | null>(null);

  const filteredTasks = selectedMilestoneId
    ? tasks.filter((t) => t.milestoneId === selectedMilestoneId)
    : tasks;

  function toggleTask(id: string) {
    setExpandedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function addMilestone(name: string, description: string, dueDate: string) {
    const res = await fetch("/api/admin/milestones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), description: description.trim() || null, dueDate: dueDate || null }),
    });
    if (!res.ok) return;
    const m = await res.json();
    setMilestones((prev) => [...prev, { ...m, _count: { tasks: 0 } }]);
    setShowAddMilestone(false);
    router.refresh();
  }

  async function addTask(title: string, description: string, dueDate: string, milestoneId: string | null) {
    const res = await fetch("/api/admin/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        description: description.trim() || null,
        dueDate: dueDate || null,
        milestoneId: milestoneId || null,
      }),
    });
    if (!res.ok) return;
    const t = await res.json();
    setTasks((prev) => [...prev, t]);
    setShowAddTask(false);
    router.refresh();
  }

  async function addSubtask(taskId: string, title: string, assignedToUserId: string | null) {
    const res = await fetch(`/api/admin/tasks/${taskId}/subtasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), assignedToUserId: assignedToUserId || null }),
    });
    if (!res.ok) return;
    const st = await res.json();
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, subtasks: [...task.subtasks, st] } : task
      )
    );
    setAddingSubtaskForTaskId(null);
    router.refresh();
  }

  async function assignTask(taskId: string, userId: string) {
    const res = await fetch(`/api/admin/tasks/${taskId}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) return;
    const t = await res.json();
    setTasks((prev) => prev.map((task) => (task.id === taskId ? t : task)));
    router.refresh();
  }

  async function unassignTask(taskId: string, userId: string) {
    await fetch(`/api/admin/tasks/${taskId}/assign?userId=${userId}`, { method: "DELETE" });
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? { ...task, assignments: task.assignments.filter((a) => a.user.id !== userId) }
          : task
      )
    );
    router.refresh();
  }

  async function assignSubtask(subtaskId: string, taskId: string, userId: string | null) {
    const res = await fetch(`/api/admin/subtasks/${subtaskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignedToUserId: userId || null }),
    });
    if (!res.ok) return;
    const st = await res.json();
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? { ...task, subtasks: task.subtasks.map((s) => (s.id === subtaskId ? st : s)) }
          : task
      )
    );
    router.refresh();
  }

  async function setSubtaskStatus(subtaskId: string, taskId: string, status: string) {
    const res = await fetch(`/api/admin/subtasks/${subtaskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) return;
    const st = await res.json();
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? { ...task, subtasks: task.subtasks.map((s) => (s.id === subtaskId ? st : s)) }
          : task
      )
    );
    router.refresh();
  }

  async function deleteSubtask(subtaskId: string, taskId: string) {
    await fetch(`/api/admin/subtasks/${subtaskId}`, { method: "DELETE" });
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, subtasks: task.subtasks.filter((s) => s.id !== subtaskId) } : task
      )
    );
    router.refresh();
  }

  return (
    <div className="mt-6 flex flex-col gap-8 lg:flex-row">
      {/* Milestones sidebar */}
      <section className="lg:w-56 shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-100">Milestones</h2>
          <button
            type="button"
            onClick={() => setShowAddMilestone(true)}
            className="rounded bg-purple-600 px-2 py-1 text-sm text-white hover:bg-purple-500"
          >
            + Add
          </button>
        </div>
        {showAddMilestone && (
          <AddMilestoneForm
            onSave={addMilestone}
            onCancel={() => setShowAddMilestone(false)}
          />
        )}
        <ul className="mt-2 space-y-1">
          <li>
            <button
              type="button"
              onClick={() => setSelectedMilestoneId(null)}
              className={`w-full rounded px-3 py-2 text-left text-sm ${selectedMilestoneId === null ? "bg-purple-100 text-purple-800" : "hover:bg-purple-900/30"}`}
            >
              All tasks
            </button>
          </li>
          {milestones.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => setSelectedMilestoneId(m.id)}
                className={`w-full rounded px-3 py-2 text-left text-sm ${selectedMilestoneId === m.id ? "bg-purple-100 text-purple-800" : "hover:bg-purple-900/30"}`}
              >
                {m.name}
                <span className="ml-1 text-gray-400">({m._count.tasks})</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Tasks list */}
      <section className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-100">Tasks</h2>
          <button
            type="button"
            onClick={() => setShowAddTask(true)}
            className="rounded bg-purple-600 px-3 py-1.5 text-sm text-white hover:bg-purple-500"
          >
            + Add task
          </button>
        </div>
        {showAddTask && (
          <AddTaskForm
            milestones={milestones}
            selectedMilestoneId={selectedMilestoneId}
            onSave={addTask}
            onCancel={() => setShowAddTask(false)}
          />
        )}
        <ul className="mt-4 space-y-2">
          {filteredTasks.map((task) => (
            <li key={task.id} className="rounded-lg border border-purple-900/50 bg-gray-900/80 shadow-sm">
              <div
                className="flex cursor-pointer items-center gap-2 px-4 py-3"
                onClick={() => toggleTask(task.id)}
              >
                <span className="text-gray-500">
                  {expandedTaskIds.has(task.id) ? "▼" : "▶"}
                </span>
                <span className="font-medium text-gray-100">{task.title}</span>
                {task.milestone && (
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                    {task.milestone.name}
                  </span>
                )}
                {task.dueDate && (
                  <span className="text-xs text-gray-400">
                    Due {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                )}
                <span className="ml-auto text-sm text-gray-500">
                  {task.subtasks.filter((s) => s.status === "done").length}/{task.subtasks.length} subtasks
                </span>
              </div>
              {expandedTaskIds.has(task.id) && (
                <div className="border-t border-purple-900/30 bg-gray-900/60 px-4 py-3">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Assign whole task:</span>
                    <select
                      className="rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900"
                      value=""
                      onChange={(e) => {
                        const uid = e.target.value;
                        if (uid) assignTask(task.id, uid);
                        e.target.value = "";
                      }}
                    >
                      <option value="">+ Add person</option>
                      {employees
                        .filter((u) => !task.assignments.some((a) => a.user.id === u.id))
                        .map((u) => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                    </select>
                    {task.assignments.map((a) => (
                      <span
                        key={a.user.id}
                        className="inline-flex items-center gap-1 rounded bg-purple-100 px-2 py-0.5 text-xs text-purple-800"
                      >
                        {a.user.name}
                        <button
                          type="button"
                          onClick={(ev) => { ev.stopPropagation(); unassignTask(task.id, a.user.id); }}
                          className="hover:text-purple-900"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="text-sm text-gray-600">{task.description || "—"}</div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-700">Subtasks</span>
                      {addingSubtaskForTaskId !== task.id ? (
                        <button
                          type="button"
                          onClick={() => setAddingSubtaskForTaskId(task.id)}
                          className="text-sm text-purple-600 hover:underline"
                        >
                          + Add subtask
                        </button>
                      ) : (
                        <AddSubtaskForm
                          taskId={task.id}
                          employees={employees}
                          onSave={addSubtask}
                          onCancel={() => setAddingSubtaskForTaskId(null)}
                        />
                      )}
                    </div>
                    <ul className="mt-2 space-y-2">
                      {task.subtasks.map((st) => (
                        <li
                          key={st.id}
                          className={`flex flex-wrap items-center gap-2 rounded border px-3 py-2 ${st.status === "done" ? "border-green-200 bg-green-50" : "border-purple-900/30 bg-gray-900/80"}`}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setSubtaskStatus(st.id, task.id, st.status === "done" ? "pending" : "done")
                            }
                            className="shrink-0"
                            title={st.status === "done" ? "Mark not done" : "Mark done"}
                          >
                            {st.status === "done" ? "☑" : "☐"}
                          </button>
                          <span className={st.status === "done" ? "text-gray-500 line-through" : ""}>
                            {st.title}
                          </span>
                          <select
                            className="rounded border border-purple-900/50 bg-white px-2 py-0.5 text-xs text-gray-900"
                            value={st.assignedTo?.id ?? ""}
                            onChange={(e) =>
                              assignSubtask(st.id, task.id, e.target.value || null)
                            }
                          >
                            <option value="">Unassigned</option>
                            {employees.map((u) => (
                              <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                          </select>
                          <span
                            className={`rounded px-2 py-0.5 text-xs ${
                              st.status === "done"
                                ? "bg-green-100 text-green-800"
                                : st.status === "in_progress"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {st.status.replace("_", " ")}
                          </span>
                          <button
                            type="button"
                            onClick={() => deleteSubtask(st.id, task.id)}
                            className="ml-auto text-xs text-red-600 hover:underline"
                          >
                            Delete
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
        {filteredTasks.length === 0 && (
          <p className="mt-4 text-sm text-gray-500">No tasks yet. Add a task or select another milestone.</p>
        )}
      </section>
    </div>
  );
}

function AddMilestoneForm({
  onSave,
  onCancel,
}: {
  onSave: (name: string, description: string, dueDate: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  return (
    <div className="mt-2 rounded border border-purple-900/50 bg-gray-900/80 p-3">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Milestone name"
        className="mb-2 w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900"
      />
      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
        className="mb-2 w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900"
      />
      <input
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        className="mb-2 w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onSave(name, description, dueDate)}
          className="rounded bg-purple-600 px-2 py-1 text-sm text-white hover:bg-purple-500"
        >
          Save
        </button>
        <button type="button" onClick={onCancel} className="rounded border px-2 py-1 text-sm hover:bg-purple-900/30">
          Cancel
        </button>
      </div>
    </div>
  );
}

function AddTaskForm({
  milestones,
  selectedMilestoneId,
  onSave,
  onCancel,
}: {
  milestones: Milestone[];
  selectedMilestoneId: string | null;
  onSave: (title: string, description: string, dueDate: string, milestoneId: string | null) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [milestoneId, setMilestoneId] = useState<string | null>(selectedMilestoneId);
  return (
    <div className="mt-3 rounded-lg border border-purple-900/50 bg-gray-900/80 p-4">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title"
        className="mb-2 w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-900"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
        rows={2}
        className="mb-2 w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
      />
      <div className="mb-2 flex gap-4">
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
        />
        <select
          value={milestoneId ?? ""}
          onChange={(e) => setMilestoneId(e.target.value || null)}
          className="rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
        >
          <option value="">No milestone</option>
          {milestones.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onSave(title, description, dueDate, milestoneId)}
          className="rounded bg-purple-600 px-3 py-1.5 text-sm text-white hover:bg-purple-500"
        >
          Save task
        </button>
        <button type="button" onClick={onCancel} className="rounded border px-3 py-1.5 text-sm hover:bg-purple-900/30">
          Cancel
        </button>
      </div>
    </div>
  );
}

function AddSubtaskForm({
  taskId,
  employees,
  onSave,
  onCancel,
}: {
  taskId: string;
  employees: User[];
  onSave: (taskId: string, title: string, assignedToUserId: string | null) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [assignedToUserId, setAssignedToUserId] = useState("");
  return (
    <div className="inline-flex flex-wrap items-center gap-2">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Subtask title"
        className="w-48 rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900"
      />
      <select
        value={assignedToUserId}
        onChange={(e) => setAssignedToUserId(e.target.value)}
        className="rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900"
      >
        <option value="">Unassigned</option>
        {employees.map((u) => (
          <option key={u.id} value={u.id}>{u.name}</option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => onSave(taskId, title, assignedToUserId || null)}
        className="rounded bg-purple-600 px-2 py-1 text-sm text-white hover:bg-purple-500"
      >
        Add
      </button>
      <button type="button" onClick={onCancel} className="text-sm text-gray-500 hover:underline">
        Cancel
      </button>
    </div>
  );
}
