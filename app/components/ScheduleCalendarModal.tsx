"use client";

import { useState } from "react";
import {
  WEEKDAY_LABELS,
  weekdayIndex,
  parseScheduleDays,
  getScheduleTimeRange,
  getScheduleEndMinutes,
  matchesScheduleDay,
} from "@/lib/schedule";

export interface ClientScheduleInfo {
  id: string;
  name: string;
  scheduleLabel: string | null;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function ScheduleCalendarModal({
  clients,
  today,
  selectedDate,
  onSelectDate,
  onClose,
}: {
  clients: ClientScheduleInfo[];
  today: Date;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onClose: () => void;
}) {
  const [viewYear, setViewYear] = useState(selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth());

  const firstDay = new Date(viewYear, viewMonth, 1);
  const startOffset = weekdayIndex(firstDay);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(viewYear, viewMonth, d));

  function goPrevMonth() {
    setViewMonth((m) => {
      if (m === 0) {
        setViewYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  }

  function goNextMonth() {
    setViewMonth((m) => {
      if (m === 11) {
        setViewYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  }

  const selectedWeekday = WEEKDAY_LABELS[weekdayIndex(selectedDate)];
  const scheduledClients = clients
    .filter((c) => parseScheduleDays(c.scheduleLabel).includes(selectedWeekday))
    .sort((a, b) => getScheduleEndMinutes(a.scheduleLabel) - getScheduleEndMinutes(b.scheduleLabel));

  return (
    <div
      className="fixed inset-0 z-20 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-md flex-col gap-4 rounded-[15px] bg-card p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={goPrevMonth}
            aria-label="이전 달"
            className="flex h-9 w-9 items-center justify-center text-xl text-muted"
          >
            ‹
          </button>
          <p className="text-lg font-semibold">
            {viewYear}년 {viewMonth + 1}월
          </p>
          <button
            type="button"
            onClick={goNextMonth}
            aria-label="다음 달"
            className="flex h-9 w-9 items-center justify-center text-xl text-muted"
          >
            ›
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-sm text-muted">
          {WEEKDAY_LABELS.map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((date, i) => {
            const hasSchedule = date ? clients.some((c) => matchesScheduleDay(c.scheduleLabel, date)) : false;
            return (
              <button
                key={i}
                type="button"
                disabled={!date}
                onClick={() => date && onSelectDate(date)}
                className={`relative flex h-10 items-center justify-center rounded-full text-base ${
                  !date
                    ? ""
                    : isSameDay(date, selectedDate)
                      ? "bg-accent font-semibold text-accent-foreground"
                      : isSameDay(date, today)
                        ? "border border-accent text-accent-soft-foreground"
                        : "text-foreground"
                }`}
              >
                {date ? date.getDate() : ""}
                {hasSchedule && (
                  <span className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-black" />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-2 border-t border-border pt-4">
          <p className="text-base font-semibold">
            {viewMonth + 1}월 {selectedDate.getDate()}일 ({selectedWeekday}) 돌봄 스케줄
          </p>
          {scheduledClients.length === 0 ? (
            <p className="text-muted text-base">이 날 예정된 돌봄이 없습니다.</p>
          ) : (
            scheduledClients.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-[15px] border border-border bg-white px-4 py-3"
              >
                <span className="text-lg font-semibold">{c.name}</span>
                <span className="text-muted text-base">{getScheduleTimeRange(c.scheduleLabel)}</span>
              </div>
            ))
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-center text-base text-muted underline"
        >
          닫기
        </button>
      </div>
    </div>
  );
}
