"use client";

import { useEffect, useState } from "react";
import { Button, Icon, LinkButton, Screen } from "../../../_components/ui";
import { buzz, Spinner } from "../../../_components/Pressable";
import { preloadKakao, shareKakaoCard } from "../../../_components/kakaoShare";
import { caregiverTitle, maskName } from "../../../_types";

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
  caregiverName,
}: {
  visitId: string;
  shareToken: string;
  clientName: string;
  guardianName: string;
  guardianTitle: string;
  noContact: boolean; // 보호자가 없는 수급자 (D-49)
  date: string;
  caregiverName: string;
}) {
  const [sharedAt, setSharedAt] = useState<Date | null>(null);
  const [copied, setCopied] = useState(false);
  const [link, setLink] = useState("");
  const [sharing, setSharing] = useState(false); // 공유 창이 열리는 동안 다시 못 누르게
  // shortcut: 보낸 시각을 이 기기(localStorage)에만 둔다, 다른 기기에서 보내면 모름. 대화방 저장(DIF-5) 때 DB로 옮긴다
  const key = `v1120:shared:${visitId}`;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- build the absolute link once window is available
    setLink(`${window.location.origin}/v1120/g/${shareToken}`);
    preloadKakao();
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
    setSharing(true);
    try {
      await shareKakaoInner();
    } finally {
      setSharing(false);
    }
  }

  async function shareKakaoInner() {
    const text = `${clientName} 어르신 ${date} 방문 보고서예요.`;
    if (shareKakaoCard({ title: `${date} 방문 보고서`, description: `${maskName(clientName)} 어르신 · ${caregiverTitle(caregiverName)}가 보냈어요`, image: "report", url: link, button: "보고서 보기" })) {
      markShared(false);
      return;
    }
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

  const kakaoButton = (label: string) => (
    <button
      type="button"
      onPointerDown={buzz}
      onClick={shareKakao}
      disabled={sharing}
      className="press flex h-14 w-full items-center justify-center gap-2 rounded-[15px] bg-[#fee500] text-lg font-bold text-black/85 active:bg-[#e6cf00] disabled:opacity-60"
    >
      {sharing ? <Spinner /> : <Icon name="chat_bubble" />}
      {sharing ? "카카오톡을 여는 중이에요" : label}
    </button>
  );

  return (
    <Screen
      white
      bottom={
        // 홈으로: 보내기(카카오톡 또는 링크 복사) 전에는 비활성 + 이유, 보호자가 없으면 처음부터 켬
        sharedAt || noContact ? (
          <LinkButton href="/v1120">홈으로</LinkButton>
        ) : (
          <Button disabled disabledReason="카카오톡으로 보내거나 링크를 복사하면 켜져요.">
            홈으로
          </Button>
        )
      }
    >
      {/* 공통/상단 바에서 뒤로를 뺀 모양: 보낸 뒤에는 돌아가 고칠 수 없어 제목을 왼쪽에 둔다 (Figma 558:2413) */}
      <div className="full-bleed -mt-5 flex h-16 items-center bg-(--screen-bg)">
        {/* 제목은 게시판·내 정보 탭처럼 가운데 내용 칸 왼쪽 20에 (padding %는 바깥 칸 기준이라 PC에서 어긋났음) */}
        <h1 className="mx-auto w-full max-w-md px-5 text-[22px] font-bold leading-[1.4] tracking-[-0.02em]">
          {noContact ? "기록 저장" : `${guardianTitle}에게 보내기`}
        </h1>
      </div>

      {/* Figma 558:2414: 저장 완료 칸과 보내기 칸 사이 4px */}
      <div className="flex flex-col gap-1">
      <section className="enter flex flex-col gap-3 rounded-2xl bg-(--success-soft) p-5 leading-[1.4]">
        <p className="flex items-center gap-3 text-xl font-bold">
          <Icon name="check_circle" size={32} className="pop text-(--success)" />
          기록 저장 완료
        </p>
        <p className="text-lg text-muted">
          {clientName} <span className="whitespace-nowrap">{date}</span> 기록을 저장했어요.
        </p>
      </section>

      {noContact ? (
        <section className="enter flex flex-col gap-2 rounded-2xl bg-white p-5 leading-[1.4]" style={{ "--i": 1 } as React.CSSProperties}>
          <p className="text-xl font-bold">보호자가 없어요</p>
          <p className="text-lg text-muted">기록은 수급자의 방문 기록과 서류에 남아요. 보호자가 생기면 수급자 정보 수정에서 적어 주세요.</p>
        </section>
      ) : sharedAt ? (
        // 보낸·복사한 순간 이 칸이 바뀌며 통 튄다 (done-pulse)
        <section key={sharedAt.getTime()} className="done-pulse flex flex-col gap-3 rounded-2xl bg-white p-5 leading-[1.4]" aria-live="polite">
          <p className="flex items-center gap-3 text-xl font-bold">
            <Icon name="check_circle" size={32} className="text-(--success)" />
            <span>
              <span className="whitespace-nowrap">{guardianName} {guardianTitle}님께</span>{" "}
              {copied ? "보낼 링크를 복사했어요" : "보냈어요"}
            </span>
          </p>
          <p className="text-lg text-muted">{formatSent(sharedAt)}</p>
          {copied && (
            <p className="text-base text-muted">
              이 브라우저에서는 카카오톡을 바로 열 수 없어요. 카카오톡을 열어 <span className="whitespace-nowrap">{guardianTitle}님께</span> 붙여 넣어 주세요.
            </p>
          )}
          <a
            href={`/v1120/g/${shareToken}`}
            className="press inline-flex min-h-12 w-fit items-center gap-1 rounded-xl text-base font-bold text-(--text-brand) active:opacity-60"
          >
            {guardianTitle}님이 보는 화면 열어 보기 ›
          </a>
          {kakaoButton("카카오톡으로 다시 보내기")}
          <Button variant="secondary" onClick={copy}>
            링크 다시 복사하기
          </Button>
        </section>
      ) : (
        <section className="enter flex flex-col gap-3 rounded-2xl bg-white p-5 leading-[1.4]" style={{ "--i": 1 } as React.CSSProperties}>
          <p className="flex items-center gap-3 text-xl font-bold">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-lg">2</span>
            {guardianTitle}님께 보내기
          </p>
          <p className="text-lg text-muted">
            {/* DIF-1-5(11/13 2차 평가): '저장하고 보내기' 뒤에 '아직 안 갔다'고 하면 보낸 건지 헷갈려서, 남은 한 단계로 안내 */}
            마지막 한 단계예요.
            <br />
            카카오톡으로 보내면 <span className="whitespace-nowrap">{guardianTitle}님이</span> 바로 볼 수 있어요.
          </p>
          {kakaoButton("카카오톡으로 보내기")}
          <Button variant="secondary" onClick={copy}>
            링크 복사하기
          </Button>
        </section>
      )}
      </div>
    </Screen>
  );
}
