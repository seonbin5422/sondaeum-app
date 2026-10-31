"use client";

import { ReportSections } from "../../_components/ReportView";
import { chatTokenToClient, historyByClient, sampleGuardianReport } from "../../_mock";
import { BackButton } from "../../_components/BackButton";
import { LinkButton } from "../../_components/ui";
import type { GuardianReportProps } from "../../_types";

// G-01 보호자 보고서 (와이어 263:692). ?order=improved 를 붙이면 개선안(263:822, PR #9 머지 보류) 순서로 본다.
// 보낸 기록(DB)이 있으면 그것을, 없으면(이력 화면의 임시 데이터) 예시 보고서를 보여 준다.

function formatVisit(startIso: string, endIso: string) {
  const s = new Date(startIso);
  const e = new Date(endIso);
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const hm = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  const minutes = Math.round((e.getTime() - s.getTime()) / 60_000);
  const length = minutes < 60 ? `${minutes}분` : `${Math.round(minutes / 60)}시간`;
  return `${s.getMonth() + 1}월 ${s.getDate()}일 (${days[s.getDay()]}) ${hm(s)} ~ ${hm(e)} · ${length}`;
}

export function GuardianReport({ token, order, sent, fromBoard = false }: { token: string; order: "base" | "improved"; sent: GuardianReportProps | null; fromBoard?: boolean }) {
  // 이력(C-22)·게시판 글에서 열면 그 날짜 기록을, 아니면 예시 보고서를 보여 준다
  const past = Object.values(historyByClient).flat().find((v) => v.visitId === token);
  const report = past
    ? { ...sampleGuardianReport, startedAt: `${past.date}T${past.start}:00+09:00`, endedAt: `${past.date}T${past.end}:00+09:00`, record: past.record }
    : sampleGuardianReport;
  const head = sent ?? report;
  const record = head.record;

  // 돌아갈 곳이 없을 때(카카오톡 링크로 바로 들어옴) 보낼 보호자 게시판. 보낸 기록이면 그 어르신의 실제 게시판
  const clientId = past ? Object.keys(historyByClient).find((k) => historyByClient[k].includes(past)) : undefined;
  const chatToken = Object.keys(chatTokenToClient).find((t) => chatTokenToClient[t] === clientId);

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-5 p-6">
      <BackButton fallback={sent ? `/v1120/g/${token}/board` : chatToken ? `/v1120/c/${chatToken}/chat` : "/v1120"} />
      <header className="flex flex-col gap-1">
        <p className="text-base text-muted">안녕하세요, {head.guardianName} {head.guardianTitle ?? "보호자"}님</p>
        <h1 className="text-2xl font-bold">{head.clientName} 어르신 방문 보고서</h1>
        <p className="text-lg text-muted">{formatVisit(head.startedAt, head.endedAt)}</p>
      </header>

      <div className="flex flex-col gap-1 rounded-xl bg-accent-soft px-4 py-3 text-base text-accent-soft-foreground">
        <p className="font-bold">급여제공기록지와 같은 항목으로 정리했어요</p>
        <p>요양보호사가 방문 중 한 일을 확인하고 보낸 기록이에요.</p>
      </div>

      <ReportSections record={record} order={order} />

      {/* 게시판의 "보고서 전체 보기"로 들어왔으면 게시판으로 돌아가는 버튼은 안 보인다(뒤로가기로 돌아감) */}
      {sent && !fromBoard && <LinkButton href={`/v1120/g/${token}/board`}>게시판으로 이동하기</LinkButton>}

      <p className="rounded-xl bg-(--neutral-soft) px-4 py-3 text-base text-muted">
        {head.caregiverName} 요양보호사가 작성하고 확인한 기록이에요. 의료적 판단이 아니에요. 궁금한 점은 담당 기관에
        물어봐 주세요.
      </p>
    </main>
  );
}
