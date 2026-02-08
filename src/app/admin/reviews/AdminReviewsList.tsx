"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Review = {
  id: string;
  commitmentAchieved: boolean;
  reasonIfNo: string | null;
  submittedAt: Date;
  user: { id: string; name: string; email: string; team: { name: string } | null };
};

export function AdminReviewsList({
  weekStartDate,
  initial,
}: {
  weekStartDate: string;
  initial: Review[];
}) {
  const router = useRouter();
  const [weekStart, setWeekStart] = useState(weekStartDate);
  const [reviews, setReviews] = useState(initial);

  async function load() {
    const res = await fetch(`/api/admin/reviews?weekStart=${weekStart}`);
    const json = await res.json();
    if (res.ok) setReviews(json.reviews);
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
          onClick={load}
          className="rounded-md bg-purple-900/40 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-200"
        >
          Load
        </button>
      </div>
      <ul className="mt-4 space-y-3">
        {reviews.map((r) => (
          <li key={r.id} className="rounded-md border border-purple-900/50 bg-gray-900/80 p-4">
            <p className="font-medium text-gray-900">{r.user.name}</p>
            <p className="text-sm text-gray-400">{r.user.email} {r.user.team && `· ${r.user.team.name}`}</p>
            <p className="mt-2">
              {r.commitmentAchieved ? (
                <span className="text-green-700">Yes — commitment achieved</span>
              ) : (
                <span className="text-amber-700">No{r.reasonIfNo ? ` — ${r.reasonIfNo}` : ""}</span>
              )}
            </p>
          </li>
        ))}
      </ul>
      {reviews.length === 0 && (
        <p className="mt-4 text-sm text-gray-400">No reviews for this week yet.</p>
      )}
    </div>
  );
}
