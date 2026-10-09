import type { CareRecord, Change } from "../_types";

// 급여제공기록지(별지 제12호) 형식으로 하루 기록을 보여 준다. C-17 기관 서류 탭과 서류 만들기 결과가 같이 쓴다.
// 기관이 발급하는 공식 사본이 아니다 (D-29 초안).

const CH: Record<Change, string> = { improved: "호전", same: "유지", worse: "악화" };
const mark = (v: boolean | null) => (v ? "✓" : "");

function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr className="border-t border-(--line)">
      <th className="w-1/2 py-2 pr-2 text-left text-base font-normal">{label}</th>
      <td className="py-2 text-right text-base font-bold">{value}</td>
    </tr>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="break-inside-avoid">
      <h3 className="bg-(--neutral-soft) px-2 py-1 text-base font-bold">{title}</h3>
      <table className="w-full px-2">
        <tbody>{children}</tbody>
      </table>
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
}: {
  record: CareRecord;
  date: string;
  time: string;
  clientName: string;
  caregiverName: string;
  signature?: boolean;
}) {
  const min = (n: number | null) => (n === null ? "확인 필요" : `${n}분`);
  const cnt = (n: number | null) => (n === null ? "확인 필요" : `${n}회`);
  return (
    <article className="flex flex-col gap-3 rounded-md border border-border bg-white p-4 print:border-0 print:p-0">
      <header className="flex flex-col gap-0.5">
        <p className="text-sm text-muted">장기요양급여 제공기록지(방문요양) 형식 · 공식 사본 아님</p>
        <h2 className="text-xl font-bold">{date}</h2>
        <p className="text-base">
          수급자 {clientName} · 요양보호사 {caregiverName} · 서비스 시간 {time}
        </p>
      </header>

      <Block title="신체활동지원">
        <Row label="개인위생 (세면·구강·몸단장 등)" value={mark(r.physical.personalHygiene)} />
        <Row label="몸 씻기 도움" value={mark(r.physical.bathing)} />
        <Row label="식사 도움" value={mark(r.physical.mealAssist)} />
        <Row label="체위변경" value={mark(r.physical.repositioning)} />
        <Row label="이동 도움" value={mark(r.physical.mobility)} />
        <Row label="화장실 이용하기" value={mark(r.physical.toileting)} />
        <Row label="제공시간" value={min(r.physical.minutes)} />
      </Block>
      <Block title="인지·정서 지원">
        <Row label="인지자극활동" value={min(r.cognitive.stimulation)} />
        <Row label="일상생활 함께하기" value={min(r.cognitive.dailyLiving)} />
        <Row label="인지행동변화 관리" value={min(r.cognitive.behaviorManagement)} />
        <Row label="의사소통 도움·말벗·격려" value={min(r.cognitive.emotional)} />
      </Block>
      <Block title="가사 및 일상생활지원">
        <Row label="식사준비·청소·세탁 등" value={mark(r.household.mealPrepCleaningLaundry)} />
        <Row label="개인활동지원 (외출 동행 등)" value={mark(r.household.personalActivity)} />
        <Row label="제공시간" value={min(r.household.minutes)} />
      </Block>
      <Block title="변화상태">
        <Row label="신체기능" value={r.change.physical ? CH[r.change.physical] : "확인 필요"} />
        <Row label="식사기능" value={r.change.meal ? CH[r.change.meal] : "확인 필요"} />
        <Row label="인지기능" value={r.change.cognitive ? CH[r.change.cognitive] : "확인 필요"} />
        <Row label="배변변화: 대변 실수" value={cnt(r.bowel.stoolAccidents)} />
        <Row label="배변변화: 소변 실수" value={cnt(r.bowel.urineAccidents)} />
        {r.bowel.diaperChanges !== null && <Row label="기저귀 교환" value={cnt(r.bowel.diaperChanges)} />}
      </Block>
      <Block title="특이사항">
        <tr className="border-t border-(--line)">
          <td className="py-2 text-base">{r.notes ?? "없음"}</td>
        </tr>
      </Block>

      {signature && (
        <section className="flex flex-col gap-2 break-inside-avoid">
          <h3 className="bg-(--neutral-soft) px-2 py-1 text-base font-bold">확인 서명 (LAW-9)</h3>
          <div className="grid grid-cols-2 gap-2 text-base">
            <div className="flex h-16 items-end rounded border border-dashed border-border p-2 text-muted">수급자 또는 보호자</div>
            <div className="flex h-16 items-end rounded border border-dashed border-border p-2 text-muted">요양보호사 {caregiverName}</div>
          </div>
          <div className="rounded border border-dashed border-border p-2 text-base text-muted">서명 불가 사유:</div>
        </section>
      )}
    </article>
  );
}
