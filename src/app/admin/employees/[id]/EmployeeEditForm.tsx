"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Employee = { id: string; name: string; teamId: string | null; workModeId: string | null; active: boolean };
type Team = { id: string; name: string };
type WorkMode = { id: string; name: string };

export function EmployeeEditForm({
  employee,
  teams,
  workModes,
}: {
  employee: Employee;
  teams: Team[];
  workModes: WorkMode[];
}) {
  const router = useRouter();
  const [name, setName] = useState(employee.name);
  const [teamId, setTeamId] = useState(employee.teamId ?? "");
  const [workModeId, setWorkModeId] = useState(employee.workModeId ?? "");
  const [active, setActive] = useState(employee.active);
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const body: { name: string; teamId: string | null; workModeId: string | null; active: boolean; password?: string } = {
        name: name.trim(),
        teamId: teamId || null,
        workModeId: workModeId || null,
        active,
      };
      if (password.trim()) body.password = password.trim();
      const res = await fetch(`/api/admin/employees/${employee.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed");
      setPassword("");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1 block w-64 rounded-md border border-purple-900/60 px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Team</label>
        <select
          value={teamId}
          onChange={(e) => setTeamId(e.target.value)}
          className="mt-1 block w-64 rounded-md border border-purple-900/60 px-3 py-2"
        >
          <option value="">—</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Work mode</label>
        <select
          value={workModeId}
          onChange={(e) => setWorkModeId(e.target.value)}
          className="mt-1 block w-64 rounded-md border border-purple-900/60 px-3 py-2"
        >
          <option value="">—</option>
          {workModes.map((w) => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="rounded border-purple-900/60"
          />
          Active
        </label>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">New password (leave blank to keep current)</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 block w-64 rounded-md border border-purple-900/60 px-3 py-2"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500 disabled:opacity-50"
        >
          Save
        </button>
        <Link
          href="/admin/employees"
          className="rounded-md border border-purple-900/60 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Back
        </Link>
      </div>
    </form>
  );
}
