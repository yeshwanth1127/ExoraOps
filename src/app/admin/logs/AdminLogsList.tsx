"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Log = {
  id: string;
  date: Date;
  description: string;
  user: { id: string; name: string; email: string; team: { id: string; name: string } | null };
  workType: { name: string };
  proofItems: { url: string; caption: string | null; proofType: { name: string } }[];
};
type Team = { id: string; name: string };

export function AdminLogsList({ initial, teams }: { initial: Log[]; teams: Team[] }) {
  const router = useRouter();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [teamId, setTeamId] = useState("");
  const [logs, setLogs] = useState(initial);

  async function load() {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (teamId) params.set("teamId", teamId);
    const res = await fetch(`/api/admin/work-logs?${params}`);
    if (res.ok) {
      const data = await res.json();
      setLogs(data);
    }
    router.refresh();
  }

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-end gap-4 rounded-lg border border-purple-900/50 bg-gray-900/80 p-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="mt-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="mt-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Team</label>
          <select
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            className="mt-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900"
          >
            <option value="">All</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={load}
          className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500"
        >
          Filter
        </button>
      </div>
      <ul className="mt-4 space-y-3">
        {logs.map((log) => (
          <li key={log.id} className="rounded-md border border-purple-900/50 bg-gray-900/80 p-4">
            <p className="text-sm text-gray-500">
              {new Date(log.date).toLocaleDateString("en-US")} · {log.user.name} ({log.user.email})
              {log.user.team && ` · ${log.user.team.name}`}
            </p>
            <p className="mt-1 font-medium text-gray-900">{log.workType.name}</p>
            <p className="mt-1 text-gray-700">{log.description}</p>
            <ul className="mt-2 flex flex-wrap gap-2 text-sm">
              {log.proofItems.map((p, i) => (
                <li key={i}>
                  <a
                    href={p.url.startsWith("http") ? p.url : (typeof window !== "undefined" ? window.location.origin + p.url : p.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-600 hover:underline"
                  >
                    {p.proofType.name}
                    {p.caption ? `: ${p.caption}` : ""}
                  </a>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
