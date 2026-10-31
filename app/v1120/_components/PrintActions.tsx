"use client";

import { useState } from "react";

// 서류 화면 아래 버튼. "PDF로 저장"과 "인쇄하기"는 브라우저 인쇄 창을 연다 (PDF는 인쇄 창에서 "PDF로 저장").
// share가 있으면 "게시판에 올리기": 그 수급자 게시판에 글로 올린다 (같은 기간은 한 번만)
export function PrintActions({ share }: { share?: () => Promise<void> }) {
  const [shared, setShared] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-3 print:hidden">
      <button
        type="button"
        onClick={() => window.print()}
        className="flex h-16 w-full items-center justify-center rounded-[15px] bg-accent text-lg font-bold text-accent-foreground active:bg-accent-dark"
      >
        PDF로 저장
      </button>
      <button
        type="button"
        onClick={() => window.print()}
        className="flex h-14 w-full items-center justify-center rounded-[15px] border border-border bg-white text-lg font-bold"
      >
        인쇄하기
      </button>
      {share && (
        <button
          type="button"
          onClick={async () => {
            setBusy(true);
            setError(null);
            try {
              await share();
              setShared(true);
            } catch (e) {
              setError(e instanceof Error ? e.message : "게시판에 올리지 못했어요. 다시 해 주세요.");
            } finally {
              setBusy(false);
            }
          }}
          disabled={shared || busy}
          className="flex h-14 w-full items-center justify-center rounded-[15px] border border-border bg-white text-lg font-bold disabled:border-transparent disabled:bg-(--success-soft) disabled:text-(--text-success)"
        >
          {shared ? "✓ 게시판에 올렸어요" : busy ? "올리는 중…" : "게시판에 올리기"}
        </button>
      )}
      {error && <p className="text-base text-(--danger)">{error}</p>}
    </div>
  );
}
