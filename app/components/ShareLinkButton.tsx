"use client";

import { useState } from "react";
import Script from "next/script";
import { Button } from "@/app/components/ui/Button";

declare global {
  interface Window {
    Kakao?: {
      isInitialized: () => boolean;
      init: (key: string) => void;
      Share: { sendDefault: (options: Record<string, unknown>) => void };
    };
  }
}

export function ShareLinkButton({
  url,
  title,
  text,
  onShared,
}: {
  url: string;
  title: string;
  text: string;
  onShared?: () => void;
}) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  function handleKakaoSdkLoad() {
    // NEXT_PUBLIC_ 값은 빌드 시점에 코드로 그대로 박혀서 서버용 cleanEnv()를 못 타므로,
    // 여기서 직접 선행 BOM/공백을 제거한다 (2026-08 GROQ_API_KEY 등에서 겪은 것과 동일한 함정).
    const rawKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
    const key = rawKey ? rawKey.split("").filter((ch) => ch.charCodeAt(0) !== 0xfeff).join("").trim() : rawKey;
    if (key && window.Kakao && !window.Kakao.isInitialized()) {
      window.Kakao.init(key);
    }
  }

  async function handleShare() {
    // 카카오톡 앱으로 바로 전달(text 템플릿, 이미지/버튼 없는 순수 링크 메시지).
    // 2026-08-19에 폐기했던 Feed 카드 메시지와 달리 수신 동의 화면 없이 전달되길 기대하지만,
    // 실기기 검증 전까지는 확정 아님 — 재현되면 아래 OS 공유시트/클립보드 경로로 되돌릴 것.
    if (window.Kakao?.isInitialized()) {
      try {
        window.Kakao.Share.sendDefault({
          objectType: "text",
          text: `${text}\n${url}`,
          link: { mobileWebUrl: url, webUrl: url },
        });
        onShared?.();
        return;
      } catch {
        // PC 브라우저는 팝업 창 방식이라 팝업이 차단되면 여기로 떨어짐 —
        // 아래 OS 공유시트/클립보드 복사로 이어간다.
      }
    }

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        onShared?.();
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          // 사용자가 공유 시트를 취소한 경우 — 별도 처리 불필요
        }
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setStatus("copied");
      onShared?.();
    } catch {
      setStatus("failed");
    }
    setTimeout(() => setStatus("idle"), 2500);
  }

  return (
    <div className="flex w-full flex-col items-center gap-2">
      <Script src="https://developers.kakao.com/sdk/js/kakao.min.js" onLoad={handleKakaoSdkLoad} />
      <Button type="button" variant="secondary" onClick={handleShare}>
        💬 카카오톡 공유하기
      </Button>
      {status === "copied" && (
        <p className="text-muted text-sm">링크가 복사되었어요. 카카오톡에 붙여넣어 보내주세요.</p>
      )}
      {status === "failed" && (
        <p className="text-record text-sm">복사에 실패했어요. 아래 링크를 직접 눌러 복사해주세요.</p>
      )}
    </div>
  );
}
