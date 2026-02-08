"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type WorkType = { id: string; name: string };
type ProofType = { id: string; name: string };

type ProofEntry = { proofTypeId: string; url: string; caption: string; file?: File };

export function NewLogForm({
  workTypes,
  proofTypes,
}: {
  workTypes: WorkType[];
  proofTypes: ProofType[];
}) {
  const router = useRouter();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [workTypeId, setWorkTypeId] = useState(workTypes[0]?.id ?? "");
  const [description, setDescription] = useState("");
  const [proofs, setProofs] = useState<ProofEntry[]>([
    { proofTypeId: proofTypes[0]?.id ?? "", url: "", caption: "" },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addProof() {
    setProofs((prev) => [...prev, { proofTypeId: proofTypes[0]?.id ?? "", url: "", caption: "" }]);
  }

  function removeProof(i: number) {
    setProofs((prev) => prev.filter((_, idx) => idx !== i));
  }

  function setProof(i: number, upd: Partial<ProofEntry>) {
    setProofs((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...upd } : p)));
  }

  async function uploadFile(file: File): Promise<string> {
    const form = new FormData();
    form.set("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: form });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Upload failed");
    }
    const data = await res.json();
    return data.url;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const validProofs = proofs.filter((p) => p.url.trim() || p.file);
    if (validProofs.length === 0) {
      setError("At least one proof is required (upload a file or enter a URL).");
      return;
    }
    setSaving(true);
    try {
      const proofItems: { proofTypeId: string; url: string; caption: string | null }[] = [];
      for (const p of validProofs) {
        let url = p.url.trim();
        if (p.file) {
          url = await uploadFile(p.file);
        } else if (url && !url.startsWith("http") && !url.startsWith("/")) {
          url = "https://" + url;
        }
        proofItems.push({
          proofTypeId: p.proofTypeId,
          url,
          caption: p.caption.trim() || null,
        });
      }
      const res = await fetch("/api/work-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          workTypeId,
          description: description.trim(),
          proofItems,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to save");
        return;
      }
      setDescription("");
      setProofs([{ proofTypeId: proofTypes[0]?.id ?? "", url: "", caption: "" }]);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-lg border border-purple-900/50 bg-gray-900/80 p-4">
      <h2 className="font-medium text-gray-100">New work log</h2>
      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700">Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className="mt-1 block w-40 rounded-md border border-purple-900/60 bg-black/30 text-gray-100 px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Work type</label>
        <select
          value={workTypeId}
          onChange={(e) => setWorkTypeId(e.target.value)}
          required
          className="mt-1 block w-48 rounded-md border border-purple-900/60 bg-black/30 text-gray-100 px-3 py-2"
        >
          {workTypes.map((w) => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">What moved forward? (2–3 lines)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          maxLength={2000}
          rows={3}
          className="mt-1 block w-full max-w-xl rounded-md border border-purple-900/60 bg-black/30 text-gray-100 px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Proof (at least one)</label>
        {proofs.map((p, i) => (
          <div key={i} className="mt-2 flex flex-wrap items-end gap-2 rounded border border-gray-100 p-2">
            <select
              value={p.proofTypeId}
              onChange={(e) => setProof(i, { proofTypeId: e.target.value })}
              className="rounded-md border border-purple-900/60 bg-black/30 text-gray-100 px-2 py-1 text-sm"
            >
              {proofTypes.map((pt) => (
                <option key={pt.id} value={pt.id}>{pt.name}</option>
              ))}
            </select>
            <input
              type="file"
              accept="image/*,video/*,.pdf,.doc,.docx"
              onChange={(e) => setProof(i, { file: e.target.files?.[0], url: "" })}
              className="text-sm"
            />
            <span className="text-gray-400">or URL</span>
            <input
              type="text"
              value={p.url}
              onChange={(e) => setProof(i, { url: e.target.value })}
              placeholder="https://… or /uploads/…"
              className="min-w-[200px] rounded-md border border-purple-900/60 bg-black/30 text-gray-100 px-2 py-1 text-sm"
            />
            <input
              type="text"
              value={p.caption}
              onChange={(e) => setProof(i, { caption: e.target.value })}
              placeholder="Caption (optional)"
              className="min-w-[120px] rounded-md border border-purple-900/60 bg-black/30 text-gray-100 px-2 py-1 text-sm"
            />
            {proofs.length > 1 && (
              <button type="button" onClick={() => removeProof(i)} className="text-sm text-red-600 hover:underline">
                Remove
              </button>
            )}
          </div>
        ))}
        <button type="button" onClick={addProof} className="mt-2 text-sm text-purple-600 hover:underline">
          + Add proof
        </button>
      </div>
      <button
        type="submit"
        disabled={saving}
        className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save log"}
      </button>
    </form>
  );
}
