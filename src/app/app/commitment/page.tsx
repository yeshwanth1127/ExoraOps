import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getWeekStartForDate } from "@/lib/week";
import { CommitmentForm } from "./CommitmentForm";
import { prisma } from "@/lib/db";

export default async function CommitmentPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const weekStart = await getWeekStartForDate(new Date());
  const commitment = await prisma.weeklyCommitment.findUnique({
    where: {
      userId_weekStartDate: { userId: session.id, weekStartDate: weekStart },
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Weekly commitment</h1>
      <p className="mt-1 text-gray-500">
        Week of {weekStart.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}. One sentence: what does success mean this week?
      </p>
      <CommitmentForm initial={commitment?.successStatement ?? ""} weekStartDate={weekStart.toISOString().slice(0, 10)} />
    </div>
  );
}
