import { SummaryView } from "../../../../_components/DocumentViews";

// C-20 서류 · 진료 참고용 요약
export default async function SummaryPage({ params, searchParams }: PageProps<"/v1120/client/[id]/documents/summary">) {
  const { id } = await params;
  const { from, to } = await searchParams;
  return <SummaryView clientId={id} from={String(from ?? "2026-09-09")} to={String(to ?? "2026-10-09")} backHref={`/v1120/client/${id}/documents`} role="caregiver" />;
}
