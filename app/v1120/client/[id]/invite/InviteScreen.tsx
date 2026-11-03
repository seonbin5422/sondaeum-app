"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { Card, Icon, LinkButton, Screen, TopBar } from "../../../_components/ui";
import { buttonBase, buzz, Spinner, variantClasses } from "../../../_components/Pressable";
import { preloadKakao, shareKakaoCard } from "../../../_components/kakaoShare";
import { maskName } from "../../../_types";

export function InviteScreen({
  justRegistered = false,
  clientName,
  guardianName,
  guardianTitle,
  guardianPhone,
  caregiverName,
  chatPath,
  doneHref,
}: {
  justRegistered?: boolean;
  clientName: string;
  guardianName: string;
  guardianTitle: string; // contactTitle: 보호자·사회복지사·담당자·후견인
  guardianPhone: string | null;
  caregiverName: string;
  chatPath: string;
  doneHref: string;
}) {
  const [link, setLink] = useState(chatPath);
  // noshare: 공유 창이 없는 브라우저(PC, 카카오톡 안 브라우저 등)라 복사만 했음
  const [sent, setSent] = useState<null | "kakao" | "sms" | "copy" | "noshare">(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- build the absolute link once window is available
    setLink(`${window.location.origin}${chatPath}`);
    preloadKakao();
  }, [chatPath]);

  // 보호자가 읽는 글이라 "어르신"을 쓴다 (D-31)
  const message = `[손다음] 안녕하세요, ${guardianName} ${guardianTitle}님. ${clientName} 어르신을 돌보는 ${caregiverName} 요양보호사예요. 방문 보고서는 이 게시판에 올라오고 댓글로 이야기할 수 있어요. 따로 가입하지 않아도 돼요.`;

  const [busy, setBusy] = useState(false);
  // 같은 결과를 다시 눌러도 확인 표시가 다시 튀도록 누를 때마다 바꾼다
  const [tick, setTick] = useState(0);
  function done(v: NonNullable<typeof sent>) {
    setSent(v);
    setTick((t) => t + 1);
  }

  async function kakao() {
    if (busy) return;
    if (shareKakaoCard({ title: `${maskName(clientName)} 어르신 게시판`, description: "방문 보고서를 받아 보고 댓글로 이야기해요", image: "board", url: link, button: "게시판 열기" })) {
      done("kakao");
      return;
    }
    setBusy(true);
    try {
      if (navigator.share) {
        await navigator.share({ title: "손다음 게시판 초대", text: message, url: link });
        done("kakao");
      } else {
        await navigator.clipboard.writeText(`${message}\n${link}`);
        done("noshare");
      }
    } catch {
      // 공유 창을 닫으면 보낸 것으로 보지 않는다
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(`${message}\n${link}`);
      done("copy");
    } catch {}
  }

  const smsHref = guardianPhone ? `sms:${guardianPhone.replace(/[^\d]/g, "")}?&body=${encodeURIComponent(`${message}\n${link}`)}` : null;
  const at = (i: number) => ({ "--i": i }) as CSSProperties;
  const subBtn = `${buttonBase} ${variantClasses.secondary}`;

  return (
    <Screen white bottom={<LinkButton href={doneHref} variant="secondary">{sent ? "다 됐어요" : "나중에 하기"}</LinkButton>}>
      <TopBar backHref={doneHref} title={`${guardianTitle} 초대`} />
      {justRegistered && (
        <p className="enter-down flex items-center gap-2 rounded-2xl bg-(--success-soft) px-4 py-3 text-lg font-bold text-(--text-success)">
          <Icon name="check_circle" />
          {clientName} 정보를 등록했어요
        </p>
      )}

      <div style={at(0)}>
        <Card className="gap-3 px-5 py-6">
          <h1 className="text-[22px] font-bold leading-[1.4]">
            {guardianTitle}님을 <span className="whitespace-nowrap">게시판에 초대할까요?</span>
          </h1>
          <p className="text-lg font-medium text-muted">
            {guardianName} {guardianTitle}님{guardianPhone && <span className="whitespace-nowrap"> · {guardianPhone}</span>}
          </p>
          <ul className="flex flex-col gap-3">
            {["방문 보고서가 게시판에 자동으로 올라가요", `${guardianTitle}님이 궁금한 점을 댓글로 물어볼 수 있어요`, "따로 가입하지 않아도 돼요"].map((t) => (
              <li key={t} className="flex items-center gap-3 text-lg">
                <Icon name="check_circle" className="text-(--brand-secondary)" />
                <span className="flex-1">{t}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div style={at(1)}>
        <Card className="gap-2">
          <h2 className="text-base font-bold text-muted">{guardianTitle}님께 가는 글</h2>
          <div className="flex flex-col gap-2 rounded-2xl bg-(--bg-brand) p-4">
            <p className="text-lg">{message}</p>
            <p className="text-base font-medium text-(--text-brand)">＋ 게시판 링크</p>
          </div>
        </Card>
      </div>

      {sent && (
        <p
          key={tick}
          role="status"
          className={`done-pulse flex gap-2 rounded-2xl px-4 py-3 text-lg font-bold ${
            sent === "noshare" ? "bg-(--bg-brand) text-(--text-brand)" : "bg-(--success-soft) text-(--text-success)"
          }`}
        >
          <Icon name={sent === "noshare" ? "info" : "check_circle"} className="mt-0.5" />
          <span>
            {sent === "noshare"
              ? `이 브라우저에서는 카카오톡을 바로 열 수 없어요. 보낼 글과 링크를 복사했으니 카카오톡을 열어 ${guardianTitle}님께 붙여 넣어 주세요.`
              : sent === "copy"
                ? "복사했어요. 카카오톡이나 문자에 붙여 넣어 주세요."
                : sent === "sms"
                  ? "보낼 문자를 열었어요. 문자 앱에서 보내기를 눌러 주세요."
                  : `${guardianName} ${guardianTitle}님께 초대를 보냈어요`}
          </span>
        </p>
      )}

      <div className="enter flex flex-col gap-3" style={at(2)}>
        {/* 카카오톡 노란색은 카카오 공유 버튼 규정 색이라 토큰 대신 그대로 쓴다 */}
        <button
          type="button"
          onClick={kakao}
          onPointerDown={buzz}
          disabled={busy}
          aria-busy={busy || undefined}
          className={`${buttonBase} bg-[#fee500] text-black/85 active:brightness-95`}
        >
          {busy ? <Spinner /> : <Icon name="chat_bubble" />}
          {busy ? "여는 중이에요" : "카카오톡으로 초대하기"}
        </button>
        {smsHref ? (
          <a href={smsHref} onClick={() => done("sms")} onPointerDown={buzz} className={subBtn}>
            <span>
              문자로 보내기 <span className="whitespace-nowrap">({guardianPhone})</span>
            </span>
          </a>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-center text-base text-muted">보호자 전화번호가 없어 문자는 보낼 수 없어요. 수급자 정보에서 적어 주세요.</p>
            <button type="button" disabled className={subBtn}>
              문자로 보내기
            </button>
          </div>
        )}
        <button type="button" onClick={copy} onPointerDown={buzz} className={subBtn}>
          {sent === "copy" ? (
            <span key={tick} className="done-pulse flex items-center gap-2">
              <Icon name="check" />
              복사했어요
            </span>
          ) : (
            <>
              <Icon name="content_copy" />
              링크 복사하기
            </>
          )}
        </button>
      </div>
    </Screen>
  );
}
