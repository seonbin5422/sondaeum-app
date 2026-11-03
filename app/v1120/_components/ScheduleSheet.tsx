"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import type { ClientProfile } from "../_types";
import { buzz } from "./Pressable";
import { Icon } from "./Icon";

// C-04 일정 달력 (Figma 511:885). 홈의 "일정 보기" 타일을 누르면 아래에서 올라오는 시트.
const WEEK = ["일", "월", "화", "수", "목", "금", "토"];

function visitsOn(clients: ClientProfile[], d: Date) {
  return clients
    .filter((c) => c.isActive && c.scheduleDays.includes(d.getDay()))
    .map((c) => ({ name: c.name, time: /\d/.test(c.scheduleLabel) ? (c.scheduleLabel.split(" ").pop() ?? "") : "" }));
}

const round = "press flex size-12 shrink-0 items-center justify-center rounded-full";

export function ScheduleSheet({ clients }: { clients: ClientProfile[] }) {
  const [TODAY] = useState(() => new Date());
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
  const list = visitsOn(clients, picked);
  // 이번 주(일~토) 돌봄 수
  const week = Array.from({ length: 7 }, (_, i) => new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate() - TODAY.getDay() + i));
  const weekCount = week.reduce((n, d) => n + visitsOn(clients, d).length, 0);

  return (
    <>
      <button
        type="button"
        onPointerDown={buzz}
        onClick={() => setOpen(true)}
        className="press flex h-[150px] flex-col items-start gap-2 rounded-2xl bg-white p-4 text-left active:bg-(--line)"
      >
        <span className="flex size-12 items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/v1120/home/home-calendar.svg" alt="" width={28} height={28} />
        </span>
        <span className="flex-1" />
        <span className="text-lg font-bold leading-[1.4]">일정 보기</span>
        <span className="text-base leading-[1.4] text-muted">이번 주 {weekCount}건</span>
      </button>

      {/* 시트는 .v1120 바로 아래로 옮겨 그린다: 카드가 움직이는 중(transform)이어도 화면 전체를 덮게 */}
      {open &&
        createPortal(
        <div
          className="fixed inset-0 z-20 flex items-end bg-black/45"
          role="dialog"
          aria-modal="true"
          aria-label="일정 달력"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="enter mx-auto flex max-h-[92vh] w-full max-w-md flex-col items-center gap-4 overflow-y-auto rounded-t-3xl bg-white px-5 pb-8 pt-3">
            <span aria-hidden className="h-[5px] w-12 shrink-0 rounded-full bg-(--line)" />
            <div className="flex w-full items-center">
              <h2 className="flex-1 text-[22px] font-bold leading-[1.4]">일정 달력</h2>
              <button type="button" onPointerDown={buzz} onClick={() => setOpen(false)} className={`${round} active:bg-(--bg-secondary)`}>
                <Icon name="close" size={28} />
                <span className="sr-only">닫기</span>
              </button>
            </div>

            <div className="flex w-full items-center justify-between">
              <button
                type="button"
                onPointerDown={buzz}
                onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
                className={`${round} bg-(--bg-secondary) active:bg-(--line)`}
              >
                <Icon name="chevron_left" size={28} />
                <span className="sr-only">이전 달</span>
              </button>
              <p className="text-xl font-bold leading-[1.4]" aria-live="polite">
                {month.getFullYear()}년 {month.getMonth() + 1}월
              </p>
              <button
                type="button"
                onPointerDown={buzz}
                onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
                className={`${round} bg-(--bg-secondary) active:bg-(--line)`}
              >
                <Icon name="chevron_right" size={28} />
                <span className="sr-only">다음 달</span>
              </button>
            </div>

            <div className="grid w-full grid-cols-7 gap-y-1 text-center leading-[1.4]">
              {WEEK.map((w) => (
                <span key={w} className="text-base font-medium text-muted">
                  {w}
                </span>
              ))}
              {cells.map((d, i) => {
                if (!d) return <span key={i} />;
                const n = visitsOn(clients, d).length;
                const on = same(d, picked);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setPicked(d)}
                    aria-pressed={on}
                    aria-label={`${d.getMonth() + 1}월 ${d.getDate()}일 돌봄 ${n}건`}
                    className="press flex flex-col items-center rounded-xl py-0.5 active:bg-(--bg-secondary)"
                  >
                    <span
                      className={`flex size-10 items-center justify-center rounded-full text-lg ${on ? "bg-accent font-bold" : same(d, TODAY) ? "font-bold" : ""}`}
                    >
                      {d.getDate()}
                    </span>
                    {/* 돌봄이 없는 날도 건수 줄 높이를 비워 둬서 날짜 숫자가 같은 줄에 선다 */}
                    <span className={`h-[22px] text-base ${on ? "text-(--text-brand)" : "text-muted"}`}>{n > 0 ? `${n}건` : ""}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex w-full flex-col rounded-2xl bg-(--bg-secondary) pb-2 leading-[1.4]">
              <p className="px-4 pb-1 pt-4 text-lg font-bold">
                <span className="whitespace-nowrap">
                  {picked.getMonth() + 1}월 {picked.getDate()}일 ({WEEK[picked.getDay()]})
                </span>{" "}
                돌봄 {list.length}건
              </p>
              {list.length === 0 && <p className="px-4 py-2 text-base text-muted">이 날은 예정된 돌봄이 없어요.</p>}
              {list.map((v) => (
                <div key={v.name} className="flex items-center justify-between gap-3 px-4 py-2">
                  <span className="text-lg font-medium">{v.name} 수급자</span>
                  {v.time && <span className="whitespace-nowrap rounded-full bg-chip-schedule px-3 py-1 text-base font-medium">{v.time}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>,
          document.querySelector(".v1120") ?? document.body,
        )}
    </>
  );
}
