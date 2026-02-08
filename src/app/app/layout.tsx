import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";
import { AppAvailability } from "@/components/AppAvailability";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const leftNav = [
    { href: "/app", label: "Home" },
    { href: "/app/tasks", label: "My tasks" },
  ];
  const rightNav = [
    { href: "/app/logs", label: "Work logs" },
    { href: "/app/review", label: "Weekly review" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-purple-500/30 bg-black/90 backdrop-blur-md px-4 py-3">
        <nav className="flex items-center gap-1">
          {leftNav.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-300 transition-all hover:bg-purple-500/20 hover:text-purple-300 hover:border-purple-500/50 border border-transparent"
            >
              {label}
            </Link>
          ))}
        </nav>
        <Link
          href="/app"
          className="absolute left-1/2 -translate-x-1/2 font-press text-lg tracking-wider text-purple-500 hover:text-purple-400 transition-colors"
        >
          EXORA
        </Link>
        <nav className="relative flex items-center gap-1 flex-wrap">
          {session.role === "employee" && <AppAvailability />}
          {rightNav.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-300 transition-all hover:bg-purple-500/20 hover:text-purple-300 hover:border-purple-500/50 border border-transparent"
            >
              {label}
            </Link>
          ))}
          {session.role === "admin" && (
            <Link
              href="/admin"
              className="rounded-lg px-4 py-2 text-sm font-medium text-purple-400 hover:bg-purple-500/20 border border-purple-500/50"
            >
              Admin
            </Link>
          )}
          <LogoutButton className="rounded-lg px-4 py-2 text-sm text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-colors" />
        </nav>
      </header>
      <main className="flex-1 p-6 overflow-auto bg-black text-gray-100">{children}</main>
    </div>
  );
}
