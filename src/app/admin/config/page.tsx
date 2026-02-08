import { prisma } from "@/lib/db";
import { WeekDefinitionForm } from "./WeekDefinitionForm";
import { WorkModesSection } from "./WorkModesSection";
import { ProofTypesSection } from "./ProofTypesSection";

export default async function ConfigPage() {
  const [workModes, proofTypes, weekDef] = await Promise.all([
    prisma.workMode.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.proofType.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.weekDefinition.findFirst(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-100">Configuration</h1>
      <p className="mt-1 text-gray-400">Work types, proof types, and week definition.</p>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-gray-100">Week definition</h2>
        <p className="text-sm text-gray-400">Which day the week starts and when commitment/review are due.</p>
        <WeekDefinitionForm initial={weekDef} />
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-gray-100">Work types</h2>
        <p className="text-sm text-gray-400">Used for user work mode and for work log type (Remote, Onsite, Field, etc.).</p>
        <WorkModesSection initial={workModes} />
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-gray-100">Proof types</h2>
        <p className="text-sm text-gray-400">Allowed proof types for work logs (Photo, Video, Document, etc.).</p>
        <ProofTypesSection initial={proofTypes} />
      </section>
    </div>
  );
}
