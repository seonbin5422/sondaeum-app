import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { myVisit, requireCaregiver } from "../../../_data";
import { RecordScreen } from "./RecordScreen";

// C-12 기록 (와이어 263:86, 녹음 중 275:2)
export default async function RecordPage({ params }: PageProps<"/v1120/visit/[id]/record">) {
  const { id } = await params;
  const visit = await myVisit(id);
  if (!visit) notFound();
  if (visit.status === "SENT") redirect(`/v1120/visit/${id}/sent`);
  // 예시 내용 넣기는 체험 계정에만. 실제 기록에 예시를 모르고 보낼 수 있다
  const [{ isDemo }, previous] = await Promise.all([
    requireCaregiver(),
    prisma.visit.count({ where: { clientId: visit.client.id, status: "SENT", id: { not: visit.id } } }),
  ]);
  return <RecordScreen showSample={isDemo} hasPrevious={previous > 0} visitId={visit.id} clientName={visit.client.name} initialTranscript={visit.transcript} saved={visit.record} />;
}
