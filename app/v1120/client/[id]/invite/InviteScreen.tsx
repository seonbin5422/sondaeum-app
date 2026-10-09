"use client";

import { useEffect, useState } from "react";
import { LinkButton, Screen, TopBar } from "../../../_components/ui";

export function InviteScreen({
  justRegistered = false,
  clientName,
  guardianName,
  guardianPhone,
  caregiverName,
  chatPath,
  doneHref,
}: {
  justRegistered?: boolean;
  clientName: string;
  guardianName: string;
  guardianPhone: string | null;
  caregiverName: string;
  chatPath: string;
  doneHref: string;
}) {
  const [link, setLink] = useState(chatPath);
  const [sent, setSent] = useState<null | "kakao" | "sms" | "copy">(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- build the absolute link once window is available
    setLink(`${window.location.origin}${chatPath}`);
  }, [chatPath]);

  // 보호자가 읽는 글이라 "어르신"을 쓴다 (D-31)
  const message = `[손다음] 안녕하세요, ${guardianName} 보호자님. ${clientName} 어르신을 돌보는 ${caregiverName} 요양보호사예요. 방문 보고서와 대화, 서류 만들기는 이 대화방에서 할 수 있어요. 따로 가입하지 않아도 돼요.`;

  async function kakao() {
    try {
      if (navigator.share) await navigator.share({ title: "손다음 대화방 초대", text: message, url: link });
      else await navigator.clipboard.writeText(`${message}\n${link}`);
      setSent("kakao");
    } catch {
      // 공유 창을 닫으면 보낸 것으로 보지 않는다
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(`${message}\n${link}`);
      setSent("copy");
    } catch {}
  }

  const smsHref = guardianPhone ? `sms:${guardianPhone.replace(/[^\d]/g, "")}?&body=${encodeURIComponent(`${message}\n${link}`)}` : null;

  return (
    <Screen bottom={<LinkButton href={doneHref} variant="secondary">{sent ? "다 됐어요" : "나중에 하기"}</LinkButton>}>
      <TopBar backHref={doneHref} />
      {justRegistered && (
        <p className="flex items-center gap-2 rounded-xl bg-(--success-soft) px-4 py-3 text-lg font-bold text-(--success)">
          ✓ {clientName} 수급자를 등록했어요
        </p>
      )}
      <header>
        <h1 className="text-2xl font-bold">보호자님을 대화방에 초대할까요?</h1>
        <p className="text-lg text-muted">
          {guardianName} 보호자님{guardianPhone ? ` · ${guardianPhone}` : ""}
        </p>
      </header>

      <ul className="flex flex-col gap-1 rounded-xl bg-accent-soft px-4 py-3 text-base text-accent-soft-foreground">
        <li>· 방문 보고서가 대화방에 자동으로 올라가요</li>
        <li>· 보호자님이 궁금한 점을 바로 물어볼 수 있어요</li>
        <li>· 보호자님도 대화방에서 서류를 만들 수 있어요</li>
      </ul>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold">보호자님께 가는 글</h2>
        <div className="rounded-[15px] border border-border p-4 text-lg">
          {message}
          <p className="mt-2 text-base font-bold text-accent-soft-foreground">＋ 대화방 링크</p>
        </div>
      </section>

      {sent ? (
        <p className="rounded-xl bg-(--success-soft) px-4 py-3 text-lg font-bold text-(--success)">
          ✓ {guardianName} 보호자님께 {sent === "copy" ? "보낼 글과 링크를 복사했어요. 카카오톡이나 문자에 붙여 넣어 주세요." : "초대를 보냈어요"}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={kakao}
            className="flex h-16 w-full items-center justify-center rounded-[15px] bg-accent text-lg font-bold text-accent-foreground active:bg-accent-dark"
          >
            카카오톡으로 초대하기
          </button>
          {smsHref ? (
            <a
              href={smsHref}
              onClick={() => setSent("sms")}
              className="flex h-14 w-full items-center justify-center rounded-[15px] border border-border bg-white text-lg font-bold active:bg-accent-soft"
            >
              문자로 보내기 ({guardianPhone})
            </a>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-center text-base text-muted">보호자 전화번호가 없어 문자는 보낼 수 없어요. 수급자 정보에서 적어 주세요.</p>
              <span className="flex h-14 w-full items-center justify-center rounded-[15px] bg-(--neutral-soft) text-lg font-bold text-muted">문자로 보내기</span>
            </div>
          )}
          <button
            type="button"
            onClick={copy}
            className="flex h-14 w-full items-center justify-center rounded-[15px] border border-border bg-white text-lg font-bold active:bg-accent-soft"
          >
            링크 복사하기
          </button>
        </div>
      )}
    </Screen>
  );
}
