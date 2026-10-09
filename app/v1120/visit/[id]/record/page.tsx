import { notFound } from "next/navigation";
import { findVisit } from "../../../_mock";
import { RecordScreen } from "./RecordScreen";

// C-12 기록 (와이어 263:86, 녹음 중 275:2)
export default async function RecordPage({ params }: PageProps<"/v1120/visit/[id]/record">) {
  const { id } = await params;
  const visit = findVisit(id);
  if (!visit) notFound();
  return <RecordScreen visitId={visit.visitId} clientName={visit.clientName} />;
}
