import { notFound } from "next/navigation";
import { findClient, historyOf } from "../../../_mock";
import { DocumentPicker } from "../../../_components/DocumentPicker";
import { Screen, TopBar } from "../../../_components/ui";

// C-19 서류 만들기 (D-29 초안)
export default async function DocumentsPage({ params }: PageProps<"/v1120/client/[id]/documents">) {
  const { id } = await params;
  const c = findClient(id);
  if (!c) notFound();
  const sent = historyOf(id).filter((v) => v.status === "SENT").map((v) => v.date);
  return (
    <Screen>
      <TopBar backHref={`/v1120/client/${id}`} />
      <header>
        <p className="text-lg text-muted">{c.name} 수급자</p>
        <h1 className="text-2xl font-bold">서류 만들기</h1>
      </header>
      <div className="flex flex-col gap-1 rounded-xl bg-accent-soft px-4 py-3 text-base text-accent-soft-foreground">
        <p className="font-bold">요양보호사가 보낸 기록으로 만들어요</p>
        <p>진단서나 기관이 발급하는 공식 사본은 아니에요.</p>
      </div>
      <DocumentPicker basePath={`/v1120/client/${id}/documents`} sentDates={sent} />
    </Screen>
  );
}
