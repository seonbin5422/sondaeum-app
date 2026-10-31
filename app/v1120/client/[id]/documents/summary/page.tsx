import { notFound } from "next/navigation";
import { SummaryView } from "../../../../_components/DocumentViews";
import { kstYmd, kstYmdDaysAgo, myClient, myHistory, requireCaregiver } from "../../../../_data";
import { shareSummary } from "../../../../_actions";
import { NO_CONTACT } from "../../../../_types";

// C-20 서류 · 진료 참고용 요약
export default async function Page({ params, searchParams }: PageProps<"/v1120/client/[id]/documents/summary">) {
  const { id } = await params;
  const { from, to } = await searchParams;
  const c = await myClient(id);
  if (!c) notFound();
  const today = kstYmd();
  const monthAgo = kstYmdDaysAgo(30);
  const period = { from: String(from ?? monthAgo), to: String(to ?? today) };
  return (
    <SummaryView
      client={c}
      history={await myHistory(id)}
      caregiverName={(await requireCaregiver()).name}
      today={today}
      from={period.from}
      to={period.to}
      backHref={`/v1120/client/${id}/documents`}
      role="caregiver"
      share={c.guardianRelation === NO_CONTACT ? undefined : shareSummary.bind(null, id, period.from, period.to)}
    />
  );
}
