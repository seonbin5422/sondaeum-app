import { notFound } from "next/navigation";
import { chatTokenToClient } from "../../../../_mock";
import { SummaryView } from "../../../../_components/DocumentViews";

export default async function GuardianSummaryPage({ params, searchParams }: PageProps<"/v1120/c/[token]/documents/summary">) {
  const { token } = await params;
  const { from, to } = await searchParams;
  const clientId = chatTokenToClient[token];
  if (!clientId) notFound();
  return <SummaryView clientId={clientId} from={String(from ?? "2026-09-09")} to={String(to ?? "2026-10-09")} backHref={`/v1120/c/${token}/documents`} role="guardian" />;
}
