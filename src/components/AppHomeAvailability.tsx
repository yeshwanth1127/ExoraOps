"use client";

import { useState, useEffect } from "react";

type StateResponse = {
  state: "available" | "soft_away" | "away" | null;
  insideWorkWindow: boolean;
};
type SessionResponse = { id: string; startedAt: string; endedAt: string | null; lateStart: boolean } | null;

export function AppHomeAvailability() {
  const [state, setState] = useState<StateResponse["state"]>(null);
  const [insideWorkWindow, setInsideWorkWindow] = useState(false);
  const [session, setSession] = useState<SessionResponse>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [stateRes, sessionRes] = await Promise.all([
          fetch("/api/app/availability/state"),
          fetch("/api/app/availability/session"),
        ]);
        if (stateRes.ok) {
          const d: StateResponse = await stateRes.json();
          setState(d.state);
          setInsideWorkWindow(d.insideWorkWindow ?? false);
        }
        if (sessionRes.ok) {
          const d: SessionResponse = await sessionRes.json();
          setSession(d);
        }
      } catch {
        // ignore
      }
    };
    load();
  }, []);

  const startWork = async () => {
    setStarting(true);
    try {
      const r = await fetch("/api/app/availability/start", { method: "POST" });
      if (r.ok) {
        const d = await r.json();
        setState("available");
        setSession(d.sessionId ? { id: d.sessionId, startedAt: d.startedAt, endedAt: null, lateStart: d.lateStart } : null);
      }
    } catch {
      // ignore
    } finally {
      setStarting(false);
    }
  };

  const endWork = async () => {
    try {
      const r = await fetch("/api/app/availability/end", { method: "POST" });
      if (r.ok) {
        const d = await r.json();
        setState(null);
        setSession((s) => (s ? { ...s, endedAt: d.endedAt ?? s.startedAt } : null));
      }
    } catch {
      // ignore
    }
  };

  if (!insideWorkWindow) return null;
  if (session) {
    return (
      <div className="mb-8 rounded-lg border border-purple-500/30 bg-gray-900/80 p-4 text-center">
        <p className="text-sm text-gray-400">
          Started at {new Date(session.startedAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
          {session.lateStart && " (late start)"}
          {session.endedAt && ` · Ended at ${new Date(session.endedAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`}.
        </p>
        <p className="mt-1 text-gray-300">
          Status: <span className={state === "available" ? "text-green-400" : state === "soft_away" ? "text-amber-400" : "text-red-400"}>{state ?? "—"}</span>
        </p>
        {!session.endedAt && (
          <button
            type="button"
            onClick={endWork}
            className="mt-3 rounded-lg border border-red-500/50 px-4 py-2 text-sm text-red-400 hover:bg-red-500/20"
          >
            End work
          </button>
        )}
      </div>
    );
  }
  return (
    <div className="mb-8 rounded-lg border-2 border-purple-500/50 bg-purple-950/30 p-6 text-center">
      <p className="text-gray-300">Within your work window. Start when you&apos;re ready.</p>
      <button
        type="button"
        onClick={startWork}
        disabled={starting}
        className="mt-4 rounded-lg bg-purple-600 px-6 py-3 font-medium text-white hover:bg-purple-500 disabled:opacity-50"
      >
        {starting ? "Starting…" : "Start work"}
      </button>
    </div>
  );
}
