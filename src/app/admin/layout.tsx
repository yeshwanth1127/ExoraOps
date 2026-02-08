import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/login");
  }

  const leftNav = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/tasks", label: "Tasks" },
  ];
  const rightNav = [
    { href: "/admin/employees", label: "Employees" },
    { href: "/admin/config", label: "Config" },
  ];
  const moreNav = [
    { href: "/admin/teams", label: "Teams" },
    { href: "/admin/commitments", label: "Commitments" },
    { href: "/admin/logs", label: "Work logs" },
    { href: "/admin/reviews", label: "Reviews" },
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
          href="/admin"
          className="absolute left-1/2 -translate-x-1/2 font-press text-sm tracking-wider text-purple-500 hover:text-purple-400 transition-colors"
        >
          EXORA ADMIN
        </Link>
        <nav className="flex items-center gap-1">
          {rightNav.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-300 transition-all hover:bg-purple-500/20 hover:text-purple-300 hover:border-purple-500/50 border border-transparent"
            >
              {label}
            </Link>
          ))}
          <div className="relative group">
            <button
              type="button"
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-300 transition-all hover:bg-purple-500/20 hover:text-purple-300 border border-transparent hover:border-purple-500/50"
            >
              More ▼
            </button>
            <div className="absolute right-0 top-full mt-1 hidden min-w-[160px] group-hover:block rounded-lg border border-purple-500/30 bg-black/95 py-1 shadow-xl backdrop-blur-md">
              {moreNav.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="block px-4 py-2 text-sm text-gray-300 hover:bg-purple-500/20 hover:text-purple-300"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
          <LogoutButton className="rounded-lg px-4 py-2 text-sm text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-colors" />
        </nav>
      </header>
      <main className="flex-1 p-6 overflow-auto bg-black text-gray-100">{children}</main>
    </div>
  );
}
