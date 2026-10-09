"use client";

import { useState } from "react";

// 서류 화면 아래 버튼. "PDF로 저장"과 "인쇄하기"는 브라우저 인쇄 창을 연다 (PDF는 인쇄 창에서 "PDF로 저장").
export function PrintActions({ canShare }: { canShare: boolean }) {
  const [shared, setShared] = useState(false);
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
      {canShare && (
        <button
          type="button"
          onClick={() => setShared(true)}
          disabled={shared}
          className="flex h-14 w-full items-center justify-center rounded-[15px] border border-border bg-white text-lg font-bold disabled:border-transparent disabled:bg-(--success-soft) disabled:text-(--success)"
        >
          {shared ? "✓ 대화방에 올렸어요" : "대화방에 올리기"}
        </button>
      )}
    </div>
  );
}
