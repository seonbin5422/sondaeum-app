"use client";

import { useEffect, useState } from "react";
import { LinkButton, Screen } from "../../../_components/ui";

// C-16 보호자에게 보내기 (와이어 263:334). ① 저장 완료 → ② 카카오톡으로 보내기, 보낸 뒤 누구에게 언제 보냈는지 초록으로.

function formatSent(d: Date) {
  const h = d.getHours();
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${h < 12 ? "오전" : "오후"} ${h % 12 || 12}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function SentScreen({
  visitId,
  shareToken,
  clientName,
  guardianName,
  guardianTitle,
  noContact,
  date,
}: {
  visitId: string;
  shareToken: string;
  clientName: string;
  guardianName: string;
  guardianTitle: string;
  noContact: boolean; // 보호자가 없는 수급자 (D-49)
  date: string;
}) {
  const [sharedAt, setSharedAt] = useState<Date | null>(null);
  const [copied, setCopied] = useState(false);
  const [link, setLink] = useState("");
  // shortcut: 보낸 시각을 이 기기(localStorage)에만 둔다, 다른 기기에서 보내면 모름. 대화방 저장(DIF-5) 때 DB로 옮긴다
  const key = `v1120:shared:${visitId}`;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- build the absolute link once window is available
    setLink(`${window.location.origin}/v1120/g/${shareToken}`);
    try {
      const saved = JSON.parse(localStorage.getItem(key) ?? "null") as { at: string; copied: boolean } | null;
      if (saved) {
        setSharedAt(new Date(saved.at));
        setCopied(saved.copied);
      }
    } catch {}
  }, [shareToken, key]);

  function markShared(byCopy: boolean) {
    const at = new Date();
    setSharedAt(at);
    setCopied(byCopy);
    try {
      localStorage.setItem(key, JSON.stringify({ at: at.toISOString(), copied: byCopy }));
    } catch {}
  }

  async function shareKakao() {
    const text = `${clientName} 어르신 ${date} 방문 보고서예요.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "손다음 방문 보고서", text, url: link });
        markShared(false);
      } else {
        // 공유 창이 없는 브라우저(PC, 카카오톡 안 브라우저 등): 보냈다고 하지 않고 복사했다고 알린다
        await navigator.clipboard.writeText(`${text}\n${link}`);
        markShared(true);
      }
    } catch {
      // 공유 창을 닫으면 보낸 것으로 보지 않는다
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      markShared(true);
    } catch {}
  }

  return (
    <Screen bottom={<LinkButton href="/v1120" variant="secondary">홈으로</LinkButton>}>
      <h1 className="text-xl font-bold">{noContact ? "기록 저장" : `${guardianTitle}님께 보내기`}</h1>

      <section className="flex flex-col gap-1 rounded-[15px] bg-(--success-soft) p-5">
        <p className="flex items-center gap-2 text-lg font-bold text-(--text-success)">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-(--success) text-base text-white">1</span>
          기록 저장 완료
        </p>
        <p className="text-base">
          {clientName} {date} 기록을 저장했어요.
        </p>
      </section>

      {noContact ? (
        <section className="flex flex-col gap-1 rounded-[15px] bg-(--neutral-soft) p-5">
          <p className="text-lg font-bold">보호자가 없어요</p>
          <p className="text-base">기록은 수급자의 방문 기록과 서류에 남아요. 보호자가 생기면 수급자 정보 수정에서 적어 주세요.</p>
        </section>
      ) : sharedAt ? (
        <section className="flex flex-col gap-1 rounded-[15px] bg-(--success-soft) p-5">
          <p className="flex items-center gap-2 text-lg font-bold text-(--text-success)">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-(--success) text-base text-white">2</span>
            {guardianName} {guardianTitle}님께 {copied ? "보낼 링크를 복사했어요" : "보냈어요"}
          </p>
          <p className="text-base">{formatSent(sharedAt)}</p>
          {copied && <p className="text-base text-muted">이 브라우저에서는 카카오톡을 바로 열 수 없어요. 카카오톡을 열어 {guardianTitle}님께 붙여 넣어 주세요.</p>}
          <a href={`/v1120/g/${shareToken}`} className="mt-1 inline-flex min-h-12 w-fit items-center text-base font-bold underline underline-offset-4">
            {guardianTitle}님이 보는 화면 열어 보기
          </a>
          <button
            type="button"
            onClick={shareKakao}
            className="mt-2 flex h-14 w-full items-center justify-center rounded-[15px] border border-border bg-white text-lg font-bold active:bg-accent-soft"
          >
            카카오톡으로 다시 보내기
          </button>
        </section>
      ) : (
        <section className="flex flex-col gap-3 rounded-[15px] p-5 ring-2 ring-accent">
          <p className="flex items-center gap-2 text-lg font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-base">2</span>
            {guardianTitle}님께 보내기
          </p>
          <p className="text-base">아직 {guardianTitle}님께 가지 않았어요. 아래 버튼을 눌러 카카오톡으로 보내 주세요.</p>
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
