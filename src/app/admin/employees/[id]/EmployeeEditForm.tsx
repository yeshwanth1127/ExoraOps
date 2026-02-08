"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Employee = {
  id: string;
  name: string;
  teamId: string | null;
  workModeId: string | null;
  active: boolean;
  workStartTime?: string | null;
  workEndTime?: string | null;
  timezone?: string | null;
};
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
  const [workStartTime, setWorkStartTime] = useState(employee.workStartTime ?? "09:00");
  const [workEndTime, setWorkEndTime] = useState(employee.workEndTime ?? "17:00");
  const [timezone, setTimezone] = useState(employee.timezone ?? "UTC");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        name: name.trim(),
        teamId: teamId || null,
        workModeId: workModeId || null,
        active,
        workStartTime: workStartTime.trim() || null,
        workEndTime: workEndTime.trim() || null,
        timezone: timezone.trim() || null,
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
        <label className="block text-sm font-medium text-gray-400">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1 block w-64 rounded-md border border-purple-900/60 px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-400">Team</label>
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
        <label className="block text-sm font-medium text-gray-400">Work mode</label>
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
        <label className="flex items-center gap-2 text-gray-300">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="rounded border-purple-900/60"
          />
          Active
        </label>
      </div>
      <div className="rounded-lg border border-purple-900/50 bg-gray-900/50 p-4">
        <h3 className="text-sm font-medium text-gray-200">Work window (availability)</h3>
        <p className="mt-1 text-xs text-gray-500">Used for Start Work and availability; outside this window no penalties apply.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-400">Start time</label>
            <input
              type="time"
              value={workStartTime}
              onChange={(e) => setWorkStartTime(e.target.value)}
              className="mt-1 block w-full rounded-md border border-purple-900/60 bg-white px-3 py-2 text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400">End time</label>
            <input
              type="time"
              value={workEndTime}
              onChange={(e) => setWorkEndTime(e.target.value)}
              className="mt-1 block w-full rounded-md border border-purple-900/60 bg-white px-3 py-2 text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400">Timezone (IANA)</label>
            <input
              type="text"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              placeholder="America/New_York"
              className="mt-1 block w-full rounded-md border border-purple-900/60 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-500"
            />
          </div>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-400">New password (leave blank to keep current)</label>
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
          className="rounded-md border border-purple-900/60 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800"
        >
          Back
        </Link>
      </div>
    </form>
  );
}
