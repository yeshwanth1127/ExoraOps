"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Team = { id: string; name: string; code: string | null };

export function TeamEditForm({ team }: { team: Team }) {
  const router = useRouter();
  const [name, setName] = useState(team.name);
  const [code, setCode] = useState(team.code ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/teams/${team.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), code: code.trim() || null }),
      });
      if (!res.ok) throw new Error("Failed");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex flex-wrap items-end gap-4">
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
        <label className="block text-sm font-medium text-gray-700">Code (optional)</label>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="mt-1 block w-32 rounded-md border border-purple-900/60 px-3 py-2"
        />
      </div>
      <button
        type="submit"
        disabled={saving}
        className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500 disabled:opacity-50"
      >
        Save
      </button>
      <Link
        href="/admin/teams"
        className="rounded-md border border-purple-900/60 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Back
      </Link>
    </form>
  );
}
