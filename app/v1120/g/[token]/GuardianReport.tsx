"use client";

import { useEffect, useState } from "react";
import { ReportSections } from "../../_components/ReportView";
import { loadDraft } from "../../_store";
import { findVisit, historyByClient, sampleGuardianReport, visitInfo } from "../../_mock";
import type { CareRecord } from "../../_types";

// G-01 보호자 보고서 (와이어 263:692). ?order=improved 를 붙이면 개선안(263:822, PR #9 머지 보류) 순서로 본다.
// 같은 브라우저에서 방금 보낸 기록이 있으면 그것을, 없으면 예시 보고서를 보여 준다.

function formatVisit(startIso: string, endIso: string) {
  const s = new Date(startIso);
  const e = new Date(endIso);
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const hm = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  const hours = Math.round((e.getTime() - s.getTime()) / 3_600_000);
  return `${s.getMonth() + 1}월 ${s.getDate()}일 (${days[s.getDay()]}) ${hm(s)} ~ ${hm(e)} · ${hours}시간`;
}

export function GuardianReport({ token, order }: { token: string; order: "base" | "improved" }) {
  // 이력(C-22)·대화방 카드에서 열면 그 날짜 기록을, 아니면 예시 보고서를 보여 준다
  const past = Object.values(historyByClient).flat().find((v) => v.visitId === token);
  const report = past
    ? { ...sampleGuardianReport, startedAt: `${past.date}T${past.start}:00+09:00`, endedAt: `${past.date}T${past.end}:00+09:00`, record: past.record }
    : sampleGuardianReport;
  const [record, setRecord] = useState<CareRecord>(report.record);
  const [justSent, setJustSent] = useState(false);

  useEffect(() => {
    const draft = loadDraft(token);
    if (draft.sentAt) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- use the just-sent draft from this browser if there is one
      setRecord(draft.record);
      setJustSent(true);
    }
  }, [token]);

  // 방금 보낸 기록이면 그 방문의 수급자 이름과 서비스 시간을 쓴다
  const visit = findVisit(token);
  const head =
    justSent && visit
      ? { ...report, clientName: visit.clientName, startedAt: visitInfo(token).startedAt, endedAt: visitInfo(token).endedAt }
      : report;

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-5 p-6">
      <header className="flex flex-col gap-1">
        <p className="text-base text-muted">안녕하세요, {report.guardianName} 보호자님</p>
        <h1 className="text-2xl font-bold">{head.clientName} 어르신 방문 보고서</h1>
        <p className="text-lg text-muted">{formatVisit(head.startedAt, head.endedAt)}</p>
      </header>

      <div className="flex flex-col gap-1 rounded-xl bg-accent-soft px-4 py-3 text-base text-accent-soft-foreground">
        <p className="font-bold">급여제공기록지와 같은 항목으로 정리했어요</p>
        <p>요양보호사가 방문 중 한 일을 확인하고 보낸 기록이에요.</p>
      </div>

      <ReportSections record={record} order={order} />

      <p className="rounded-xl bg-(--neutral-soft) px-4 py-3 text-base text-muted">
        {report.caregiverName} 요양보호사가 작성하고 확인한 기록이에요. 의료적 판단이 아니에요. 궁금한 점은 담당 기관에
        물어봐 주세요.
      </p>
    </main>
  );
}
