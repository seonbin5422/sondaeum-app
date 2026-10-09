import { caregiverName, findClient, historyOf } from "../_mock";
import type { Change, HistoryVisit } from "../_types";
import { CareSheet } from "./CareSheet";
import { PrintActions } from "./PrintActions";
import { SmallLinkButton } from "./ui";

// 서류 만들기 결과 화면. 요양보호사(C-20)와 보호자(G-03)가 같이 쓴다. 인쇄하면 A4로 버튼 없이 나온다.

const fmt = (iso: string) => iso.replaceAll("-", ".");
const md = (iso: string) => `${Number(iso.slice(5, 7))}/${Number(iso.slice(8))}`;

function visitsIn(clientId: string, from: string, to: string): HistoryVisit[] {
  return historyOf(clientId)
    .filter((v) => v.status === "SENT" && v.date >= from && v.date <= to)
    .sort((a, b) => a.date.localeCompare(b.date));
}

const SYM: Record<Change, { s: string; c: string }> = {
  improved: { s: "▲", c: "text-(--success)" },
  same: { s: "●", c: "text-muted" },
  worse: { s: "▼", c: "text-(--danger)" },
};

function Shell({ backHref, children, canShare }: { backHref: string; children: React.ReactNode; canShare: boolean }) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-5 p-4 pb-10 print:max-w-none print:p-0">
      <div className="print:hidden">
        <SmallLinkButton href={backHref}>← 뒤로</SmallLinkButton>
      </div>
      {children}
      <PrintActions canShare={canShare} />
    </main>
  );
}

