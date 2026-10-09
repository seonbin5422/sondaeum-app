"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui";

// C-19 서류 만들기 (와이어 308:57 → 308:2 → 307:2, D-29 초안). 서류 종류를 고르면 기간이 나타나고, 둘 다 고르면 버튼이 켜진다.
// 보호자 G-03도 같은 화면을 쓴다 (D-26).

type Doc = "summary" | "care-sheet";
type Period = "day" | "week" | "month" | "custom";

const TODAY = "2026-10-09";
const shift = (iso: string, days: number) => {
  const d = new Date(`${iso}T12:00:00+09:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};
const label = (iso: string) => `${Number(iso.slice(5, 7))}월 ${Number(iso.slice(8))}일`;

function Option({ on, title, sub, onClick }: { on: boolean; title: string; sub: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`flex min-h-16 w-full items-center gap-3 rounded-[15px] px-4 py-3 text-left ${
        on ? "bg-accent-soft ring-2 ring-accent" : "border border-border bg-white"
      }`}
    >
      <span className={`h-6 w-6 shrink-0 rounded-full ${on ? "border-[6px] border-accent-soft-foreground bg-accent" : "border-2 border-border"}`} />
      <span className="flex flex-col">
        <span className="text-lg font-bold">{title}</span>
        <span className="text-base text-muted">{sub}</span>
      </span>
    </button>
  );
}

export function DocumentPicker({ basePath, sentDates }: { basePath: string; sentDates: string[] }) {
  const router = useRouter();
  const [doc, setDoc] = useState<Doc | null>(null);
  const [period, setPeriod] = useState<Period | null>(null);
  const latest = sentDates[0] ?? TODAY;
  const [day, setDay] = useState(latest);
  const [from, setFrom] = useState(shift(TODAY, -30));
  const [to, setTo] = useState(TODAY);

  const range: [string, string] | null =
    period === "day" ? [day, day] : period === "week" ? [shift(TODAY, -7), TODAY] : period === "month" ? [shift(TODAY, -30), TODAY] : period === "custom" ? [from, to] : null;
  const countIn = (a: string, b: string) => sentDates.filter((d) => d >= a && d <= b).length;
  const count = range ? countIn(...range) : 0;

  const reason = !doc ? "서류 종류를 골라 주세요" : !range ? "기간을 골라 주세요" : count === 0 ? "이 기간에 보낸 기록이 없어요" : undefined;

  const dateInput = (value: string, onChange: (v: string) => void, prefix: string) => (
    <label className="flex h-14 flex-1 items-center gap-2 rounded-xl border border-border px-3 text-base">
      <span className="text-muted">{prefix}</span>
      <input type="date" className="w-full bg-transparent text-lg" value={value} max={TODAY} onChange={(e) => onChange(e.target.value)} />
    </label>
  );

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-lg font-bold">어떤 서류가 필요하세요?</h2>
      <div className="-mt-2 flex flex-col gap-3">
        <Option on={doc === "summary"} title="진료 참고용 요약" sub="병원에서 의사 선생님께 보여 드려요" onClick={() => setDoc("summary")} />
        <Option on={doc === "care-sheet"} title="급여제공기록지" sub="기관 서식 순서대로 정리해요" onClick={() => setDoc("care-sheet")} />
      </div>

      {doc && (
        <>
          <h2 className="text-lg font-bold">어느 기간을 모을까요?</h2>
          <div className="-mt-2 flex flex-col gap-3">
            <Option on={period === "day"} title="하루" sub="날짜 하나를 골라요" onClick={() => setPeriod("day")} />
            {period === "day" && (
              <div className="flex flex-col gap-1">
                {dateInput(day, setDay, "날짜")}
                <span className="text-base text-muted">
                  {label(day)} · 방문 {countIn(day, day)}번
                </span>
              </div>
            )}
            <Option on={period === "week"} title="최근 1주" sub={`${label(shift(TODAY, -7))} ~ ${label(TODAY)} · 방문 ${countIn(shift(TODAY, -7), TODAY)}번`} onClick={() => setPeriod("week")} />
            <Option on={period === "month"} title="최근 1개월" sub={`${label(shift(TODAY, -30))} ~ ${label(TODAY)} · 방문 ${countIn(shift(TODAY, -30), TODAY)}번`} onClick={() => setPeriod("month")} />
            <Option on={period === "custom"} title="직접 고르기" sub="시작일과 끝나는 날을 골라요" onClick={() => setPeriod("custom")} />
            {period === "custom" && (
              <div className="flex gap-2">
                {dateInput(from, setFrom, "시작")}
                {dateInput(to, setTo, "끝")}
              </div>
            )}
          </div>
        </>
      )}

      {range && count > 0 && <p className="text-base text-muted">보낸 기록만 모아요. 방문 {count}번이 들어가요.</p>}

      <Button disabled={!!reason} disabledReason={reason} onClick={() => range && router.push(`${basePath}/${doc}?from=${range[0]}&to=${range[1]}`)}>
        서류 만들기
      </Button>
    </div>
  );
}
