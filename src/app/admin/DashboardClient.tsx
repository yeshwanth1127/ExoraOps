"use client";

import { useState, useEffect } from "react";

type Team = { id: string; name: string };
type Person = {
  id: string;
  name: string;
  email: string;
  team: { id: string; name: string } | null;
  byWeek: { weekStart: string; hasCommitment: boolean; hasReview: boolean; achieved: boolean; logCount: number }[];
  summary: { weeksWithCommitment: number; weeksWithReview: number; weeksAchieved: number; totalLogs: number };
};
type TeamLevel = {
  id: string;
  name: string;
  memberCount: number;
  totalLogs: number;
  totalCommitments: number;
  totalAchieved: number;
  weeks: number;
};

export function DashboardClient({ teams }: { teams: Team[] }) {
  const [weeks, setWeeks] = useState(6);
  const [teamId, setTeamId] = useState("");
  const [data, setData] = useState<{ personLevel: Person[]; teamLevel: TeamLevel[]; weekStarts: string[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams({ weeks: String(weeks) });
    if (teamId) params.set("teamId", teamId);
    fetch(`/api/admin/dashboard?${params}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [weeks, teamId]);

  async function exportCsv() {
    const res = await fetch(`/api/admin/export?weeks=${weeks}&teamId=${teamId || ""}`);
    if (!res.ok) return;
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `exora-dashboard-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  if (loading || !data) {
    return <p className="mt-6 text-gray-400">Loading…</p>;
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="flex flex-wrap items-end gap-4 rounded-lg border border-purple-900/50 bg-gray-900/80 p-4">
        <div>
          <label className="block text-sm font-medium text-gray-300">Weeks to show</label>
          <select
            value={weeks}
            onChange={(e) => setWeeks(Number(e.target.value))}
            className="mt-1 rounded-md border border-purple-900/60 bg-black/30 text-gray-100 px-3 py-2"
          >
            {[4, 6, 8, 12].map((n) => (
              <option key={n} value={n}>{n} weeks</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300">Team filter</label>
          <select
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            className="mt-1 rounded-md border border-purple-900/60 bg-black/30 text-gray-100 px-3 py-2"
          >
            <option value="">All teams</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500"
        >
          Export CSV
        </button>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-gray-100">Team-level</h2>
        <div className="mt-2 overflow-x-auto">
          <table className="min-w-full divide-y divide-purple-900/50 text-sm">
            <thead>
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-300">Team</th>
                <th className="px-3 py-2 text-right font-medium text-gray-300">Members</th>
                <th className="px-3 py-2 text-right font-medium text-gray-300">Total logs</th>
                <th className="px-3 py-2 text-right font-medium text-gray-300">Commitments</th>
                <th className="px-3 py-2 text-right font-medium text-gray-300">Achieved</th>
              </tr>
            </thead>
            <tbody>
              {data.teamLevel.map((t) => (
                <tr key={t.id} className="border-t border-purple-900/30">
                  <td className="px-3 py-2 font-medium text-gray-100">{t.name}</td>
                  <td className="px-3 py-2 text-right text-gray-400">{t.memberCount}</td>
                  <td className="px-3 py-2 text-right text-gray-400">{t.totalLogs}</td>
                  <td className="px-3 py-2 text-right text-gray-400">{t.totalCommitments}</td>
                  <td className="px-3 py-2 text-right text-gray-400">{t.totalAchieved}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-100">Person-level</h2>
        <p className="text-sm text-gray-400">Commitment submitted? Work logs? Proof? Pattern over selected weeks.</p>
        <div className="mt-2 overflow-x-auto">
          <table className="min-w-full divide-y divide-purple-900/50 text-sm">
            <thead>
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-300">Name</th>
                <th className="px-3 py-2 text-left font-medium text-gray-300">Team</th>
                <th className="px-3 py-2 text-right font-medium text-gray-300">Commitments</th>
                <th className="px-3 py-2 text-right font-medium text-gray-300">Reviews</th>
                <th className="px-3 py-2 text-right font-medium text-gray-300">Achieved</th>
                <th className="px-3 py-2 text-right font-medium text-gray-300">Logs</th>
              </tr>
            </thead>
            <tbody>
              {data.personLevel.map((p) => (
                <tr key={p.id} className="border-t border-purple-900/30">
                  <td className="px-3 py-2 font-medium text-gray-100">{p.name}</td>
                  <td className="px-3 py-2 text-gray-400">{p.team?.name ?? "—"}</td>
                  <td className="px-3 py-2 text-right text-gray-400">{p.summary.weeksWithCommitment}</td>
                  <td className="px-3 py-2 text-right text-gray-400">{p.summary.weeksWithReview}</td>
                  <td className="px-3 py-2 text-right text-gray-400">{p.summary.weeksAchieved}</td>
                  <td className="px-3 py-2 text-right text-gray-400">{p.summary.totalLogs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
