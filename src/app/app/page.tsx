import { getSession } from "@/lib/auth";
import Link from "next/link";
import { AppHomeAvailability } from "@/components/AppHomeAvailability";
import { WelcomeWithOnline } from "@/components/WelcomeWithOnline";

export default async function AppHomePage() {
  const session = await getSession();

  const modules = [
    { href: "/app/tasks", title: "My tasks", description: "Tasks and subtasks assigned to you" },
    { href: "/app/logs", title: "Work logs", description: "Log work events with proof" },
    { href: "/app/review", title: "Weekly review", description: "Was your commitment achieved?" },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-12 text-center">
        {session?.role === "employee" && session?.name ? (
          <WelcomeWithOnline name={session.name} />
        ) : (
          <h1 className="text-2xl font-bold tracking-tight text-gray-100 md:text-3xl">
            Welcome, <span className="text-purple-400">{session?.name}</span>
          </h1>
        )}
        <p className="mt-2 text-gray-400">Select a module below</p>
      </div>

      {session?.role === "employee" && <AppHomeAvailability />}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {modules.map((mod, i) => (
          <Link
            key={mod.href}
            href={mod.href}
            className="group flex aspect-square flex-col items-center justify-center rounded-lg border-2 border-purple-500/50 bg-gray-900/80 p-6 transition-all hover:border-purple-400 hover:shadow-[0_0_30px_-5px_rgba(168,85,247,0.5)]"
          >
            <span className="text-3xl font-bold text-purple-500 group-hover:text-purple-400">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="mt-3 text-center text-sm font-medium text-gray-200 group-hover:text-purple-300">
              {mod.title}
            </span>
            <p className="mt-2 text-center text-xs text-gray-400">{mod.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
