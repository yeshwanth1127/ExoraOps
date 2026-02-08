"use client";

import { useState, useEffect } from "react";

export function WelcomeWithOnline({ name }: { name: string }) {
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/app/availability/state")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => setAvailable(data?.state === "available"))
      .catch(() => setAvailable(null));
  }, []);

  return (
    <h1 className="text-2xl font-bold tracking-tight text-gray-100 md:text-3xl">
      Welcome,{" "}
      <span className="inline-flex items-center gap-2">
        {available === true && (
          <span
            className="inline-block h-3 w-3 shrink-0 rounded-full bg-green-500 ring-2 ring-green-400/50"
            title="You are connected and available"
          />
        )}
        <span className="text-purple-400">{name}</span>
      </span>
    </h1>
  );
}
