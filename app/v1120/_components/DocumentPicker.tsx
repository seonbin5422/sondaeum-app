"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Icon } from "./ui";

// C-19 서류 만들기 (와이어 308:57 → 308:2 → 307:2, D-29 초안). 서류 종류를 고르면 기간이 나타나고, 둘 다 고르면 버튼이 켜진다.
// 보호자 G-03도 같은 화면을 쓴다 (D-26).

type Doc = "summary" | "care-sheet";
type Period = "day" | "week" | "month" | "custom";

const shift = (iso: string, days: number) => {
  const d = new Date(`${iso}T12:00:00+09:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};
const label = (iso: string) => `${Number(iso.slice(5, 7))}월 ${Number(iso.slice(8))}일`;

// Figma 558:1900 선택 행: 고른 것=연한 귤색 면+귤색 링 2px+체크 아이콘, 안 고른 것=흰 면+빈 동그라미
function Option({ on, title, sub, onClick }: { on: boolean; title: string; sub: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`press flex min-h-16 w-full items-center gap-3 rounded-[14px] p-4 text-left leading-[1.4] ${
        on ? "bg-(--bg-brand) ring-2 ring-inset ring-accent" : "bg-white active:bg-(--line)"
      }`}
    >
      {on ? (
        <Icon key="on" name="check_circle" size={28} className="done-pulse text-(--brand-secondary)" />
      ) : (
        <Icon key="off" name="radio_button_unchecked" size={28} className="text-(--line)" />
      )}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-lg font-bold">{title}</span>
        <span className="text-base text-muted">{sub}</span>
      </span>
    </button>
  );
}

export function DocumentPicker({ basePath, sentDates, today: TODAY }: { basePath: string; sentDates: string[]; today: string }) {
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

  // 크기·배치는 배포된 1120 버전 그대로(선택지 버튼과 같은 폭, 버튼과 12px 간격), 모양만 1128(회색 면·테두리 없음)
  const dateInput = (value: string, onChange: (v: string) => void, prefix: string) => (
    <label className="flex h-14 flex-1 items-center gap-2 rounded-[15px] bg-white px-3 text-base focus-within:ring-[3px] focus-within:ring-accent/50">
      <span className="text-muted">{prefix}</span>
      <input type="date" className="w-full bg-transparent text-lg focus:outline-none" value={value} max={TODAY} onChange={(e) => onChange(e.target.value)} />
    </label>
  );

  return (
    <div className="flex flex-1 flex-col gap-3">
      {/* Figma 558:1898: 회색 바탕 위에 상자 없이 제목 + 흰 선택 행 (행 사이 12px) */}
      <section className="enter flex flex-col gap-3 py-5">
        <h2 className="text-xl font-bold">어떤 서류가 필요하세요?</h2>
        <div className="flex flex-col gap-3">
          <Option on={doc === "summary"} title="진료 참고용 요약" sub="병원에서 의사 선생님께 보여 드려요" onClick={() => setDoc("summary")} />
          <Option on={doc === "care-sheet"} title="급여제공기록지" sub="기관 서식 순서대로 정리해요" onClick={() => setDoc("care-sheet")} />
        </div>
      </section>

      {doc && (
        <section className="enter flex flex-col gap-3 py-5">
          <h2 className="text-xl font-bold">어느 기간을 모을까요?</h2>
          <div className="flex flex-col gap-3">
            <Option on={period === "day"} title="하루" sub="날짜 하나를 골라요" onClick={() => setPeriod("day")} />
            {period === "day" && (
              <div className="enter flex flex-col gap-1">
                {dateInput(day, setDay, "날짜")}
                <span className="px-1 text-base text-muted">
                  {label(day)} · 방문 {countIn(day, day)}번
                </span>
              </div>
            )}
            <Option on={period === "week"} title="최근 1주" sub={`${label(shift(TODAY, -7))} ~ ${label(TODAY)} · 방문 ${countIn(shift(TODAY, -7), TODAY)}번`} onClick={() => setPeriod("week")} />
            <Option on={period === "month"} title="최근 1개월" sub={`${label(shift(TODAY, -30))} ~ ${label(TODAY)} · 방문 ${countIn(shift(TODAY, -30), TODAY)}번`} onClick={() => setPeriod("month")} />
            <Option on={period === "custom"} title="직접 고르기" sub="시작일과 끝나는 날을 골라요" onClick={() => setPeriod("custom")} />
            {period === "custom" && (
              <div className="enter flex gap-2">
                {dateInput(from, setFrom, "시작")}
                {dateInput(to, setTo, "끝")}
              </div>
            )}
          </div>
        </section>
      )}

      {/* 아래 버튼 칸 (Figma 558:1932): 흰 면, 위 16 · 옆 20 · 아래 24. 내용이 짧으면 화면 맨 아래에 붙는다 */}
      <div className="full-bleed -mb-5 mt-auto bg-white">
        <div className="mx-auto flex w-full max-w-md flex-col gap-2 px-5 pt-4 pb-6">
          {range && count > 0 && <p className="text-center text-base font-medium leading-[1.4] text-muted">보낸 기록만 모아요. 방문 {count}번이 들어가요.</p>}
          <Button disabled={!!reason} disabledReason={reason} onClick={() => range && router.push(`${basePath}/${doc}?from=${range[0]}&to=${range[1]}`)}>
            서류 만들기
          </Button>
        </div>
      </div>
    </div>
  );
}
