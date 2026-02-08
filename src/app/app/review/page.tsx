import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getWeekStartForDate } from "@/lib/week";
import { prisma } from "@/lib/db";
import { ReviewForm } from "./ReviewForm";

export default async function ReviewPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const weekStart = await getWeekStartForDate(new Date());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const [commitment, review, logCount] = await Promise.all([
    prisma.weeklyCommitment.findUnique({
      where: { userId_weekStartDate: { userId: session.id, weekStartDate: weekStart } },
    }),
    prisma.weeklyReview.findUnique({
      where: { userId_weekStartDate: { userId: session.id, weekStartDate: weekStart } },
    }),
    prisma.workLog.count({
      where: {
        userId: session.id,
        date: { gte: weekStart, lte: weekEnd },
      },
    }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-100">Weekly review</h1>
      <p className="mt-1 text-gray-400">
        Week of {weekStart.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} – {weekEnd.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
      </p>
      <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <p className="text-sm font-medium text-gray-700">Your commitment this week</p>
        <p className="mt-1 text-gray-100">{commitment?.successStatement ?? "—"}</p>
        <p className="mt-2 text-sm text-gray-400">Work logs this week: {logCount}</p>
      </div>
      <ReviewForm
        weekStartDate={weekStart.toISOString().slice(0, 10)}
        initialAchieved={review?.commitmentAchieved}
        initialReason={review?.reasonIfNo ?? ""}
      />
    </div>
  );
}
