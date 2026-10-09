import Link from "next/link";
import { chatByClient } from "../_mock";

// 보고서 모아보기 (D-25): 대화방에 올라온 방문 보고서·서류를 날짜별로. 요양보호사·보호자 같이 쓴다.
export function ReportArchive({ clientId }: { clientId: string }) {
  const reports = (chatByClient[clientId] ?? []).filter((m) => m.report).reverse();
  return (
    <ul className="flex flex-col divide-y divide-(--line) rounded-[15px] border border-(--line)">
      {reports.length === 0 && <li className="p-4 text-lg text-muted">아직 올라온 보고서가 없어요.</li>}
      {reports.map((m) => (
        <li key={m.id}>
          <Link href={`/v1120/g/${m.report!.visitId}`} className="flex min-h-16 items-center justify-between px-4 py-2">
            <span className="flex flex-col">
              <span className="text-lg font-bold">{m.report!.title}</span>
              <span className="text-base text-muted">방문 보고서</span>
            </span>
            <span className="text-xl text-muted" aria-hidden>
              ›
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
