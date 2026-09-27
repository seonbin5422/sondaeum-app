"use client";

import { useState } from "react";
import { ClientCard } from "@/app/components/ClientCard";
import { ScheduleCalendarModal } from "@/app/components/ScheduleCalendarModal";
import { isVisibleOn } from "@/lib/schedule";

interface ClientInfo {
  id: string;
  name: string;
  age: number | null;
  gender: string | null;
  allergies: string | null;
  medicalHistory: string | null;
  medicationNotes: string | null;
  personalNotes: string | null;
  careRegistrationNumber: string | null;
  scheduleLabel: string | null;
  draftVisitId: string | null;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function HomeSchedule({ clients, todayIso }: { clients: ClientInfo[]; todayIso: string }) {
  const today = new Date(todayIso);
  const [selectedDate, setSelectedDate] = useState(today);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const dateLabel = selectedDate.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const visibleClients = clients.filter((c) => isVisibleOn(c.scheduleLabel, selectedDate));

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          {isSameDay(selectedDate, today) ? "오늘의 돌봄" : "돌봄 일정"}
        </h1>
        <div className="flex items-center gap-2">
          <p className="text-muted text-base">{dateLabel}</p>
          <button
            type="button"
            onClick={() => setCalendarOpen(true)}
            aria-label="돌봄 스케줄 달력 보기"
            className="flex h-6 w-6 shrink-0 items-center justify-center"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- local icon, optimization not applicable */}
            <img src="/brand/calendar-icon.svg" alt="" className="h-6 w-6" />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {visibleClients.length === 0 ? (
          <p className="text-muted text-base">이 날 방문 예정인 어르신이 없습니다.</p>
        ) : (
          visibleClients.map((c) => (
            <ClientCard
              key={c.id}
              id={c.id}
              name={c.name}
              age={c.age}
              gender={c.gender}
              allergies={c.allergies}
              medicalHistory={c.medicalHistory}
              medicationNotes={c.medicationNotes}
              personalNotes={c.personalNotes}
              careRegistrationNumber={c.careRegistrationNumber}
              scheduleLabel={c.scheduleLabel}
              draftVisitId={c.draftVisitId}
            />
          ))
        )}
      </div>

      {calendarOpen && (
        <ScheduleCalendarModal
          clients={clients}
          today={today}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onClose={() => setCalendarOpen(false)}
        />
      )}
    </>
  );
}
