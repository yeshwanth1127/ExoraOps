import { prisma } from "./db";

const DAY_MS = 24 * 60 * 60 * 1000;

export function getWeekStart(date: Date, startWeekDay: number): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day - startWeekDay + 7) % 7;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function toDateOnly(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export async function getWeekDefinition() {
  const def = await prisma.weekDefinition.findFirst();
  return def ?? { startWeekDay: 1, commitmentDueDay: 1, reviewDueDay: 5 };
}

export async function getWeekStartForDate(date: Date): Promise<Date> {
  const def = await getWeekDefinition();
  return getWeekStart(date, def.startWeekDay);
}
