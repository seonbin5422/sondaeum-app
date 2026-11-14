"use client";

import { ReportSections } from "../../_components/ReportView";
import { chatTokenToClient, historyByClient, sampleGuardianReport } from "../../_mock";
import { BackButton } from "../../_components/BackButton";
import { LinkButton, Screen, TopBar, TOP_BACK } from "../../_components/ui";
import { caregiverTitle, type GuardianReportProps } from "../../_types";
import { GuardianSignForm } from "../../_components/SignatureBox";

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

export function GuardianReport({ token, order, sent, fromBoard = false, asCaregiver = false }: { token: string; order: "base" | "improved"; sent: GuardianReportProps | null; fromBoard?: boolean; asCaregiver?: boolean }) {
  // 이력(C-22)·게시판 글에서 열면 그 날짜 기록을, 아니면 예시 보고서를 보여 준다
  const past = Object.values(historyByClient).flat().find((v) => v.visitId === token);
  const report = past
    ? { ...sampleGuardianReport, startedAt: `${past.date}T${past.start}:00+09:00`, endedAt: `${past.date}T${past.end}:00+09:00`, record: past.record }
    : sampleGuardianReport;
  const head = sent ?? report;
  // 요양보호사로 로그인해 "보호자가 보는 화면"을 열었으면 게시판도 요양보호사 게시판(C-18)으로 (사용자 11/14)
  const boardHref = asCaregiver && sent?.clientId ? `/v1120/chats/${sent.clientId}/${token}` : `/v1120/g/${token}/board`;
  const record = head.record;

  // 돌아갈 곳이 없을 때(카카오톡 링크로 바로 들어옴) 보낼 보호자 게시판. 보낸 기록이면 그 어르신의 실제 게시판
  const clientId = past ? Object.keys(historyByClient).find((k) => historyByClient[k].includes(past)) : undefined;
  const chatToken = Object.keys(chatTokenToClient).find((t) => chatTokenToClient[t] === clientId);

  return (
    // 1128 테마: C-15 "보낼 내용 보기"와 같은 모양 (회색 바탕·흰 상단 바·흰 면 카드)
    <Screen>
      <TopBar
        title="방문 보고서"
        back={<BackButton icon className={TOP_BACK} fallback={sent ? boardHref : chatToken ? `/v1120/c/${chatToken}/chat` : "/v1120"} />}
      />
      <div className="enter flex flex-col gap-1 rounded-2xl bg-(--bg-brand) p-5 text-base leading-[1.4] text-(--text-brand)">
        <p className="font-bold">급여제공기록지와 같은 항목으로 정리했어요</p>
        <p>요양보호사가 방문 중 한 일을 확인하고 보낸 기록이에요.</p>
      </div>

      {/* 제목은 카드 없이 바탕 위에 */}
      <header className="enter flex flex-col gap-1 pt-2 leading-[1.4]">
        <p className="text-base text-muted">
          안녕하세요, <span className="whitespace-nowrap">{head.guardianName} {head.guardianTitle ?? "보호자"}님</span>
        </p>
        <h1 className="text-[22px] font-bold tracking-[-0.02em]">
          <span className="whitespace-nowrap">{head.clientName} 어르신</span> 방문 보고서
        </h1>
        <p className="text-base text-muted">{formatVisit(head.startedAt, head.endedAt)}</p>
      </header>

      <ReportSections record={record} order={order} flat />

      {/* 확인 서명 (D-48 261114.ver): 요양보호사가 보낸 뒤 보호자가 여기서 서명해 제출한다. 급여제공기록지 서명칸에 들어간다 */}
      {sent && (
        <section className="enter flex flex-col gap-3 rounded-2xl bg-white p-5 leading-[1.4]">
          <h2 className="text-xl font-bold">확인 서명</h2>
          {asCaregiver ? (
            <p className="rounded-xl bg-(--bg-secondary) px-4 py-3 text-base leading-[1.4]">
              {sent.recipientSigned ? "보호자가 서명을 보냈어요." : "보호자가 이 화면에서 서명해요."} 요양보호사로 로그인되어 있어 서명칸은 보이지 않아요.
            </p>
          ) : (
            <>
              <p className="text-base text-muted">보고서 내용을 확인하셨으면 서명해 주세요. 기관에 내는 급여제공기록지에 함께 들어가요.</p>
              <GuardianSignForm token={token} signed={!!sent.recipientSigned} />
            </>
          )}
        </section>
      )}

      {/* 게시판의 "보고서 전체 보기"로 들어왔으면 게시판으로 돌아가는 버튼은 안 보인다(뒤로가기로 돌아감) */}
      {sent && !fromBoard && <LinkButton href={boardHref}>게시판으로 이동하기</LinkButton>}

      <p className="rounded-2xl bg-white p-5 text-base leading-[1.4] text-muted">
        {caregiverTitle(head.caregiverName)}가 작성하고 확인한 기록이에요. 의료적 판단이 아니에요. 궁금한 점은 담당 기관에
        물어봐 주세요.
      </p>
    </Screen>
  );
}
