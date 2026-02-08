"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ReviewForm({
  weekStartDate,
  initialAchieved,
  initialReason,
}: {
  weekStartDate: string;
  initialAchieved?: boolean;
  initialReason: string;
}) {
  const router = useRouter();
  const [achieved, setAchieved] = useState<boolean | null>(initialAchieved ?? null);
  const [reason, setReason] = useState(initialReason);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (achieved === null) return;
    setSaving(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekStartDate,
          commitmentAchieved: achieved,
          reasonIfNo: achieved ? null : reason.trim() || null,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <p className="font-medium text-gray-100">Was your weekly commitment achieved?</p>
      <div className="flex gap-4">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="achieved"
            checked={achieved === true}
            onChange={() => setAchieved(true)}
            className="rounded-full border-purple-900/60"
          />
          Yes
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="achieved"
            checked={achieved === false}
            onChange={() => setAchieved(false)}
            className="rounded-full border-purple-900/60"
          />
          No
        </label>
      </div>
      {achieved === false && (
        <div>
          <label className="block text-sm font-medium text-gray-700">One-line reason (optional)</label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
            placeholder="e.g. Client delayed handover"
            className="mt-1 block w-full max-w-md rounded-md border border-purple-900/60 px-3 py-2"
          />
        </div>
      )}
      <button
        type="submit"
        disabled={saving || achieved === null}
        className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Submit review"}
      </button>
    </form>
  );
}
