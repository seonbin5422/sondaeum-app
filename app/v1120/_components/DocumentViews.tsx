import type { Change, ClientProfile, HistoryVisit } from "../_types";
import { CareSheet } from "./CareSheet";
import { PrintActions } from "./PrintActions";
import { Card, TopBar, TOP_BACK } from "./ui";
import { BackButton } from "./BackButton";

// 서류 만들기 결과 화면. 요양보호사(C-20)와 보호자(G-03)가 같이 쓴다. 인쇄하면 A4로 버튼 없이 나온다.

const fmt = (iso: string) => iso.replaceAll("-", ".");
const WD = "일월화수목금토";
// 2026.10.28 (수)
const fmtDay = (iso: string) => `${fmt(iso)} (${WD[new Date(`${iso}T12:00:00+09:00`).getUTCDay()]})`;
const md = (iso: string) => `${Number(iso.slice(5, 7))}/${Number(iso.slice(8))}`;

function visitsIn(history: HistoryVisit[], from: string, to: string): HistoryVisit[] {
  return history
    .filter((v) => v.status === "SENT" && v.date >= from && v.date <= to)
    .sort((a, b) => a.date.localeCompare(b.date));
}

const SYM: Record<Change, { s: string; c: string }> = {
  improved: { s: "▲", c: "text-(--text-success)" },
  same: { s: "●", c: "text-muted" },
  worse: { s: "▼", c: "text-(--text-danger)" },
};

// 흰 바탕 + 상단 바 + 서류 + 아래 버튼 칸 (Figma 558:1935·558:2031, 상자 없이). 인쇄하면 흰 종이에 서류만 나온다
function Shell({ backHref, title, children, share }: { backHref: string; title: string; children: React.ReactNode; share?: () => Promise<void> }) {
  return (
    <div className="flex flex-1 flex-col bg-white">
      <main className="mx-auto flex w-full max-w-md flex-col gap-3 px-5 pt-5 pb-6 print:max-w-none print:p-0">
        {/* 들어온 화면(서류 만들기·게시글)으로 돌아간다. 링크로 바로 열었으면 backHref로 */}
        <TopBar back={<BackButton icon className={TOP_BACK} fallback={backHref} />} title={title} />
        {children}
      </main>
      <PrintActions share={share} />
    </div>
  );
}

// 서류 카드: 흰 면 r16, 안쪽 24 (Figma 요약 A4). 인쇄할 때는 여백·애니메이션 없이
const paper = "p-6! print:animate-none! print:rounded-none print:p-0!";

