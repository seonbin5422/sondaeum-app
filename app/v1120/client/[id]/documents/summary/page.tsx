import { notFound } from "next/navigation";
import { SummaryView } from "../../../../_components/DocumentViews";
import { kstYmd, kstYmdDaysAgo, myClient, myHistory, requireCaregiver } from "../../../../_data";

// C-20 서류 · 진료 참고용 요약
export default async function Page({ params, searchParams }: PageProps<"/v1120/client/[id]/documents/summary">) {
  const { id } = await params;
  const { from, to } = await searchParams;
  const c = await myClient(id);
  if (!c) notFound();
  const today = kstYmd();
  const monthAgo = kstYmdDaysAgo(30);
  return (
    <SummaryView
      client={c}
      history={await myHistory(id)}
      caregiverName={(await requireCaregiver()).name}
      today={today}
      from={String(from ?? monthAgo)}
      to={String(to ?? today)}
      backHref={`/v1120/client/${id}/documents`}
      role="caregiver"
    />
  );
}
