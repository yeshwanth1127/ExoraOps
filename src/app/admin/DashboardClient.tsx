"use client";

import { useState, useEffect, useCallback } from "react";

type Team = { id: string; name: string };
type AvailabilityRow = {
  id: string;
  name: string;
  email: string;
  team: { id: string; name: string } | null;
  availabilityState: "available" | "soft_away" | "away" | null;
  sessionId: string | null;
  lastSeenAt: string | null;
  workStartTime: string | null;
  workEndTime: string | null;
  timezone: string | null;
  sessionStartedAt: string | null;
  sessionEndedAt: string | null;
};
type PingRow = {
  id: string;
  sentAt: string;
  respondedAt: string | null;
  slaMinutes: number;
  fromUser: { id: string; name: string };
  targetUser: { id: string; name: string; email: string };
};
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
  const [availability, setAvailability] = useState<AvailabilityRow[]>([]);
  const [pings, setPings] = useState<PingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pinging, setPinging] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ workStartTime: "", workEndTime: "", timezone: "" });
  const [savingWindow, setSavingWindow] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams({ weeks: String(weeks) });
    if (teamId) params.set("teamId", teamId);
    fetch(`/api/admin/dashboard?${params}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [weeks, teamId]);

  const fetchAvailability = useCallback(async () => {
    const params = new URLSearchParams();
    if (teamId) params.set("teamId", teamId);
    const r = await fetch(`/api/admin/availability?${params}`);
    if (r.ok) setAvailability(await r.json());
  }, [teamId]);
  const fetchPings = useCallback(async () => {
    const r = await fetch("/api/admin/pings");
    if (r.ok) setPings(await r.json());
  }, []);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);
  useEffect(() => {
    fetchPings();
  }, [fetchPings]);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout>;
    const connect = () => {
      eventSource = new EventSource("/api/admin/availability/stream");
      eventSource.onmessage = (e) => {
        if (e.data === "update") fetchAvailability();
      };
      eventSource.onerror = () => {
        eventSource?.close();
        eventSource = null;
        reconnectTimeout = setTimeout(connect, 3000);
      };
    };
    connect();
    return () => {
      clearTimeout(reconnectTimeout);
      eventSource?.close();
    };
  }, [fetchAvailability]);

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
        <h2 className="text-lg font-semibold text-gray-100">Availability</h2>
        <p className="text-sm text-gray-400">State, session times, last seen (from heartbeat). Edit work window here or in Employees.</p>
        <div className="mt-2 overflow-x-auto">
          <table className="min-w-full divide-y divide-purple-900/50 text-sm">
            <thead>
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-300">Name</th>
                <th className="px-3 py-2 text-left font-medium text-gray-300">Team</th>
                <th className="px-3 py-2 text-left font-medium text-gray-300">Work window</th>
                <th className="px-3 py-2 text-left font-medium text-gray-300">Started at</th>
                <th className="px-3 py-2 text-left font-medium text-gray-300">Ended at</th>
                <th className="px-3 py-2 text-left font-medium text-gray-300">Last seen</th>
                <th className="px-3 py-2 text-left font-medium text-gray-300">State</th>
                <th className="px-3 py-2 text-left font-medium text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {availability.map((a) => (
                <tr key={a.id} className="border-t border-purple-900/30">
                  <td className="px-3 py-2 font-medium text-gray-100">
                    <span className="inline-flex items-center gap-2">
                      {a.availabilityState === "available" && (
                        <span
                          className="inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-green-500 ring-2 ring-green-400/50"
                          title="Available"
                        />
                      )}
                      {a.name}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-gray-400">{a.team?.name ?? "—"}</td>
                  <td className="px-3 py-2 text-gray-400">
                    {editingId === a.id ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="time"
                          value={editForm.workStartTime}
                          onChange={(e) => setEditForm((f) => ({ ...f, workStartTime: e.target.value }))}
                          className="rounded border border-purple-900/60 bg-white px-2 py-1 text-gray-900 text-xs"
                        />
                        <span className="text-gray-500">–</span>
                        <input
                          type="time"
                          value={editForm.workEndTime}
                          onChange={(e) => setEditForm((f) => ({ ...f, workEndTime: e.target.value }))}
                          className="rounded border border-purple-900/60 bg-white px-2 py-1 text-gray-900 text-xs"
                        />
                        <input
                          type="text"
                          placeholder="Timezone"
                          value={editForm.timezone}
                          onChange={(e) => setEditForm((f) => ({ ...f, timezone: e.target.value }))}
                          className="w-32 rounded border border-purple-900/60 bg-white px-2 py-1 text-gray-900 text-xs"
                        />
                        <button
                          type="button"
                          disabled={savingWindow}
                          onClick={async () => {
                            setSavingWindow(true);
                            try {
                              const r = await fetch(`/api/admin/employees/${a.id}`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  workStartTime: editForm.workStartTime || null,
                                  workEndTime: editForm.workEndTime || null,
                                  timezone: editForm.timezone || null,
                                }),
                              });
                              if (r.ok) {
                                setEditingId(null);
                                fetchAvailability();
                              }
                            } finally {
                              setSavingWindow(false);
                            }
                          }}
                          className="rounded bg-purple-600 px-2 py-1 text-xs text-white hover:bg-purple-500 disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="rounded border border-gray-600 px-2 py-1 text-xs text-gray-400 hover:bg-gray-800"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        {a.workStartTime && a.workEndTime
                          ? `${a.workStartTime} – ${a.workEndTime}${a.timezone ? ` (${a.timezone})` : ""}`
                          : "—"}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(a.id);
                            setEditForm({
                              workStartTime: a.workStartTime ?? "09:00",
                              workEndTime: a.workEndTime ?? "17:00",
                              timezone: a.timezone ?? "UTC",
                            });
                          }}
                          className="ml-2 rounded border border-purple-900/60 px-2 py-0.5 text-xs text-purple-300 hover:bg-purple-500/20"
                        >
                          Edit
                        </button>
                      </>
                    )}
                  </td>
                  <td className="px-3 py-2 text-gray-400">
                    {a.sessionStartedAt ? new Date(a.sessionStartedAt).toLocaleString() : "—"}
                  </td>
                  <td className="px-3 py-2 text-gray-400">
                    {a.sessionEndedAt ? new Date(a.sessionEndedAt).toLocaleString() : "—"}
                  </td>
                  <td className="px-3 py-2 text-gray-400">
                    {a.lastSeenAt ? new Date(a.lastSeenAt).toLocaleString() : "—"}
                  </td>
                  <td className="px-3 py-2">
                    {a.sessionEndedAt ? (
                      <span className="text-green-500 font-medium">Work done</span>
                    ) : (
                      <span
                        className={
                          a.availabilityState === "available"
                            ? "text-green-400"
                            : a.availabilityState === "soft_away"
                              ? "text-amber-400"
                              : a.availabilityState === "away"
                                ? "text-red-400"
                                : "text-gray-500"
                        }
                      >
                        {a.availabilityState ?? "—"}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      disabled={pinging === a.id}
                      onClick={async () => {
                        setPinging(a.id);
                        try {
                          await fetch("/api/admin/pings", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ targetUserId: a.id }),
                          });
                          fetchPings();
                        } finally {
                          setPinging(null);
                        }
                      }}
                      className="rounded bg-purple-600 px-2 py-1 text-xs text-white hover:bg-purple-500 disabled:opacity-50"
                    >
                      {pinging === a.id ? "Sending…" : "Ping"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {availability.length === 0 && <p className="mt-2 text-sm text-gray-500">No employees match filter.</p>}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-100">Recent pings</h2>
        <p className="text-sm text-gray-400">Open and responded pings.</p>
        <div className="mt-2 overflow-x-auto">
          <table className="min-w-full divide-y divide-purple-900/50 text-sm">
            <thead>
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-300">From</th>
                <th className="px-3 py-2 text-left font-medium text-gray-300">To</th>
                <th className="px-3 py-2 text-left font-medium text-gray-300">Sent</th>
                <th className="px-3 py-2 text-left font-medium text-gray-300">Status</th>
              </tr>
            </thead>
            <tbody>
              {pings.slice(0, 20).map((p) => (
                <tr key={p.id} className="border-t border-purple-900/30">
                  <td className="px-3 py-2 text-gray-100">{p.fromUser.name}</td>
                  <td className="px-3 py-2 text-gray-400">{p.targetUser.name}</td>
                  <td className="px-3 py-2 text-gray-400">{new Date(p.sentAt).toLocaleString()}</td>
                  <td className="px-3 py-2">
                    {p.respondedAt ? (
                      <span className="text-green-400">Responded</span>
                    ) : (
                      <span className="text-amber-400">Open</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pings.length === 0 && <p className="mt-2 text-sm text-gray-500">No pings yet.</p>}
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
