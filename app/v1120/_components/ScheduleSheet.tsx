"use client";

import { useState } from "react";
import { clients } from "../_mock";

// C-04 일정 달력 (와이어 278:2). 홈의 "일정 보기"를 누르면 아래에서 올라오는 시트.
const TODAY = new Date(2026, 9, 9); // 1120.ver 임시 데이터의 "오늘"
const WEEK = ["일", "월", "화", "수", "목", "금", "토"];

function visitsOn(d: Date) {
  return clients
    .filter((c) => c.isActive && c.scheduleDays.includes(d.getDay()))
    .map((c) => ({ name: c.name, time: c.scheduleLabel.split(" ").pop() ?? "" }));
}

export function ScheduleSheet() {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(new Date(TODAY.getFullYear(), TODAY.getMonth(), 1));
  const [picked, setPicked] = useState(TODAY);

  const first = month.getDay();
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array.from({ length: first }, () => null),
    ...Array.from({ length: days }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1)),
  ];
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  const list = visitsOn(picked);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-12 shrink-0 items-center rounded-xl border border-border bg-white px-4 text-base font-bold active:bg-accent-soft"
      >
        일정 보기
      </button>

      {open && (
        <div className="fixed inset-0 z-20 flex items-end bg-black/40" role="dialog" aria-modal="true" aria-label="일정 달력">
          <div className="mx-auto flex max-h-[92vh] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-t-2xl bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">일정 달력</h2>
              <button type="button" onClick={() => setOpen(false)} className="min-h-12 rounded-xl border border-border px-4 text-base font-bold">
                닫기
              </button>
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
                className="min-h-12 rounded-xl border border-border px-3 text-base font-bold"
              >
                ‹ 이전 달
              </button>
              <p className="text-xl font-bold">
                {month.getFullYear()}년 {month.getMonth() + 1}월
              </p>
              <button
                type="button"
                onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
                className="min-h-12 rounded-xl border border-border px-3 text-base font-bold"
              >
                다음 달 ›
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
              {WEEK.map((w) => (
                <span key={w} className="text-base font-medium text-muted">
                  {w}
                </span>
              ))}
              {cells.map((d, i) =>
                d ? (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setPicked(d)}
                    aria-pressed={same(d, picked)}
                    className={`flex h-[60px] flex-col items-center justify-center rounded-xl ${same(d, picked) ? "bg-accent" : ""}`}
                  >
                    <span className="text-lg">{d.getDate()}</span>
                    {visitsOn(d).length > 0 && (
                      <span className="text-sm font-bold text-accent-soft-foreground">{visitsOn(d).length}건</span>
                    )}
                  </button>
                ) : (
                  <span key={i} />
                ),
              )}
            </div>

            <p className="flex items-center gap-3 text-base text-muted">
              <span className="h-4 w-4 rounded bg-accent" /> 고른 날
              <span className="font-bold text-accent-soft-foreground">2건</span> 그날 돌봄 수
            </p>

            <div className="flex flex-col gap-2 border-t border-(--line) pt-4">
              <p className="text-lg font-bold">
                {picked.getMonth() + 1}월 {picked.getDate()}일 ({WEEK[picked.getDay()]}) 돌봄 {list.length}건
              </p>
              {list.length === 0 && <p className="text-base text-muted">이 날은 예정된 돌봄이 없어요.</p>}
              {list.map((v) => (
                <div key={v.name} className="flex items-center justify-between rounded-xl border border-(--line) px-4 py-3">
                  <span className="text-lg font-bold">{v.name} 수급자</span>
                  <span className="text-base text-muted">{v.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
