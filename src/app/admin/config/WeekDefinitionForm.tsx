"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const DAYS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

type WeekDef = { id: string; startWeekDay: number; commitmentDueDay: number; reviewDueDay: number } | null;

export function WeekDefinitionForm({ initial }: { initial: WeekDef }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [startWeekDay, setStartWeekDay] = useState(initial?.startWeekDay ?? 1);
  const [commitmentDueDay, setCommitmentDueDay] = useState(initial?.commitmentDueDay ?? 1);
  const [reviewDueDay, setReviewDueDay] = useState(initial?.reviewDueDay ?? 5);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/config/week", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startWeekDay,
          commitmentDueDay,
          reviewDueDay,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex flex-wrap items-end gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Week start day</label>
        <select
          value={startWeekDay}
          onChange={(e) => setStartWeekDay(Number(e.target.value))}
          className="mt-1 block w-40 rounded-md border border-purple-900/60 bg-black/30 text-gray-100 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        >
          {DAYS.map((d) => (
            <option key={d.value} value={d.value}>{d.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Commitment due by</label>
        <select
          value={commitmentDueDay}
          onChange={(e) => setCommitmentDueDay(Number(e.target.value))}
          className="mt-1 block w-40 rounded-md border border-purple-900/60 bg-black/30 text-gray-100 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        >
          {DAYS.map((d) => (
            <option key={d.value} value={d.value}>{d.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Review due by</label>
        <select
          value={reviewDueDay}
          onChange={(e) => setReviewDueDay(Number(e.target.value))}
          className="mt-1 block w-40 rounded-md border border-purple-900/60 bg-black/30 text-gray-100 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        >
          {DAYS.map((d) => (
            <option key={d.value} value={d.value}>{d.label}</option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={saving}
        className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
