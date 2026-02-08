import { prisma } from "./db";
import type { User, AvailabilitySession, AvailabilityWindow, AvailabilityState } from "@prisma/client";

// Config (server-only; user never sees these values)
const BASE_WINDOW_MINUTES_MIN = 45;
const BASE_WINDOW_MINUTES_MAX = 150;
const SOFT_AWAY_MINUTES_MIN = 10;
const SOFT_AWAY_MINUTES_MAX = 25;
const SLA_MINUTES_MIN = 15;
const SLA_MINUTES_MAX = 40;
const GRACE_PERIOD_MINUTES = 15;
const WEAK_ACTIVITY_THROTTLE_MINUTES = 10;

export type UserWithWorkWindow = Pick<
  User,
  "id" | "workStartTime" | "workEndTime" | "timezone" | "availabilityReliabilityScore"
>;

/** Current time in user's timezone as "HH:mm" */
function nowInTimezone(timezone: string): string {
  const s = new Date().toLocaleString("en-CA", { timeZone: timezone || "UTC", hour12: false });
  const match = s.match(/(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : "00:00";
}

/** Parse "HH:mm" to minutes since midnight for comparison */
function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/** True if current time (in user TZ) is within workStartTime..workEndTime. If no window set, returns true so Start work is visible. */
export function isInsideWorkWindow(user: UserWithWorkWindow | null): boolean {
  if (!user) return false;
  if (!user.workStartTime || !user.workEndTime) return true;
  const tz = user.timezone || "UTC";
  const now = nowInTimezone(tz);
  const start = toMinutes(user.workStartTime);
  const end = toMinutes(user.workEndTime);
  const current = toMinutes(now);
  if (start <= end) return current >= start && current < end;
  return current >= start || current < end; // overnight window
}

/** Dynamic availability window length in minutes (45-150, adjusted by reliability) */
export function getDynamicWindowMinutes(score: number): number {
  const clamped = Math.max(0, Math.min(1, score));
  const range = BASE_WINDOW_MINUTES_MAX - BASE_WINDOW_MINUTES_MIN;
  return Math.round(BASE_WINDOW_MINUTES_MIN + range * clamped);
}

/** Soft-Away duration in minutes (10-25 randomized) */
export function getSoftAwayMinutes(): number {
  return (
    SOFT_AWAY_MINUTES_MIN +
    Math.floor(Math.random() * (SOFT_AWAY_MINUTES_MAX - SOFT_AWAY_MINUTES_MIN + 1))
  );
}

/** SLA for a ping in minutes (15-40, stricter for low reliability) */
export function getSlaMinutes(score: number): number {
  const clamped = Math.max(0, Math.min(1, score));
  const range = SLA_MINUTES_MAX - SLA_MINUTES_MIN;
  return Math.round(SLA_MINUTES_MIN + range * clamped);
}

/** Was Start Work after grace period? (e.g. 15 min after work start) */
export function isLateStart(user: UserWithWorkWindow, startedAt: Date): boolean {
  if (!user?.workStartTime || !user?.timezone) return false;
  const tz = user.timezone || "UTC";
  const startedStr = startedAt.toLocaleString("en-CA", { timeZone: tz, hour12: false });
  const match = startedStr.match(/(\d{2}):(\d{2})/);
  if (!match) return false;
  const startedMins = toMinutes(`${match[1]}:${match[2]}`);
  const workStartMins = toMinutes(user.workStartTime);
  return startedMins > workStartMins + GRACE_PERIOD_MINUTES;
}

/** Get today's date in user timezone as Date at UTC noon (safe for Prisma @db.Date) */
export function todayInTimezone(timezone: string): Date {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone || "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(now);
  const year = parts.find((p) => p.type === "year")?.value ?? "1970";
  const month = parts.find((p) => p.type === "month")?.value ?? "01";
  const day = parts.find((p) => p.type === "day")?.value ?? "01";
  const dateStr = `${year}-${month}-${day}`;
  return new Date(dateStr + "T12:00:00.000Z");
}

/** Compute current availability state from session + latest window/events (on-read). */
export function computeStateFromSession(
  session: AvailabilitySession & { windows: AvailabilityWindow[] } | null,
  now: Date
): AvailabilityState | null {
  if (!session) return null;
  const state = session.lastState;
  const stateAt = session.lastStateAt;
  if (!state || !stateAt) return "available"; // default for started session

  const windows = session.windows;
  const currentWindow = windows
    .slice()
    .sort((a, b) => b.endsAt.getTime() - a.endsAt.getTime())[0];
  if (!currentWindow) return state;

  if (state === "available" && now > currentWindow.endsAt) return "soft_away";
  return state;
}

/** Get current state for user (either from session or null if outside work / no session). */
export async function getCurrentAvailabilityState(
  userId: string
): Promise<{ state: AvailabilityState | null; sessionId: string | null; lastSeenAt: Date | null }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      workStartTime: true,
      workEndTime: true,
      timezone: true,
      lastSeenAt: true,
    },
  });
  if (!user) return { state: null, sessionId: null, lastSeenAt: null };
  const tz = user.timezone || "UTC";
  const today = todayInTimezone(tz);
  const session = await prisma.availabilitySession.findUnique({
    where: { userId_date: { userId, date: today } },
    include: { windows: { orderBy: { endsAt: "desc" }, take: 1 } },
  });
  const now = new Date();
  if (!session) return { state: null, sessionId: null, lastSeenAt: user.lastSeenAt };
  const state = session.lastState ?? "available";
  const latestWindow = session.windows[0];
  let effective: AvailabilityState = state;
  if (latestWindow && now > latestWindow.endsAt) {
    if (state === "available") effective = "soft_away";
    else if (state === "soft_away") effective = "away";
  }
  return {
    state: effective,
    sessionId: session.id,
    lastSeenAt: user.lastSeenAt,
  };
}

