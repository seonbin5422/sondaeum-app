import { notFound, redirect } from "next/navigation";
import { myVisit } from "../../../_data";
import { RecordScreen } from "./RecordScreen";

// C-12 기록 (와이어 263:86, 녹음 중 275:2)
export default async function RecordPage({ params }: PageProps<"/v1120/visit/[id]/record">) {
  const { id } = await params;
  const visit = await myVisit(id);
  if (!visit) notFound();
  if (visit.status === "SENT") redirect(`/v1120/visit/${id}/sent`);
  return <RecordScreen visitId={visit.id} clientName={visit.client.name} initialTranscript={visit.transcript} saved={visit.record} edited={visit.edited} />;
}
