import type { CareRecord, Change, Signatures } from "../_types";
import { SignatureSection } from "./SignatureBox";
import { Card } from "./ui";

// 급여제공기록지(별지 제12호) 형식으로 하루 기록을 보여 준다. C-17 기관 서류 탭과 서류 만들기 결과가 같이 쓴다.
// 기관이 발급하는 공식 사본이 아니다 (D-29 초안).

const CH: Record<Change, string> = { improved: "호전", same: "유지", worse: "악화" };
const mark = (v: boolean | null) => (v ? "✓" : "—");

// 한 줄: 왼쪽 항목(회색), 오른쪽 값(굵게). 안 한 항목(—, 0분)은 줄 전체를 회색으로 (Figma 516:784)
function Row({ label, value, tone }: { label: string; value: string; tone?: "off" | "danger" }) {
  return (
    <div className={`flex items-start gap-3 py-1.5 ${tone === "off" ? "text-muted" : ""}`}>
      <span className="min-w-0 flex-1 text-muted">{label}</span>
      <span className={`shrink-0 whitespace-nowrap font-bold ${tone === "danger" ? "text-(--text-danger)" : ""}`}>{value}</span>
    </div>
  );
}

function Block({ title, extra, children }: { title: string; extra?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col break-inside-avoid text-lg">
      <h3 className="flex items-start justify-between gap-3 pb-1 font-bold">
        {title}
        {extra && <span className="whitespace-nowrap text-(--text-brand)">{extra}</span>}
      </h3>
      {children}
    </section>
  );
}

export function CareSheet({
  record: r,
  date,
  time,
  clientName,
  caregiverName,
  signature = true,
  visitId,
  signatures,
}: {
  record: CareRecord;
  date: string;
  time: string;
  clientName: string;
  caregiverName: string;
  signature?: boolean;
  visitId?: string; // 있으면 서명을 저장한다 (요양보호사 쪽)
  signatures?: Signatures;
}) {
  const min = (n: number | null) => (n === null ? "확인 필요" : `${n}분`);
  const cnt = (n: number | null) => (n === null ? "확인 필요" : `${n}회`);
  const check = (label: string, v: boolean | null) => <Row label={label} value={mark(v)} tone={v ? undefined : "off"} />;
  const minutes = (label: string, n: number | null) => <Row label={label} value={min(n)} tone={n === 0 ? "off" : undefined} />;
  const change = (label: string, v: Change | null) => <Row label={label} value={v ? CH[v] : "확인 필요"} tone={v === "worse" ? "danger" : undefined} />;
  return (
    <Card className="gap-4 leading-[1.4] print:animate-none! print:rounded-none print:p-0">
      <header className="flex flex-col gap-1">
        <h2 className="text-[22px] font-bold tracking-[-0.02em]">{date}</h2>
        <p className="text-base font-medium text-muted">
          <span className="whitespace-nowrap">수급자 {clientName}</span> · <span className="whitespace-nowrap">요양보호사 {caregiverName}</span> ·{" "}
          <span className="whitespace-nowrap">서비스 시간 {time}</span>
        </p>
        <p className="hidden text-base text-muted print:block">장기요양급여 제공기록지(방문요양) 형식 · 공식 사본 아님</p>
      </header>

      <Block title="신체활동지원" extra={r.physical.minutes === null ? "시간 확인 필요" : `${r.physical.minutes}분`}>
        {check("개인위생 (세면·구강·몸단장 등)", r.physical.personalHygiene)}
        {check("몸 씻기 도움", r.physical.bathing)}
        {check("식사 도움", r.physical.mealAssist)}
        {check("체위변경", r.physical.repositioning)}
        {check("이동 도움", r.physical.mobility)}
        {check("화장실 이용하기", r.physical.toileting)}
      </Block>
      <Block title="인지·정서 지원">
        {minutes("인지자극활동", r.cognitive.stimulation)}
        {minutes("일상생활 함께하기", r.cognitive.dailyLiving)}
        {minutes("인지행동변화 관리", r.cognitive.behaviorManagement)}
        {minutes("의사소통 도움·말벗·격려", r.cognitive.emotional)}
      </Block>
      <Block title="가사 및 일상생활지원" extra={r.household.minutes === null ? "시간 확인 필요" : `${r.household.minutes}분`}>
        {check("식사준비·청소·세탁 등", r.household.mealPrepCleaningLaundry)}
        {check("개인활동지원 (외출 동행 등)", r.household.personalActivity)}
      </Block>
      <Block title="변화상태">
        {change("신체기능", r.change.physical)}
        {change("식사기능", r.change.meal)}
        {change("인지기능", r.change.cognitive)}
      </Block>
      <Block title="배변변화">
        <Row label="대변 실수" value={cnt(r.bowel.stoolAccidents)} />
        <Row label="소변 실수" value={cnt(r.bowel.urineAccidents)} />
        {r.bowel.diaperChanges !== null && <Row label="기저귀 교환" value={cnt(r.bowel.diaperChanges)} />}
      </Block>
      <section className="flex flex-col gap-1 break-inside-avoid text-lg">
        <h3 className="font-bold">특이사항</h3>
        <p>{r.notes ?? "없음"}</p>
      </section>

      {signature && (
        <section className="flex flex-col gap-2 break-inside-avoid">
          <h3 className="text-lg font-bold">확인 서명</h3>
          <SignatureSection visitId={visitId} initial={signatures} caregiverName={caregiverName} />
        </section>
      )}
    </Card>
  );
}
