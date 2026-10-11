import { notFound, redirect } from "next/navigation";
import { myVisit } from "../../../_data";
import { ReviewScreen } from "./ReviewScreen";

// C-14 기록 확인 (와이어 263:171). 정리된 기록을 DB에서 읽어 화면에 넘긴다.
export default async function ReviewPage({ params }: PageProps<"/v1120/visit/[id]/review">) {
  const { id } = await params;
  const v = await myVisit(id);
  if (!v) notFound();
  if (v.status === "SENT") redirect(`/v1120/visit/${id}/sent`);
  if (!v.record) redirect(`/v1120/visit/${id}/processing`);
  return (
    <ReviewScreen
      id={id}
      initialRecord={v.record}
      said={v.quotes}
      transcript={v.transcript}
      visitTime={v.time}
      clientName={v.client.name}
      caregiverName={v.caregiverName}
    />
  );
}