/** Record strong activity: create event and new availability window for today's session. */
export async function recordStrongActivity(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { timezone: true, availabilityReliabilityScore: true },
  });
  if (!user) return;
  const tz = user.timezone || "UTC";
  const today = todayInTimezone(tz);
  const session = await prisma.availabilitySession.findUnique({
    where: { userId_date: { userId, date: today } },
  });
  if (!session) return;
  const now = new Date();
  await prisma.$transaction([
    prisma.availabilityEvent.create({
      data: { userId, sessionId: session.id, type: "strong_activity" },
    }),
    prisma.availabilityWindow.create({
      data: {
        sessionId: session.id,
        startsAt: now,
        endsAt: new Date(now.getTime() + getDynamicWindowMinutes(user.availabilityReliabilityScore) * 60 * 1000),
      },
    }),
    prisma.availabilitySession.update({
      where: { id: session.id },
      data: { lastState: "available", lastStateAt: now },
    }),
  ]);
}

/** Record weak activity (throttled). Returns true if recorded, false if throttled. */
export async function recordWeakActivity(userId: string): Promise<boolean> {
  const lastWeak = await prisma.availabilityEvent.findFirst({
    where: { userId, type: "weak_activity" },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  if (lastWeak && Date.now() - lastWeak.createdAt.getTime() < WEAK_ACTIVITY_THROTTLE_MINUTES * 60 * 1000) {
    return false;
  }
  const tz = (await prisma.user.findUnique({ where: { id: userId }, select: { timezone: true } }))?.timezone || "UTC";
  const today = todayInTimezone(tz);
  const session = await prisma.availabilitySession.findUnique({
    where: { userId_date: { userId, date: today } },
  });
  if (!session) return false;
  await prisma.availabilityEvent.create({
    data: { userId, sessionId: session.id, type: "weak_activity" },
  });
  // Partial extension: extend current window by a short amount (e.g. 5 min) if in soft_away
  const latestWindow = await prisma.availabilityWindow.findFirst({
    where: { sessionId: session.id },
    orderBy: { endsAt: "desc" },
  });
  if (latestWindow && session.lastState === "soft_away") {
    const extendBy = 5;
    await prisma.availabilityWindow.update({
      where: { id: latestWindow.id },
      data: { endsAt: new Date(latestWindow.endsAt.getTime() + extendBy * 60 * 1000) },
    });
  }
  return true;
}

export {
  GRACE_PERIOD_MINUTES,
  WEAK_ACTIVITY_THROTTLE_MINUTES,
};
