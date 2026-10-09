import { notFound } from "next/navigation";
import { chatTokenToClient } from "../../../../_mock";
import { CareSheetView } from "../../../../_components/DocumentViews";

export default async function GuardianCareSheetPage({ params, searchParams }: PageProps<"/v1120/c/[token]/documents/care-sheet">) {
  const { token } = await params;
  const { from, to } = await searchParams;
  const clientId = chatTokenToClient[token];
  if (!clientId) notFound();
  return <CareSheetView clientId={clientId} from={String(from ?? "2026-10-08")} to={String(to ?? "2026-10-08")} backHref={`/v1120/c/${token}/documents`} role="guardian" />;
}
