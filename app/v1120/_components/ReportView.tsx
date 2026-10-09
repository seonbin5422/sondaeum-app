import type { ReactNode } from "react";
import type { CareRecord, Change } from "../_types";

// G-01 보호자 보고서 본문. C-15 "보낼 내용 보기"에서도 같은 것을 쓴다.
// order="base"는 main 기준(급여제공기록지 순서), "improved"는 PR #9 개선안(특이사항·비교를 맨 위로, 머지 보류).

const changeText: Record<Change, { label: string; className: string }> = {
  improved: { label: "좋아졌어요", className: "bg-(--success-soft) text-(--success)" },
  same: { label: "비슷해요", className: "bg-(--neutral-soft) text-foreground" },
  worse: { label: "나빠졌어요", className: "bg-(--danger-soft) text-(--danger)" },
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-[15px] bg-white p-5 shadow-[var(--shadow-card)]">
      <h2 className="text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, value, dim = false }: { label: string; value: string; dim?: boolean }) {
  return (
    <div className={`flex items-center justify-between text-lg ${dim ? "text-muted" : ""}`}>
      <span>{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}

function Done({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((t) => (
        <span key={t} className="rounded-full bg-(--success-soft) px-3 py-1 text-base font-bold text-(--success)">
          ✓ {t}
        </span>
      ))}
    </div>
  );
}

const count = (n: number | null) => (n === null ? null : n === 0 ? "없음" : `${n}번`);

export function ReportSections({ record: r, order = "base" }: { record: CareRecord; order?: "base" | "improved" }) {
  const physicalDone = (
    [
      ["개인위생", r.physical.personalHygiene],
      ["몸씻기", r.physical.bathing],
      ["식사도움", r.physical.mealAssist],
      ["체위변경", r.physical.repositioning],
      ["이동도움", r.physical.mobility],
      ["화장실 이용", r.physical.toileting],
    ] as const
  )
    .filter(([, v]) => v)
    .map(([n]) => n);
  const householdDone = (
    [
      ["식사준비·청소·세탁", r.household.mealPrepCleaningLaundry],
      ["외출 동행", r.household.personalActivity],
    ] as const
  )
    .filter(([, v]) => v)
    .map(([n]) => n);
  const changes = (
    [
      ["신체기능", r.change.physical],
      ["식사기능", r.change.meal],
      ["인지기능", r.change.cognitive],
    ] as const
  ).filter(([, v]) => v !== null) as [string, Change][];

  const physical = (
    <Section key="physical" title="신체활동 도움">
      {physicalDone.length > 0 && <Done items={physicalDone} />}
      {r.physical.minutes !== null && <Row label="제공시간" value={`${r.physical.minutes}분`} />}
      {r.physicalNote && <p className="text-base text-muted">{r.physicalNote}</p>}
    </Section>
  );
  const cognitive = (
    <Section key="cognitive" title="인지·정서 지원">
      {(
        [
          ["인지자극활동", r.cognitive.stimulation],
          ["일상생활 함께하기", r.cognitive.dailyLiving],
          ["인지행동변화 관리", r.cognitive.behaviorManagement],
          ["의사소통·말벗·격려", r.cognitive.emotional],
        ] as const
      )
        .filter(([, v]) => v !== null)
        .map(([n, v]) => (
          <Row key={n} label={n} value={`${v}분`} dim={v === 0} />
        ))}
    </Section>
  );
  const household = (
    <Section key="household" title="가사·일상생활 지원">
      {householdDone.length > 0 && <Done items={householdDone} />}
      {r.household.minutes !== null && <Row label="제공시간" value={`${r.household.minutes}분`} />}
    </Section>
  );
  const compare =
    changes.length > 0 ? (
      <Section key="compare" title="지난 방문과 비교">
        {changes.map(([n, v]) => (
          <div key={n} className="flex items-center justify-between text-lg">
            <span>{n}</span>
            <span className={`rounded-full px-3 py-0.5 text-base font-bold ${changeText[v].className}`}>
              {changeText[v].label}
            </span>
          </div>
        ))}
      </Section>
    ) : null;
  const bowel = (
    <Section key="bowel" title="배변 변화">
      {count(r.bowel.stoolAccidents) && <Row label="대변 실수" value={count(r.bowel.stoolAccidents)!} />}
      {count(r.bowel.urineAccidents) && <Row label="소변 실수" value={count(r.bowel.urineAccidents)!} />}
      {count(r.bowel.diaperChanges) && <Row label="기저귀 교환" value={count(r.bowel.diaperChanges)!} />}
    </Section>
  );
  const notes = r.notes ? (
    <Section key="notes" title="특이사항">
      <p className="text-lg font-bold">{r.notes}</p>
    </Section>
  ) : null;

  const sections =
    order === "improved"
      ? [notes, compare, bowel, physical, cognitive, household]
      : [physical, cognitive, household, compare, bowel, notes];
  return <>{sections}</>;
}
