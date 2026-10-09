import Link from "next/link";
import { notFound } from "next/navigation";
import { chatTokenToClient, findClient } from "../../../_mock";
import { ReportArchive } from "../../../_components/ReportArchive";

// 보고서 모아보기 (보호자, D-25)
export default async function GuardianReportsPage({ params }: PageProps<"/v1120/c/[token]/reports">) {
  const { token } = await params;
  const c = findClient(chatTokenToClient[token] ?? "");
  if (!c) notFound();
  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-5 p-6">
      <Link href={`/v1120/c/${token}`} className="inline-flex min-h-12 w-fit items-center rounded-xl border border-border px-4 text-base font-bold">
        ← 대화방으로
      </Link>
      <h1 className="text-2xl font-bold">{c.name} 어르신 보고서 모아보기</h1>
      <ReportArchive clientId={c.id} />
    </main>
  );
}
