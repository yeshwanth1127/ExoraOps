"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ProofType = { id: string; name: string; active: boolean; sortOrder: number };

export function ProofTypesSection({ initial }: { initial: ProofType[] }) {
  const router = useRouter();
  const [list, setList] = useState(initial);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState<string | null>(null);

  async function add() {
    if (!newName.trim()) return;
    setSaving("add");
    try {
      const res = await fetch("/api/admin/proof-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setList((prev) => [...prev, data]);
      setNewName("");
      router.refresh();
    } finally {
      setSaving(null);
    }
  }

  async function toggle(id: string, active: boolean) {
    setSaving(id);
    try {
      const res = await fetch(`/api/admin/proof-types/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });
      if (!res.ok) throw new Error("Failed");
      setList((prev) => prev.map((p) => (p.id === id ? { ...p, active } : p)));
      router.refresh();
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="mt-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New proof type name"
          className="rounded-md border border-purple-900/60 bg-black/30 text-gray-100 px-3 py-2 shadow-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
        />
        <button
          type="button"
          onClick={add}
          disabled={saving === "add" || !newName.trim()}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          Add
        </button>
      </div>
      <ul className="mt-4 space-y-2">
        {list.map((p) => (
          <li key={p.id} className="flex items-center gap-4 rounded-md border border-gray-200 bg-white px-3 py-2 text-gray-900">
            <span className="font-medium text-gray-900">{p.name}</span>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={p.active}
                onChange={() => toggle(p.id, !p.active)}
                disabled={saving === p.id}
                className="rounded border-purple-900/60 bg-black/30 text-gray-100"
              />
              Active
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
