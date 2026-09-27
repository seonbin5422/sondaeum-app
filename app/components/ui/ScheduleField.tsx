"use client";

import { useState } from "react";

const DAYS = ["일", "월", "화", "수", "목", "금", "토"];
const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
const MINUTES = ["00", "15", "30", "45"];

const selectClass =
  "h-14 flex-1 rounded-[15px] border border-border bg-card px-2 text-lg font-normal";

function parseScheduleLabel(value: string): { days: string[]; start: string; end: string } {
  const match = value.match(/^([가-힣,]+)\s+(\d{1,2}:\d{2})-(\d{1,2}:\d{2})$/);
  if (!match) return { days: [], start: "", end: "" };
  return { days: match[1].split(","), start: match[2], end: match[3] };
}

function TimeSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [hour, minute] = value ? value.split(":") : ["", ""];

  return (
    <div className="flex flex-1 gap-1">
      <select
        value={hour}
        onChange={(e) => onChange(`${e.target.value}:${minute || "00"}`)}
        className={selectClass}
      >
        <option value="" disabled>
          시
        </option>
        {HOURS.map((h) => (
          <option key={h} value={h}>
            {h}시
          </option>
        ))}
      </select>
      <select
        value={minute}
        onChange={(e) => onChange(`${hour || "00"}:${e.target.value}`)}
        className={selectClass}
      >
        <option value="" disabled>
          분
        </option>
        {MINUTES.map((m) => (
          <option key={m} value={m}>
            {m}분
          </option>
        ))}
      </select>
    </div>
  );
}

export function ScheduleField({
  name = "scheduleLabel",
  defaultValue = "",
}: {
  name?: string;
  defaultValue?: string;
}) {
  const initial = parseScheduleLabel(defaultValue);
  const [days, setDays] = useState<string[]>(initial.days);
  const [start, setStart] = useState(initial.start);
  const [end, setEnd] = useState(initial.end);

  function toggleDay(day: string) {
    setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  }

  const composed =
    days.length && start && end
      ? `${DAYS.filter((d) => days.includes(d)).join(",")} ${start}-${end}`
      : "";

  return (
    <div className="flex flex-col gap-2 text-lg font-semibold">
      돌봄 계약시간
      <input type="hidden" name={name} value={composed} />

      <div className="flex flex-wrap gap-2">
        {DAYS.map((day) => (
          <button
            key={day}
            type="button"
            onClick={() => toggleDay(day)}
            aria-pressed={days.includes(day)}
            className={`flex h-11 w-11 items-center justify-center rounded-full text-base font-semibold ${
              days.includes(day)
                ? "bg-accent text-accent-foreground"
                : "border border-border bg-white text-muted"
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <TimeSelect value={start} onChange={setStart} />
        <span className="text-muted">~</span>
        <TimeSelect value={end} onChange={setEnd} />
      </div>
    </div>
  );
}
