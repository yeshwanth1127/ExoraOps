"use client";

type Log = {
  id: string;
  date: Date;
  description: string;
  workType: { name: string };
  proofItems: { url: string; caption: string | null; proofType: { name: string } }[];
};

export function LogsList({ initial }: { initial: Log[] }) {
  return (
    <div className="mt-8">
      <h2 className="font-medium text-gray-100">Recent logs</h2>
      <ul className="mt-2 space-y-3">
        {initial.map((log) => (
          <li key={log.id} className="rounded-md border border-purple-900/50 bg-gray-900/80 p-4">
            <p className="text-sm text-gray-500">
              {new Date(log.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
              {" · "}
              {log.workType.name}
            </p>
            <p className="mt-1 text-gray-100">{log.description}</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {log.proofItems.map((p, i) => (
                <li key={i} className="text-sm">
                  <a
                    href={p.url.startsWith("http") ? p.url : undefined}
                    target={p.url.startsWith("http") ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    className="text-purple-600 hover:underline"
                  >
                    {p.proofType.name}
                    {p.caption ? `: ${p.caption}` : ""}
                  </a>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      {initial.length === 0 && (
        <p className="mt-4 text-sm text-gray-500">No work logs yet.</p>
      )}
    </div>
  );
}
