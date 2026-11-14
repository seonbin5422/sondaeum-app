import { notFound } from "next/navigation";
// shortcut: 보호자 쪽은 대화방(DIF-5)의 입장 토큰이 생기기 전까지 임시 데이터를 쓴다
import { TODAY_ISO, caregiverName, chatTokenToClient, findClient, historyOf } from "../../../../_mock";
import { StatusChangeView } from "../../../../_components/DocumentViews";

export default async function GuardianStatusChangePage({ params, searchParams }: PageProps<"/v1120/c/[token]/documents/status-change">) {
  const { token } = await params;
  const { from, to } = await searchParams;
  const c = findClient(chatTokenToClient[token] ?? "");
  if (!c) notFound();
  return <StatusChangeView client={c} history={historyOf(c.id)} caregiverName={caregiverName} today={TODAY_ISO} from={String(from ?? "2026-10-01")} to={String(to ?? TODAY_ISO)} backHref={`/v1120/c/${token}/documents`} role="guardian" />;
}
