"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { LinkButton, Screen } from "../../../_components/ui";
import { findVisit, guardianName, visitInfo } from "../../../_mock";

// C-16 보호자에게 보내기 (와이어 263:334). ① 저장 완료 → ② 카카오톡으로 보내기, 보낸 뒤 누구에게 언제 보냈는지 초록으로.

function formatSent(d: Date) {
  const h = d.getHours();
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${h < 12 ? "오전" : "오후"} ${h % 12 || 12}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function SentPage() {
  const { id } = useParams<{ id: string }>();
  const visit = findVisit(id);
  const visitTime = visitInfo(id);
  const [sharedAt, setSharedAt] = useState<Date | null>(null);
  const [copied, setCopied] = useState(false);
  const [link, setLink] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- build the absolute link once window is available
    setLink(`${window.location.origin}/v1120/g/${id}`);
  }, [id]);

  async function shareKakao() {
    const text = `${visit?.clientName ?? ""} 어르신 ${visitTime.date} 방문 보고서예요.`;
    try {
      if (navigator.share) await navigator.share({ title: "손다음 방문 보고서", text, url: link });
      else await navigator.clipboard.writeText(link);
      setSharedAt(new Date());
    } catch {
      // 공유 창을 닫으면 보낸 것으로 보지 않는다
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setSharedAt(new Date());
    } catch {}
  }

  return (
    <Screen bottom={<LinkButton href="/v1120" variant="secondary">홈으로</LinkButton>}>
      <h1 className="text-xl font-bold">보호자에게 보내기</h1>

      <section className="flex flex-col gap-1 rounded-[15px] bg-(--success-soft) p-5">
        <p className="flex items-center gap-2 text-lg font-bold text-(--success)">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-(--success) text-base text-white">1</span>
          기록 저장 완료
        </p>
        <p className="text-base">
          {visit?.clientName} 수급자 {visitTime.date} 기록을 저장했어요.
        </p>
      </section>

      {sharedAt ? (
        <section className="flex flex-col gap-1 rounded-[15px] bg-(--success-soft) p-5">
          <p className="flex items-center gap-2 text-lg font-bold text-(--success)">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-(--success) text-base text-white">2</span>
            {guardianName} 보호자님께 {copied ? "보낼 링크를 복사했어요" : "보냈어요"}
          </p>
          <p className="text-base">{formatSent(sharedAt)}</p>
          {copied && <p className="text-base text-muted">카카오톡이나 문자에 붙여 넣어 보내 주세요.</p>}
          <a href={`/v1120/g/${id}`} className="mt-2 text-base font-bold underline underline-offset-4">
            보호자님이 보는 화면 열어 보기
          </a>
        </section>
      ) : (
        <section className="flex flex-col gap-3 rounded-[15px] p-5 ring-2 ring-accent">
          <p className="flex items-center gap-2 text-lg font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-base">2</span>
            보호자님께 보내기
          </p>
          <p className="text-base">아직 보호자님께 가지 않았어요. 아래 버튼을 눌러 카카오톡으로 보내 주세요.</p>
          <button
            type="button"
            onClick={shareKakao}
            className="flex h-16 w-full items-center justify-center rounded-[15px] bg-accent text-lg font-bold text-accent-foreground active:bg-accent-dark"
          >
            카카오톡으로 보내기
          </button>
          <button
            type="button"
            onClick={copy}
            className="flex h-14 w-full items-center justify-center rounded-[15px] border border-border bg-white text-lg font-bold active:bg-accent-soft"
          >
            링크 복사하기
          </button>
        </section>
      )}
    </Screen>
  );
}
