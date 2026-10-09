import { notFound } from "next/navigation";
import { findClient } from "../../../_mock";
import { ReportArchive } from "../../../_components/ReportArchive";
import { Screen, TopBar } from "../../../_components/ui";

// 보고서 모아보기 (요양보호사)
export default async function ReportsPage({ params }: PageProps<"/v1120/chats/[clientId]/reports">) {
  const { clientId } = await params;
  const c = findClient(clientId);
  if (!c) notFound();
  return (
    <Screen>
      <TopBar backHref={`/v1120/chats/${clientId}`} title="보고서 모아보기" />
      <ReportArchive clientId={clientId} />
    </Screen>
  );
}
