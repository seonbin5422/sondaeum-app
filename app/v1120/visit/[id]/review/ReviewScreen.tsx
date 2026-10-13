"use client";

import { useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button, LinkButton, Screen, TopBar } from "../../../_components/ui";
import { saveRecord } from "../../../_actions";
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

// 섹션은 하나씩 나타난다. 머리를 누르면 이름·시간만 남기고 접히고, 다시 누르면 펼쳐진다.
function Section({
  id,
  title,
  time,
  summary,
  hint,
  missing,
  said,
  open,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  time?: string;
  summary?: string;
  hint?: string;
  missing?: boolean;
  said?: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <section id={id} className="flex scroll-mt-4 flex-col gap-3 rounded-[15px] border border-(--line) bg-white p-5">
      <button type="button" aria-expanded={open} onClick={onToggle} className="flex min-h-12 items-center justify-between gap-2 text-left">
        <h2 className="text-lg font-bold">{title}</h2>
        <span className="flex items-center gap-2">
          {missing && <NeedsCheck />}
          {time && <span className="text-lg font-bold">{time}</span>}
          <span aria-hidden className={`text-muted transition-transform ${open ? "rotate-180" : ""}`}>
            ▾
          </span>
        </span>
      </button>
      {!open && summary && <p className="-mt-2 truncate text-base text-muted">{summary}</p>}
      {open && (
        <>
              {hint && <p className="-mt-2 text-base text-muted">{hint}</p>}
              {children}
              {said && <p className="text-base text-muted">내가 한 말: &quot;{said}&quot;</p>}
        </>
      )}
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

type VisitTime = { date: string; start: string; end: string; minutes: number };

export function ReviewScreen({
  id,
  initialRecord,
  said,
  transcript,
  visitTime,
  clientName,
  caregiverName,
}: {
  id: string;
  initialRecord: CareRecord;
  said: SaidQuotes | null;
  transcript: string;
  visitTime: VisitTime;
  clientName: string;
  caregiverName: string;
}) {
  const router = useRouter();
  const [r, setR] = useState<CareRecord>(initialRecord);
  const [tab, setTab] = useState<"check" | "sheet">("check");
  const [saveError, setSaveError] = useState("");
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // LAW-7: 학대가 의심되는 말은 보고서에 자동으로 싣지 않고 요양보호사에게 신고 안내
  const flagged = /때리|때렸|맞았|멍이|욕을|가두|굶겨/.test(transcript);

  function update(next: CareRecord) {
    setR(next);
    // 고칠 때마다 잠깐 기다렸다 DB에 저장
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveRecord(id, next).then(() => setSaveError(""), () => setSaveError("저장하지 못했어요. 인터넷 연결을 확인해 주세요.")), 600);
  }

  async function toConfirm() {
    clearTimeout(saveTimer.current);
    try {
      await saveRecord(id, r);
      router.push(`/v1120/visit/${id}/confirm`);
    } catch {
      setSaveError("저장하지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요.");
    }
  }
  const set = <K extends keyof CareRecord>(k: K, v: Partial<CareRecord[K]>) =>
    update({ ...r, [k]: { ...(r[k] as object), ...v } } as CareRecord);

  const cogMissing = Object.values(r.cognitive).some((v) => v === null);
  const changeMissing = Object.values(r.change).some((v) => v === null);
  const bowelMissing = r.bowel.stoolAccidents === null || r.bowel.urineAccidents === null;
  const cogValues = Object.values(r.cognitive).filter((v): v is number => v !== null);
  const cogMinutes = cogValues.length ? cogValues.reduce((a, b) => a + b, 0) : null;
  const min = (v: number | null) => (v === null ? undefined : `${v}분`);

  // 하나씩 확인: confirmed = 확인을 누른 섹션 수, 그다음 섹션까지만 보인다
  const [confirmed, setConfirmed] = useState(0);
  const [open, setOpen] = useState(new Set([0]));
  const toggle = (i: number) =>
    setOpen((o) => {
      const n = new Set(o);
      if (!n.delete(i)) n.add(i);
      return n;
    });
  function next(i: number) {
    setConfirmed(i + 1);
    setOpen((o) => {
      const n = new Set(o);
      n.delete(i);
      n.add(i + 1);
      return n;
    });
    // 새로 나온 섹션이 아래 버튼에 가리지 않게
    setTimeout(() => document.getElementById(`step-${i + 1}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  // 시간이 없는 섹션은 접혔을 때 짧은 요약을 보여 준다
  const changeWord = (v: Change | null) => (v ? CHANGE_LABELS.find(([c]) => c === v)![1] : "—");
  const times = (v: number | null) => (v === null ? "—" : `${v}회`);
  const changeSummary = `신체 ${changeWord(r.change.physical)} · 식사 ${changeWord(r.change.meal)} · 인지 ${changeWord(r.change.cognitive)}`;
  const bowelSummary =
    `대변 실수 ${times(r.bowel.stoolAccidents)} · 소변 실수 ${times(r.bowel.urineAccidents)}` +
    (r.bowel.diaperChanges !== null ? ` · 기저귀 ${r.bowel.diaperChanges}회` : "");

  const steps: { title: string; time?: string; summary?: string; hint?: string; missing?: boolean; said?: string; body: ReactNode }[] = [
    {
      title: "서비스 시간", time: `${visitTime.start}~${visitTime.end}`,
      body: (
        <>
          <p className="text-xl font-bold">
            {visitTime.start} ~ {visitTime.end} · 총 {visitTime.minutes}분
          </p>
          <p className="text-base text-muted">{visitTime.date} · 수급자를 등록할 때 정한 서비스 시간이에요.</p>
        </>
      ),
    },
    {
      title: "신체활동지원", hint: "한 것을 눌러 주세요.", said: said?.physical ?? undefined, missing: r.physical.minutes === null, time: min(r.physical.minutes),
      body: (
        <>
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
        </>
      ),
    },
    {
      title: "인지·정서 지원", said: said?.cognitive ?? undefined, missing: cogMissing, time: min(cogMinutes),
      body: (
        <>
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
        </>
      ),
    },
    {
      title: "가사·일상생활지원", hint: "한 것을 눌러 주세요.", said: said?.household ?? undefined, missing: r.household.minutes === null, time: min(r.household.minutes),
      body: (
        <>
          <div className="flex flex-wrap gap-2">
            <Toggle label="식사준비·청소·세탁" on={!!r.household.mealPrepCleaningLaundry} onChange={(v) => set("household", { mealPrepCleaningLaundry: v })} />
            <Toggle label="외출 동행" on={!!r.household.personalActivity} onChange={(v) => set("household", { personalActivity: v })} />
          </div>
          <NumberRow label="제공시간" unit="분" value={r.household.minutes} onChange={(v) => set("household", { minutes: v })} />
        </>
      ),
    },
    {
      title: "변화상태", hint: "지난 방문과 비교해 골라 주세요.", said: said?.change ?? undefined, missing: changeMissing, summary: changeSummary,
      body: (
        <>
          <ChangeRow label="신체기능" value={r.change.physical} onChange={(v) => set("change", { physical: v })} />
          <ChangeRow label="식사기능" value={r.change.meal} onChange={(v) => set("change", { meal: v })} />
          <ChangeRow label="인지기능" value={r.change.cognitive} onChange={(v) => set("change", { cognitive: v })} />
        </>
      ),
    },
    {
      title: "배변 변화", said: said?.bowel ?? undefined, missing: bowelMissing, summary: bowelSummary,
      body: (
        <>
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
        </>
      ),
    },
    {
      title: "특이사항", said: said?.notes ?? undefined, missing: !r.notes, summary: r.notes ?? undefined,
      body: (
        <>
          <textarea
            className="min-h-24 w-full rounded-xl border border-border p-3 text-lg font-bold"
            value={r.notes ?? ""}
            placeholder="혈압, 복약, 아픈 곳처럼 보호자가 알아야 할 것"
            onChange={(e) => update({ ...r, notes: e.target.value || null })}
          />
        </>
      ),
    },
  ];

  return (
    <Screen
      bottom={
        <Button
          onClick={toConfirm}
          disabled={confirmed < steps.length}
          disabledReason={`항목을 하나씩 확인해 주세요 (${confirmed}/${steps.length})`}
        >
          다음: 보낼 내용 보기
        </Button>
      }
    >
      <TopBar backHref={`/v1120/visit/${id}/record`} title="기록 확인" />
      {saveError && <p className="text-base font-bold text-(--danger)">{saveError}</p>}

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
                clientName={clientName}
                caregiverName={caregiverName}
              />
        </>
      ) : (
      <>
      <div className="flex flex-col gap-1 rounded-xl bg-accent-soft px-4 py-3 text-accent-soft-foreground">
        <p className="text-lg font-bold">AI가 급여제공기록지에 맞춰 적었어요</p>
        <p className="text-base">&quot;확인 필요&quot;는 직접 말하지 않은 항목이에요. 비워 두었으니 채워 주세요.</p>
      </div>

      {steps.slice(0, confirmed + 1).map((st, i) => (
        <Section key={st.title} id={`step-${i}`} {...st} open={open.has(i)} onToggle={() => toggle(i)}>
          {st.body}
          {i === confirmed && (
            <Button onClick={() => next(i)}>{i === steps.length - 1 ? "다 확인했어요" : "확인했어요, 다음"}</Button>
          )}
        </Section>
      ))}
      </>
      )}

      <LinkButton href="/v1120" variant="secondary">
        나중에 하기 (홈으로)
      </LinkButton>
    </Screen>
  );
}
