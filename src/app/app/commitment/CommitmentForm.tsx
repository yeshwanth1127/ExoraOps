"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CommitmentForm({ initial, weekStartDate }: { initial: string; weekStartDate: string }) {
  const router = useRouter();
  const [statement, setStatement] = useState(initial);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/commitments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ successStatement: statement.trim(), weekStartDate }),
      });
      if (!res.ok) throw new Error("Failed");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6">
      <label className="block text-sm font-medium text-gray-700">
        This week, success means:
      </label>
      <textarea
        value={statement}
        onChange={(e) => setStatement(e.target.value)}
        required
        maxLength={500}
        rows={2}
        placeholder="e.g. Client site installation completed"
        className="mt-2 block w-full max-w-xl rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
      />
      <p className="mt-1 text-xs text-gray-500">{statement.length}/500</p>
      <button
        type="submit"
        disabled={saving}
        className="mt-4 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save commitment"}
      </button>
    </form>
  );
}
