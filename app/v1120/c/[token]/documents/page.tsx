import Link from "next/link";
import { notFound } from "next/navigation";
import { chatTokenToClient, findClient, historyOf } from "../../../_mock";
import { DocumentPicker } from "../../../_components/DocumentPicker";

// G-03 서류 만들기 (보호자, D-26). C-19와 같은 화면.
export default async function GuardianDocumentsPage({ params }: PageProps<"/v1120/c/[token]/documents">) {
  const { token } = await params;
  const c = findClient(chatTokenToClient[token] ?? "");
  if (!c) notFound();
  const sent = historyOf(c.id).filter((v) => v.status === "SENT").map((v) => v.date);
  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-5 p-6">
      <Link href={`/v1120/c/${token}`} className="inline-flex min-h-12 w-fit items-center rounded-xl border border-border px-4 text-base font-bold">
        ← 대화방으로
      </Link>
      <header>
        <p className="text-lg text-muted">{c.name} 어르신</p>
        <h1 className="text-2xl font-bold">서류 만들기</h1>
      </header>
      <div className="flex flex-col gap-1 rounded-xl bg-accent-soft px-4 py-3 text-base text-accent-soft-foreground">
        <p className="font-bold">요양보호사가 보낸 기록으로 만들어요</p>
        <p>진단서나 기관이 발급하는 공식 사본은 아니에요. 병원·기관에는 보호자님이 직접 내 주세요.</p>
      </div>
      <DocumentPicker basePath={`/v1120/c/${token}/documents`} sentDates={sent} />
    </main>
  );
}
