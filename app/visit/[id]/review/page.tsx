import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { safeDecryptText } from "@/lib/crypto";
import { ReviewForm } from "./ReviewForm";

export const dynamic = "force-dynamic";

export default async function ReviewPage({ params }: PageProps<"/visit/[id]/review">) {
  const { id } = await params;
  const visit = await prisma.visit.findUnique({
    where: { id },
    include: { report: true },
  });

  if (!visit) notFound();
  if (visit.status === "SENT") redirect(`/visit/${id}/sent`);
  if (!visit.report) redirect(`/visit/${id}/record`);

  let mealsMissing = false;
  let medicationMissing = false;
  let notesMissing = false;
  let healthStatusMissing = false;
  let bloodPressureMissing = false;
  let urinationMissing = false;
  let defecationMissing = false;
  if (visit.report.aiRawJson) {
    try {
      const flags = JSON.parse(safeDecryptText(visit.report.aiRawJson));
      mealsMissing = Boolean(flags.mealsMissing);
      medicationMissing = Boolean(flags.medicationMissing);
      notesMissing = Boolean(flags.notesMissing);
      healthStatusMissing = Boolean(flags.healthStatusMissing);
      bloodPressureMissing = Boolean(flags.bloodPressureMissing);
      urinationMissing = Boolean(flags.urinationMissing);
      defecationMissing = Boolean(flags.defecationMissing);
    } catch {
      // 이전 형식이거나 파싱 실패 시 경고 없이 진행
    }
  }

  return (
    <ReviewForm
      visitId={visit.id}
      reportId={visit.report.id}
      transcript={visit.transcript ? safeDecryptText(visit.transcript) : ""}
      initialMeals={safeDecryptText(visit.report.meals)}
      initialMedication={safeDecryptText(visit.report.medication)}
      initialNotes={safeDecryptText(visit.report.notes)}
      initialMealsMissing={mealsMissing}
      initialMedicationMissing={medicationMissing}
      initialNotesMissing={notesMissing}
      initialHealthStatusMissing={healthStatusMissing}
      initialBloodPressureMissing={bloodPressureMissing}
      initialUrinationMissing={urinationMissing}
      initialDefecationMissing={defecationMissing}
      initialMedicationMorning={visit.report.medicationMorning}
      initialMedicationLunch={visit.report.medicationLunch}
      initialMedicationEvening={visit.report.medicationEvening}
      initialMedicationBedtime={visit.report.medicationBedtime}
      initialMedicationNone={visit.report.medicationNone}
    />
  );
}
