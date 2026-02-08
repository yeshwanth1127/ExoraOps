import { prisma } from "@/lib/db";
import { getWeekStartForDate } from "@/lib/week";
import { AdminReviewsList } from "./AdminReviewsList";

export default async function AdminReviewsPage() {
  const weekStart = await getWeekStartForDate(new Date());
  const reviews = await prisma.weeklyReview.findMany({
    where: { weekStartDate: weekStart },
    include: { user: { select: { id: true, name: true, email: true, team: { select: { name: true } } } } },
    orderBy: { submittedAt: "asc" },
  });
  const totalEmployees = await prisma.user.count({ where: { role: "employee", active: true } });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-100">Weekly reviews</h1>
      <p className="mt-1 text-gray-500">
        Week of {weekStart.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
      </p>
      <p className="mt-2 text-sm text-gray-600">
        {reviews.length} of {totalEmployees} employees submitted
      </p>
      <AdminReviewsList
        weekStartDate={weekStart.toISOString().slice(0, 10)}
        initial={reviews}
      />
    </div>
  );
}
