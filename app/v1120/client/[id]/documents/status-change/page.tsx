import { notFound } from "next/navigation";
import { StatusChangeView } from "../../../../_components/DocumentViews";
import { kstYmd, kstYmdDaysAgo, myClient, myHistory, requireCaregiver } from "../../../../_data";

// 서류 · 상태변화기록지 (D-61): 기간 중 평소와 달라진 날만
export default async function Page({ params, searchParams }: PageProps<"/v1120/client/[id]/documents/status-change">) {
  const { id } = await params;
  const { from, to } = await searchParams;
  const c = await myClient(id);
  if (!c) notFound();
  const today = kstYmd();
  return (
    <StatusChangeView
      client={c}
      history={await myHistory(id)}
      caregiverName={(await requireCaregiver()).name}
      today={today}
      from={String(from ?? kstYmdDaysAgo(7))}
      to={String(to ?? today)}
      backHref={`/v1120/client/${id}/documents`}
      role="caregiver"
    />
  );
}
