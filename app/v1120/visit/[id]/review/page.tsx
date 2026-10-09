"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { LinkButton, Screen, TopBar } from "../../../_components/ui";
import { loadDraft, saveDraft } from "../../../_store";
import { caregiverName, findVisit, visitInfo } from "../../../_mock";
import type { SaidQuotes } from "../../../_extract";
import { CareSheet } from "../../../_components/CareSheet";
import type { CareRecord, Change } from "../../../_types";

// C-14 기록 확인 (와이어 263:171). 말하지 않은 칸은 비워 두고 "확인 필요", 그 자리에서 바로 채운다.

function NeedsCheck() {
  return (
    <span className="rounded-full bg-accent-soft px-3 py-0.5 text-base font-bold text-accent-soft-foreground ring-1 ring-accent">
      확인 필요
    </span>
  );
}

function Section({ title, hint, missing, said, children }: { title: string; hint?: string; missing?: boolean; said?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-[15px] border border-(--line) bg-white p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold">{title}</h2>
        {missing && <NeedsCheck />}
      </div>
      {hint && <p className="-mt-2 text-base text-muted">{hint}</p>}
      {children}
      {said && <p className="text-base text-muted">내가 한 말: &quot;{said}&quot;</p>}
    </section>
  );
}

function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => onChange(!on)}
      className={`min-h-12 rounded-xl px-3 text-base font-bold ${
        on ? "bg-(--success-soft) text-(--success) ring-1 ring-(--success)" : "border border-border bg-white"
      }`}
    >
      {on ? `✓ ${label}` : label}
    </button>
  );
}

function NumberRow({ label, unit, value, onChange }: { label: string; unit: string; value: number | null; onChange: (v: number | null) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 text-lg">
      <span>{label}</span>
      <span className="flex items-center gap-2">
        <input
          inputMode="numeric"
          className={`h-12 w-20 rounded-xl border text-center text-lg font-bold ${value === null ? "border-accent" : "border-border"}`}
          placeholder="—"
          value={value ?? ""}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "");
            onChange(v === "" ? null : Number(v));
          }}
        />
        <span className="w-4 text-base text-muted">{unit}</span>
      </span>
    </label>
  );
}

const CHANGE_LABELS: [Change, string][] = [
  ["improved", "호전"],
  ["same", "유지"],
  ["worse", "악화"],
];

