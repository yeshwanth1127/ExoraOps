"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Commitment = {
  id: string;
  successStatement: string;
  createdAt: Date;
  user: { id: string; name: string; email: string; team: { name: string } | null };
};

export function CommitmentList({
  weekStartDate,
  initial,
  totalEmployees,
}: {
  weekStartDate: string;
  initial: Commitment[];
  totalEmployees: number;
}) {
  const router = useRouter();
  const [weekStart, setWeekStart] = useState(weekStartDate);
  const [data, setData] = useState(initial);

  async function loadWeek() {
    const res = await fetch(`/api/admin/commitments?weekStart=${weekStart}`);
    const json = await res.json();
    if (res.ok) setData(json.commitments);
    router.refresh();
  }

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-300">Week starting</span>
          <input
            type="date"
            value={weekStart}
            onChange={(e) => setWeekStart(e.target.value)}
            className="rounded-md border border-purple-900/60 bg-black/30 text-gray-100 px-3 py-2"
          />
        </label>
        <button
          type="button"
          onClick={loadWeek}
          className="rounded-md bg-purple-900/40 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-200"
        >
          Load
        </button>
      </div>
      <ul className="mt-4 space-y-3">
        {data.map((c) => (
          <li key={c.id} className="rounded-md border border-purple-900/50 bg-gray-900/80 p-4">
            <p className="font-medium text-gray-100">{c.user.name}</p>
            <p className="text-sm text-gray-400">{c.user.email} {c.user.team && `· ${c.user.team.name}`}</p>
            <p className="mt-2 text-gray-300">&ldquo;{c.successStatement}&rdquo;</p>
          </li>
        ))}
      </ul>
      {data.length === 0 && (
        <p className="mt-4 text-sm text-gray-400">No commitments for this week yet.</p>
      )}
    </div>
  );
}
