import { notFound } from "next/navigation";
// shortcut: 보호자 쪽은 대화방(DIF-5)의 입장 토큰이 생기기 전까지 임시 데이터를 쓴다
import { caregiverName, chatTokenToClient, findClient, historyOf } from "../../../../_mock";
import { CareSheetView } from "../../../../_components/DocumentViews";

export default async function GuardianCareSheetPage({ params, searchParams }: PageProps<"/v1120/c/[token]/documents/care-sheet">) {
  const { token } = await params;
  const { from, to } = await searchParams;
  const c = findClient(chatTokenToClient[token] ?? "");
  if (!c) notFound();
  return <CareSheetView client={c} history={historyOf(c.id)} caregiverName={caregiverName} from={String(from ?? "2026-10-08")} to={String(to ?? "2026-10-08")} backHref={`/v1120/c/${token}/documents`} role="guardian" />;
}