function ChangeRow({ label, value, onChange }: { label: string; value: Change | null; onChange: (v: Change) => void }) {
  return (
    <div className="flex items-center justify-between gap-2 text-lg">
      <span className="shrink-0">{label}</span>
      <div className="grid grid-cols-3 gap-2">
        {CHANGE_LABELS.map(([v, l]) => (
          <button
            key={v}
            type="button"
            aria-pressed={value === v}
            onClick={() => onChange(v)}
            className={`h-12 w-16 rounded-xl text-base font-bold ${
              value === v ? "bg-accent text-accent-foreground" : "border border-border bg-white"
            }`}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ReviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [r, setR] = useState<CareRecord | null>(null);
  const [tab, setTab] = useState<"check" | "sheet">("check");
  const [flagged, setFlagged] = useState(false);
  const [said, setSaid] = useState<SaidQuotes | null>(null);
  const visitTime = visitInfo(id);

  useEffect(() => {
    const draft = loadDraft(id);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load the draft from sessionStorage on mount
    setR(draft.record);
    setSaid(draft.quotes);
    // LAW-7: 학대가 의심되는 말은 보고서에 자동으로 싣지 않고 요양보호사에게 신고 안내
    setFlagged(/때리|때렸|맞았|멍이|욕을|가두|굶겨/.test(draft.transcript));
  }, [id]);

  if (!r) return null;

  function update(next: CareRecord) {
    setR(next);
    saveDraft(id, { record: next });
  }
  const set = <K extends keyof CareRecord>(k: K, v: Partial<CareRecord[K]>) =>
    update({ ...r!, [k]: { ...(r![k] as object), ...v } } as CareRecord);

  const cogMissing = Object.values(r.cognitive).some((v) => v === null);
  const changeMissing = Object.values(r.change).some((v) => v === null);
  const bowelMissing = r.bowel.stoolAccidents === null || r.bowel.urineAccidents === null;

  return (
    <Screen
      bottom={
        <button
          type="button"
          onClick={() => router.push(`/v1120/visit/${id}/confirm`)}
          className="flex h-16 w-full items-center justify-center rounded-[15px] bg-accent text-lg font-bold text-accent-foreground active:bg-accent-dark"
        >
          다음: 보낼 내용 보기
        </button>
      }
    >
      <TopBar backHref={`/v1120/visit/${id}/record`} title="기록 확인" />

      <div role="tablist" className="grid grid-cols-2 rounded-xl bg-(--neutral-soft) p-1">
        {(
          [
            ["check", "기록 확인"],
            ["sheet", "급여제공기록지"],
          ] as const
        ).map(([k, l]) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={`min-h-12 rounded-lg text-base font-bold ${tab === k ? "bg-white shadow-sm" : "text-muted"}`}
          >
            {l}
          </button>
        ))}
      </div>

      {flagged && (
        <div className="flex flex-col gap-1 rounded-xl bg-(--danger-soft) px-4 py-3 text-(--danger)">
          <p className="text-lg font-bold">보호자 보고서에 싣지 않은 말이 있어요</p>
          <p className="text-base text-foreground">
            학대가 의심되는 말은 자동으로 보내지 않아요. 걱정되면 기관에 먼저 알리고, 노인보호전문기관(1577-1389)에 신고할 수 있어요.
          </p>
        </div>
      )}

      {tab === "sheet" ? (
        <>
          <p className="text-base text-muted">오늘 기록을 기관 서식 순서로 본 화면이에요. 여기서 고친 값은 기록 확인 탭과 같아요.</p>
          <CareSheet
            record={r}
            date={visitTime.date}
            time={`${visitTime.start}~${visitTime.end}`}
            clientName={findVisit(id)?.clientName ?? ""}
            caregiverName={caregiverName}
          />
        </>
      ) : (
      <>
      <div className="flex flex-col gap-1 rounded-xl bg-accent-soft px-4 py-3 text-accent-soft-foreground">
        <p className="text-lg font-bold">AI가 급여제공기록지에 맞춰 적었어요</p>
        <p className="text-base">&quot;확인 필요&quot;는 직접 말하지 않은 항목이에요. 비워 두었으니 채워 주세요.</p>
      </div>

      <Section title="서비스 시간">
        <p className="text-xl font-bold">
          {visitTime.start} ~ {visitTime.end} · 총 {visitTime.minutes}분
        </p>
        <p className="text-base text-muted">{visitTime.date} · 수급자 일정의 시작·끝 시간이에요.</p>
      </Section>

      <Section title="신체활동지원" hint="한 것을 눌러 주세요." said={said?.physical ?? undefined} missing={r.physical.minutes === null}>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              ["personalHygiene", "개인위생"],
              ["bathing", "몸씻기"],
              ["mealAssist", "식사도움"],
              ["repositioning", "체위변경"],
              ["mobility", "이동도움"],
              ["toileting", "화장실 이용"],
            ] as const
          ).map(([k, l]) => (
            <Toggle key={k} label={l} on={!!r.physical[k]} onChange={(v) => set("physical", { [k]: v })} />
          ))}
        </div>
        <NumberRow label="제공시간" unit="분" value={r.physical.minutes} onChange={(v) => set("physical", { minutes: v })} />
      </Section>

      <Section title="인지·정서 지원" said={said?.cognitive ?? undefined} missing={cogMissing}>
        {(
          [
            ["stimulation", "인지자극활동"],
            ["dailyLiving", "일상생활 함께하기"],
            ["behaviorManagement", "인지행동변화 관리"],
            ["emotional", "의사소통·말벗·격려"],
          ] as const
        ).map(([k, l]) => (
          <NumberRow key={k} label={l} unit="분" value={r.cognitive[k]} onChange={(v) => set("cognitive", { [k]: v })} />
        ))}
      </Section>

      <Section title="가사·일상생활지원" hint="한 것을 눌러 주세요." said={said?.household ?? undefined} missing={r.household.minutes === null}>
        <div className="flex flex-wrap gap-2">
          <Toggle label="식사준비·청소·세탁" on={!!r.household.mealPrepCleaningLaundry} onChange={(v) => set("household", { mealPrepCleaningLaundry: v })} />
          <Toggle label="외출 동행" on={!!r.household.personalActivity} onChange={(v) => set("household", { personalActivity: v })} />
        </div>
        <NumberRow label="제공시간" unit="분" value={r.household.minutes} onChange={(v) => set("household", { minutes: v })} />
      </Section>

      <Section title="변화상태" hint="지난 방문과 비교해 골라 주세요." said={said?.change ?? undefined} missing={changeMissing}>
        <ChangeRow label="신체기능" value={r.change.physical} onChange={(v) => set("change", { physical: v })} />
        <ChangeRow label="식사기능" value={r.change.meal} onChange={(v) => set("change", { meal: v })} />
        <ChangeRow label="인지기능" value={r.change.cognitive} onChange={(v) => set("change", { cognitive: v })} />
      </Section>

      <Section title="배변 변화" said={said?.bowel ?? undefined} missing={bowelMissing}>
        <NumberRow label="대변 실수" unit="회" value={r.bowel.stoolAccidents} onChange={(v) => set("bowel", { stoolAccidents: v })} />
        <NumberRow label="소변 실수" unit="회" value={r.bowel.urineAccidents} onChange={(v) => set("bowel", { urineAccidents: v })} />
        <label className="flex min-h-12 items-center gap-3 text-base">
          <input
            type="checkbox"
            className="h-6 w-6 accent-[var(--accent)]"
            checked={r.bowel.diaperChanges !== null}
            onChange={(e) => set("bowel", { diaperChanges: e.target.checked ? 0 : null })}
          />
          기저귀 사용 (교환 횟수로 적기)
        </label>
        {r.bowel.diaperChanges !== null && (
          <NumberRow label="기저귀 교환" unit="회" value={r.bowel.diaperChanges} onChange={(v) => set("bowel", { diaperChanges: v ?? 0 })} />
        )}
      </Section>

      <Section title="특이사항" said={said?.notes ?? undefined} missing={!r.notes}>
        <textarea
          className="min-h-24 w-full rounded-xl border border-border p-3 text-lg font-bold"
          value={r.notes ?? ""}
          placeholder="혈압, 복약, 아픈 곳처럼 보호자가 알아야 할 것"
          onChange={(e) => update({ ...r, notes: e.target.value || null })}
        />
      </Section>

      </>
      )}

      <LinkButton href="/v1120" variant="secondary">
        나중에 하기 (홈으로)
      </LinkButton>
    </Screen>
  );
}
