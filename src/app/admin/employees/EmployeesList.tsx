"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Employee = {
  id: string;
  email: string;
  name: string;
  active: boolean;
  teamId: string | null;
  workModeId: string | null;
  team: { id: string; name: string } | null;
  workMode: { id: string; name: string } | null;
};
type Team = { id: string; name: string };
type WorkMode = { id: string; name: string };

export function EmployeesList({
  initial,
  teams,
  workModes,
}: {
  initial: Employee[];
  teams: Team[];
  workModes: WorkMode[];
}) {
  const router = useRouter();
  const [employees, setEmployees] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [teamId, setTeamId] = useState("");
  const [workModeId, setWorkModeId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim(),
          password: password.trim() || undefined,
          teamId: teamId || null,
          workModeId: workModeId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed");
        return;
      }
      setEmployees((prev) => [...prev, data]);
      setEmail("");
      setName("");
      setPassword("");
      setTeamId("");
      setWorkModeId("");
      setShowForm(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-6">
      {error && (
        <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}
      {!showForm ? (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500"
        >
          Add employee
        </button>
      ) : (
        <form onSubmit={create} className="mb-6 rounded-lg border border-purple-900/50 bg-gray-900/80 p-4">
          <h3 className="font-medium text-gray-100">New employee</h3>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password (optional, default: changeme123)</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank for default"
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Team</label>
              <select
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900"
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
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900"
              >
                <option value="">—</option>
                {workModes.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500 disabled:opacity-50"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setError(null); }}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
      <ul className="space-y-2">
        {employees.map((e) => (
          <li
            key={e.id}
            className={`flex items-center justify-between rounded-md border px-4 py-3 ${e.active ? "border-purple-900/50 bg-gray-900/80" : "border-gray-100 bg-gray-50"}`}
          >
            <div>
              <span className="font-medium text-gray-100">{e.name}</span>
              <span className="ml-2 text-sm text-gray-500">{e.email}</span>
              {e.team && <span className="ml-2 text-sm text-gray-400">· {e.team.name}</span>}
              {e.workMode && <span className="ml-2 text-sm text-gray-400">· {e.workMode.name}</span>}
              {!e.active && <span className="ml-2 text-xs text-amber-600">(inactive)</span>}
            </div>
            <Link href={`/admin/employees/${e.id}`} className="text-sm text-purple-600 hover:text-purple-800">
              Edit
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