// C-20 진료 참고용 요약 (와이어 305:38)
export function SummaryView({ clientId, from, to, backHref, role }: { clientId: string; from: string; to: string; backHref: string; role: "caregiver" | "guardian" }) {
  const c = findClient(clientId);
  const visits = visitsIn(clientId, from, to);
  const recent = visits.slice(-5);
  const worse = visits
    .flatMap((v) =>
      (
        [
          ["신체기능", v.record.change.physical],
          ["식사기능", v.record.change.meal],
          ["인지기능", v.record.change.cognitive],
        ] as const
      )
        .filter(([, x]) => x === "worse")
        .map(([k]) => ({ date: v.date, k })),
    )
    .reverse();
  const notes = visits.filter((v) => v.record.notes).reverse();

  return (
    <Shell backHref={backHref} canShare={role === "caregiver"}>
      <article className="flex flex-col gap-4 rounded-md border border-border bg-white p-4 print:border-0">
        <header className="flex flex-col gap-0.5">
          <h1 className="text-2xl font-bold">진료 참고용 기록 요약</h1>
          <p className="text-lg font-bold">
            {c?.name} 수급자 · {c?.age}세 · {c?.gender} · 장기요양 {c?.careGrade ?? "등급 미입력"}
          </p>
          <p className="text-base text-muted">
            {fmt(from)} ~ {fmt(to)} · 방문 {visits.length}번
          </p>
          {c?.medicationNotes && <p className="text-base text-muted">복용 중인 약: {c.medicationNotes}</p>}
        </header>

        <section className="flex flex-col gap-2 border-t border-(--line) pt-3">
          <h2 className="text-lg font-bold">1. 기간 중 달라진 점</h2>
          {worse.length === 0 && <p className="text-base text-muted">기간 중 나빠진 기록이 없어요.</p>}
          {worse.map((w) => (
            <p key={w.date + w.k} className="flex items-center gap-2 text-base font-bold">
              <span className="rounded-full bg-(--danger-soft) px-3 py-0.5 text-(--danger)">▼ 나빠졌어요</span>
              {Number(w.date.slice(5, 7))}월 {Number(w.date.slice(8))}일 · {w.k}
            </p>
          ))}
          {worse.length > 0 && <p className="text-base text-muted">그 밖의 방문은 비슷하거나 좋아졌어요.</p>}
        </section>

        <section className="flex flex-col gap-2 border-t border-(--line) pt-3">
          <h2 className="text-lg font-bold">2. 변화상태 추이</h2>
          <table className="w-full table-fixed text-center text-base">
            <thead className="bg-(--neutral-soft) text-muted">
              <tr>
                <th className="w-14" />
                {recent.map((v) => (
                  <th key={v.date} className="py-1">
                    {md(v.date)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(
                [
                  ["신체", "physical"],
                  ["식사", "meal"],
                  ["인지", "cognitive"],
                ] as const
              ).map(([l, k]) => (
                <tr key={k} className="border-t border-(--line)">
                  <th className="py-2 text-left font-bold">{l}</th>
                  {recent.map((v) => {
                    const x = v.record.change[k];
                    return (
                      <td key={v.date} className={`text-lg ${x ? SYM[x].c : "text-muted"}`}>
                        {x ? SYM[x].s : "-"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-sm text-muted">▲ 좋아졌어요 ● 비슷해요 ▼ 나빠졌어요 · 최근 방문 {recent.length}번</p>
        </section>

        <section className="flex flex-col gap-2 border-t border-(--line) pt-3">
          <h2 className="text-lg font-bold">3. 배변 변화 (실수 횟수)</h2>
          <table className="w-full table-fixed text-center text-base">
            <thead className="bg-(--neutral-soft) text-muted">
              <tr>
                <th className="w-14" />
                {recent.map((v) => (
                  <th key={v.date} className="py-1">
                    {md(v.date)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(
                [
                  ["대변", "stoolAccidents"],
                  ["소변", "urineAccidents"],
                ] as const
              ).map(([l, k]) => (
                <tr key={k} className="border-t border-(--line)">
                  <th className="py-2 text-left font-bold">{l}</th>
                  {recent.map((v) => {
                    const n = v.record.bowel[k];
                    return (
                      <td key={v.date} className={n ? "font-bold" : "text-muted"}>
                        {n ?? "-"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="flex flex-col gap-2 border-t border-(--line) pt-3">
          <h2 className="text-lg font-bold">4. 특이사항</h2>
          {notes.length === 0 && <p className="text-base text-muted">적힌 특이사항이 없어요.</p>}
          {notes.map((v) => (
            <div key={v.date}>
              <p className="text-base font-bold text-muted">
                {Number(v.date.slice(5, 7))}월 {Number(v.date.slice(8))}일
              </p>
              <p className="text-base">{v.record.notes}</p>
            </div>
          ))}
        </section>

        <section className="flex flex-col gap-1 border-t border-(--line) pt-3">
          <h2 className="text-lg font-bold">5. 기간 요약</h2>
          <p className="text-base">
            최근 1주 사이 식사량이 줄고 무릎 통증을 말씀하셨어요. 소변 실수가 10월에 늘었어요. 혈압은 128~142 사이였어요.
          </p>
          <p className="text-sm text-muted">AI가 위 기록을 모아 쓴 요약이에요.</p>
        </section>

        <footer className="rounded-md bg-(--neutral-soft) px-3 py-2 text-base text-muted">
          <p className="font-bold">요양보호사 관찰 기록이며 의료적 진단이 아닙니다.</p>
          <p>
            작성 {caregiverName} 요양보호사 · 작성일 {fmt("2026-10-09")}
          </p>
        </footer>
      </article>
    </Shell>
  );
}

// 급여제공기록지: 날짜마다 한 장 (결과 화면은 D-29 정할 것 ① 이후 다듬는다)
export function CareSheetView({ clientId, from, to, backHref, role }: { clientId: string; from: string; to: string; backHref: string; role: "caregiver" | "guardian" }) {
  const c = findClient(clientId);
  const visits = visitsIn(clientId, from, to);
  return (
    <Shell backHref={backHref} canShare={role === "caregiver"}>
      <header className="print:hidden">
        <h1 className="text-2xl font-bold">급여제공기록지</h1>
        <p className="text-base text-muted">
          {fmt(from)} ~ {fmt(to)} · {visits.length}장. 기관이 발급하는 공식 사본은 아니에요.
        </p>
      </header>
      {visits.map((v) => (
        <div key={v.date} className="print:break-after-page">
          <CareSheet
            record={v.record}
            date={`${fmt(v.date)}`}
            time={`${v.start}~${v.end}`}
            clientName={c?.name ?? ""}
            caregiverName={caregiverName}
          />
        </div>
      ))}
    </Shell>
  );
}