// 표: 연한 회색 면 r12, 머리 줄은 --line 면 (Figma 516:690). 줄 사이 선 없음
function Trend({ head, rows }: { head: string[]; rows: { label: string; cells: { v: React.ReactNode; c: string }[] }[] }) {
  return (
    <table className="w-full table-fixed overflow-hidden rounded-xl bg-(--bg-secondary) text-center text-base print:bg-white">
      <thead className="bg-(--line) font-bold print:bg-(--bg-secondary)">
        <tr>
          <th className="p-2" />
          {head.map((h, i) => (
            <th key={i} className="py-2">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.label}>
            <th className="p-2 text-left font-bold">{r.label}</th>
            {r.cells.map((x, i) => (
              <td key={i} className={`py-2 font-medium ${x.c}`}>
                {x.v}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// 서류 화면이 받는 값: 수급자, 그 수급자의 방문 기록 전부, 작성한 요양보호사, 오늘(YYYY-MM-DD)
type ViewProps = {
  client: ClientProfile;
  history: HistoryVisit[];
  caregiverName: string;
  today: string;
  from: string;
  to: string;
  backHref: string;
  role: "caregiver" | "guardian";
  share?: () => Promise<void>; // 게시판에 올리기 (요양보호사의 진료 참고용 요약만)
};

// 기간 요약: 기록에 있는 사실만 센다 (LAW-1: 진단·해석 없이)
// shortcut: AI 요약(DIF-4) 대신 횟수를 세어 문장으로 만든다, AI 요약이 준비되면 바꾼다
function periodSummary(visits: HistoryVisit[]) {
  if (visits.length === 0) return "기간 중 보낸 방문 기록이 없어요.";
  const worse = (["physical", "meal", "cognitive"] as const)
    .map((k) => [{ physical: "신체기능", meal: "식사기능", cognitive: "인지기능" }[k], visits.filter((v) => v.record.change[k] === "worse").length] as const)
    .filter(([, n]) => n > 0)
    .map(([k, n]) => `${k} ${n}번`);
  const sum = (k: "stoolAccidents" | "urineAccidents") => visits.reduce((t, v) => t + (v.record.bowel[k] ?? 0), 0);
  const notes = visits.filter((v) => v.record.notes).length;
  return [
    `방문 ${visits.length}번 중 나빠졌다고 적은 기록은 ${worse.length ? worse.join(", ") : "없어요"}${worse.length ? "이에요" : ""}.`,
    `대변 실수 ${sum("stoolAccidents")}번, 소변 실수 ${sum("urineAccidents")}번이 적혀 있어요.`,
    notes ? `특이사항은 ${notes}번 적혀 있어요.` : "",
  ].join(" ");
}

// C-20 진료 참고용 요약 (와이어 305:38)
export function SummaryView({ client: c, history, caregiverName, today, from, to, backHref, share }: ViewProps) {
  const visits = visitsIn(history, from, to);
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
    <Shell backHref={backHref} title="진료 참고용 요약" share={share}>
      <Card className={`gap-4 leading-[1.4] ${paper}`}>
        <header className="flex flex-col gap-1">
          <h1 className="text-[22px] font-bold tracking-[-0.02em]">진료 참고용 기록 요약</h1>
          <p className="text-base font-medium text-muted">
            {[`${c.name} 수급자`, c.age && `${c.age}세`, c.gender, `장기요양 ${c.careGrade ?? "등급 미입력"}`].filter(Boolean).join(" · ")}
          </p>
          <p className="text-base text-muted">
            <span className="whitespace-nowrap">{fmt(from)} ~ {fmt(to)}</span> · <span className="whitespace-nowrap">방문 {visits.length}번</span>
          </p>
        </header>
        {c.medicationNotes && (
          <p className="rounded-2xl bg-(--bg-secondary) p-3 text-base font-medium print:bg-white print:p-0">복용 중인 약: {c.medicationNotes}</p>
        )}

        <section className="flex flex-col gap-1 break-inside-avoid">
          <h2 className="text-lg font-bold">1. 기간 중 달라진 점</h2>
          {worse.length === 0 && <p className="text-base text-muted">기간 중 나빠진 기록이 없어요.</p>}
          {worse.map((w) => (
            <p key={w.date + w.k} className="flex items-start gap-3 py-1.5 text-lg">
              <span className="min-w-0 flex-1 text-muted">
                <span className="whitespace-nowrap">{Number(w.date.slice(5, 7))}월 {Number(w.date.slice(8))}일</span> · {w.k}
              </span>
              <span className="shrink-0 font-bold text-(--text-danger)">▼ 나빠졌어요</span>
            </p>
          ))}
          {worse.length > 0 && <p className="text-base text-muted">그 밖의 방문은 비슷하거나 좋아졌어요.</p>}
        </section>

        <section className="flex flex-col gap-2 break-inside-avoid">
          <h2 className="text-lg font-bold">
            2. 변화상태 추이 <span className="whitespace-nowrap">(최근 방문 {recent.length}번)</span>
          </h2>
          <Trend
            head={recent.map((v) => md(v.date))}
            rows={(
              [
                ["신체", "physical"],
                ["식사", "meal"],
                ["인지", "cognitive"],
              ] as const
            ).map(([label, k]) => ({
              label,
              cells: recent.map((v) => {
                const x = v.record.change[k];
                return { v: x ? SYM[x].s : "-", c: x ? SYM[x].c : "text-muted" };
              }),
            }))}
          />
          <p className="whitespace-pre-wrap text-base text-muted">{"▲ 좋아졌어요  ● 비슷해요  ▼ 나빠졌어요"}</p>
        </section>

        <section className="flex flex-col gap-2 break-inside-avoid">
          <h2 className="text-lg font-bold">3. 배변 변화 (실수 횟수)</h2>
          <Trend
            head={recent.map((v) => md(v.date))}
            rows={(
              [
                ["대변", "stoolAccidents"],
                ["소변", "urineAccidents"],
              ] as const
            ).map(([label, k]) => ({
              label,
              cells: recent.map((v) => {
                const n = v.record.bowel[k];
                return { v: n ?? "-", c: n === null ? "text-muted" : "" };
              }),
            }))}
          />
        </section>

        <section className="flex flex-col gap-1">
          <h2 className="text-lg font-bold">4. 특이사항</h2>
          {notes.length === 0 && <p className="text-base text-muted">적힌 특이사항이 없어요.</p>}
          {notes.map((v) => (
            <div key={v.date} className="break-inside-avoid py-1">
              <p className="text-base font-bold text-muted">
                {Number(v.date.slice(5, 7))}월 {Number(v.date.slice(8))}일
              </p>
              <p className="text-lg">{v.record.notes}</p>
            </div>
          ))}
        </section>

        <section className="flex flex-col gap-1 break-inside-avoid">
          <h2 className="text-lg font-bold">5. 기간 요약</h2>
          <p className="text-lg">{periodSummary(visits)}</p>
          <p className="text-base text-muted">보낸 기록의 횟수를 모아 정리한 요약이에요. 진단이 아니에요.</p>
        </section>

        <footer className="rounded-xl bg-(--bg-secondary) px-3 py-2 text-base text-muted print:bg-white print:px-0">
          <p className="font-bold">요양보호사가 보고 적은 기록과 AI가 모아 쓴 요약이에요. 의료적 진단이 아니니, 건강 상태는 꼭 의료진과 상담해 주세요.</p>
          <p>
            작성 {caregiverName} 요양보호사 · 작성일 {fmt(today)}
          </p>
        </footer>
      </Card>
    </Shell>
  );
}

// 급여제공기록지: 날짜마다 한 장 (결과 화면은 D-29 정할 것 ① 이후 다듬는다)
export function CareSheetView({ client: c, history, caregiverName, today, from, to, backHref, role }: ViewProps) {
  const visits = visitsIn(history, from, to);
  return (
    <Shell backHref={backHref} title="급여제공기록지">
      <p className="text-base text-muted print:hidden">
        장기요양급여 제공기록지(방문요양) 형식이에요. 기관이 발급하는 공식 사본은 아니에요.
        {/* 하루치는 Figma처럼 문장만, 여러 날이면 몇 장인지 덧붙인다 */}
        {visits.length > 1 && (
          <span className="whitespace-nowrap">
            {" "}
            {fmt(from)} ~ {fmt(to)} · {visits.length}장
          </span>
        )}
      </p>
      {visits.map((v) => (
        <div key={v.date} className="print:break-after-page">
          <CareSheet
            record={v.record}
            date={fmtDay(v.date)}
            time={`${v.start}~${v.end}`}
            clientName={c.name}
            caregiverName={caregiverName}
            visitId={role === "caregiver" ? v.visitId : undefined}
            signatures={v.signatures}
          />
        </div>
      ))}
      <footer className="pt-3 text-base text-muted">
        <p className="font-bold">
          요양보호사가 손다음에 보낸 기록으로 만든 참고용 기록지예요. 기관이 발급하는 공식 사본이 아니어서 국민건강보험공단 제출 같은 공식 용도로는 쓸 수 없어요. 공식 기록은 소속 기관에 요청해 주세요.
        </p>
        <p>만든 날 {fmt(today)}</p>
      </footer>
    </Shell>
  );
}
