import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    redirect(session.role === "admin" ? "/admin" : "/app");
  }
  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-black">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="font-press text-2xl font-bold text-purple-500">Exora</h1>
          <p className="mt-1 text-sm text-gray-400">Work accountability</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
