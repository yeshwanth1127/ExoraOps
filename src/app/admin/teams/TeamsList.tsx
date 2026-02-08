"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Team = { id: string; name: string; code: string | null; _count: { users: number } };

export function TeamsList({ initial }: { initial: Team[] }) {
  const router = useRouter();
  const [teams, setTeams] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [saving, setSaving] = useState(false);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), code: code.trim() || null }),
      });
      if (!res.ok) throw new Error("Failed");
      const team = await res.json();
      setTeams((prev) => [...prev, { ...team, _count: { users: 0 } }]);
      setName("");
      setCode("");
      setShowForm(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-6">
      {!showForm ? (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500"
        >
          Add team
        </button>
      ) : (
        <form onSubmit={create} className="mb-4 flex flex-wrap items-end gap-4 rounded-lg border border-purple-900/50 bg-gray-900/80 p-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 block w-48 rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Code (optional)</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="mt-1 block w-32 rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500 disabled:opacity-50"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => { setShowForm(false); setName(""); setCode(""); }}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100"
          >
            Cancel
          </button>
        </form>
      )}
      <ul className="space-y-2">
        {teams.map((t) => (
          <li key={t.id} className="flex items-center justify-between rounded-md border border-purple-900/50 bg-gray-900/80 px-4 py-3">
            <div>
              <span className="font-medium text-gray-100">{t.name}</span>
              {t.code && <span className="ml-2 text-sm text-gray-500">({t.code})</span>}
              <span className="ml-2 text-sm text-gray-400">{t._count.users} employees</span>
            </div>
            <Link
              href={`/admin/teams/${t.id}`}
              className="text-sm text-purple-600 hover:text-purple-800"
            >
              Edit
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
