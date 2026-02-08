"use client";

import { useState, useEffect, useCallback } from "react";

type AvailabilityState = "available" | "soft_away" | "away" | null;
type StateResponse = {
  state: AvailabilityState;
  sessionId: string | null;
  lastSeenAt: string | null;
  insideWorkWindow: boolean;
};
type SessionResponse = { id: string; startedAt: string; endedAt: string | null; lateStart: boolean; lastState: string } | null;
type Ping = { id: string; sentAt: string; fromUser: { name: string } };

const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000;
const STATE_POLL_MS = 30 * 1000;

export function AppAvailability() {
  const [state, setState] = useState<AvailabilityState>(null);
  const [insideWorkWindow, setInsideWorkWindow] = useState(false);
  const [session, setSession] = useState<SessionResponse>(null);
  const [pings, setPings] = useState<Ping[]>([]);
  const [stillHereDisabled, setStillHereDisabled] = useState(false);

  const fetchState = useCallback(async () => {
    try {
      const r = await fetch("/api/app/availability/state");
      if (!r.ok) return;
      const data: StateResponse = await r.json();
      setState(data.state);
      setInsideWorkWindow(data.insideWorkWindow ?? false);
    } catch {
      // ignore
    }
  }, []);

  const fetchSession = useCallback(async () => {
    try {
      const r = await fetch("/api/app/availability/session");
      if (!r.ok) return;
      const data: SessionResponse = await r.json();
      setSession(data);
    } catch {
      // ignore
    }
  }, []);

  const fetchPings = useCallback(async () => {
    try {
      const r = await fetch("/api/app/pings");
      if (!r.ok) return;
      const data: Ping[] = await r.json();
      setPings(data);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchState();
    fetchSession();
    fetchPings();
    const t = setInterval(() => {
      fetchState();
      fetchSession();
      fetchPings();
    }, STATE_POLL_MS);
    return () => clearInterval(t);
  }, [fetchState, fetchSession, fetchPings]);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout>;
    const connect = () => {
      eventSource = new EventSource("/api/app/pings/stream");
      eventSource.onmessage = (e) => {
        if (e.data === "ping") fetchPings();
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
  }, [fetchPings]);

  useEffect(() => {
    const heartbeat = () => {
      fetch("/api/app/heartbeat", { method: "POST" }).catch(() => {});
    };
    heartbeat();
    const interval = setInterval(heartbeat, HEARTBEAT_INTERVAL_MS);
    const onVisibility = () => {
      if (document.visibilityState === "visible") heartbeat();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const startWork = async () => {
    try {
      const r = await fetch("/api/app/availability/start", { method: "POST" });
      const data = await r.json();
      if (r.ok) {
        setState("available");
        setSession(data.sessionId ? { id: data.sessionId, startedAt: data.startedAt, endedAt: null, lateStart: data.lateStart, lastState: "available" } : null);
      }
      fetchState();
      fetchSession();
    } catch {
      fetchState();
      fetchSession();
    }
  };

  const endWork = async () => {
    try {
      const r = await fetch("/api/app/availability/end", { method: "POST" });
      if (r.ok) {
        const data = await r.json();
        setState(null);
        setSession((s) => (s ? { ...s, endedAt: data.endedAt ?? s.startedAt } : null));
      }
      fetchState();
      fetchSession();
    } catch {
      fetchState();
      fetchSession();
    }
  };

  const stillHere = async () => {
    if (stillHereDisabled) return;
    setStillHereDisabled(true);
    try {
      const r = await fetch("/api/app/availability/still-here", { method: "POST" });
      if (r.ok) fetchState();
    } catch {
      // ignore
        } finally {
      setTimeout(() => setStillHereDisabled(false), 10 * 60 * 1000);
    }
  };

  const respondPing = async (pingId: string) => {
    try {
      await fetch(`/api/app/pings/${pingId}/respond`, { method: "POST" });
      setPings((prev) => prev.filter((p) => p.id !== pingId));
    } catch {
      fetchPings();
    }
  };

  const stateLabel = state === "available" ? "Available" : state === "soft_away" ? "Soft away" : state === "away" ? "Away" : null;
  const stateColor =
    state === "available"
      ? "bg-green-500/20 text-green-400 border-green-500/50"
      : state === "soft_away"
        ? "bg-amber-500/20 text-amber-400 border-amber-500/50"
        : state === "away"
          ? "bg-red-500/20 text-red-400 border-red-500/50"
          : "bg-gray-500/20 text-gray-400 border-gray-500/50";

  return (
    <>
      <div className="flex items-center gap-2">
        {state === "available" && (
          <span
            className="inline-flex items-center gap-1.5 rounded-full bg-green-500/20 px-2.5 py-1 text-xs font-medium text-green-400 ring-1 ring-green-500/50"
            title="You are connected and available"
          >
            <span className="inline-block h-2 w-2 rounded-full bg-green-500 ring-2 ring-green-400/50" />
            Connected
          </span>
        )}
        {stateLabel && (
          <span
            className={`rounded border px-2 py-1 text-xs font-medium ${stateColor}`}
            title="Availability status"
          >
            {state === "available" && "🟢"}
            {state === "soft_away" && "🟡"}
            {state === "away" && "🔴"}
            {stateLabel}
          </span>
        )}
        {insideWorkWindow && !session && (
          <button
            type="button"
            onClick={startWork}
            className="rounded-lg border border-purple-500/50 bg-purple-500/20 px-3 py-1.5 text-sm font-medium text-purple-300 hover:bg-purple-500/30"
          >
            Start work
          </button>
        )}
        {(state === "available" || state === "soft_away") && (
          <button
            type="button"
            onClick={stillHere}
            disabled={stillHereDisabled}
            className="rounded-lg border border-gray-500/50 px-3 py-1.5 text-sm text-gray-400 hover:bg-white/5 disabled:opacity-50"
          >
            Still here
          </button>
        )}
        {session && !session.endedAt && (
          <button
            type="button"
            onClick={endWork}
            className="rounded-lg border border-red-500/50 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/20"
          >
            End work
          </button>
        )}
      </div>
      {pings.length > 0 && (
        <>
          <div className="fixed inset-0 z-[100] grid min-h-screen min-w-full place-items-center p-4">
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              aria-hidden
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="ping-modal-title"
              className="relative z-[101] w-full max-w-md rounded-xl border-2 border-amber-500/50 bg-gray-900 shadow-2xl shadow-amber-500/20"
            >
              <div className="p-6 text-center">
                <h2 id="ping-modal-title" className="text-lg font-semibold text-gray-100">
                  You were pinged
                </h2>
                <p className="mt-2 text-gray-300">
                  <span className="font-medium text-amber-400">{pings[0].fromUser.name}</span> is checking if you&apos;re available. Please confirm.
                </p>
                <button
                  type="button"
                  onClick={() => respondPing(pings[0].id)}
                  className="mt-6 w-full rounded-lg bg-green-600 px-4 py-3 font-medium text-white hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-gray-900"
                >
                  I&apos;m available
                </button>
                {pings.length > 1 && (
                  <p className="mt-3 text-xs text-gray-500">
                    {pings.length - 1} more ping{pings.length > 2 ? "s" : ""} waiting
                  </p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
