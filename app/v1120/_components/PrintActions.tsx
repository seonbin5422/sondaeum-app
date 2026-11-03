"use client";

import { useState } from "react";
import { Button, Icon } from "./ui";
import { Spinner } from "./Pressable";

// 서류 화면 아래 버튼 (Figma 516:765). "PDF로 저장"과 "인쇄하기"는 브라우저 인쇄 창을 연다 (PDF는 인쇄 창에서 "PDF로 저장").
// share가 있으면 "보호자 게시판에 올리기": 그 수급자 게시판에 글로 올린다 (같은 기간은 한 번만)
export function PrintActions({ share }: { share?: () => Promise<void> }) {
  const [shared, setShared] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-2 pt-2 print:hidden">
      <Button onClick={() => window.print()}>
        <Icon name="picture_as_pdf" />
        PDF로 저장
      </Button>
      <Button variant="secondary" className="bg-white! active:bg-(--line)!" onClick={() => window.print()}>
        <Icon name="print" />
        인쇄하기
      </Button>
      {share && (
        <Button
          variant="secondary"
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
          aria-busy={busy || undefined}
          // 회색 바탕 위라 보조 버튼은 흰 면. 처리 중·올린 뒤에는 흐리게 하지 않고 상태를 보여 준다
          className={shared ? "done-pulse bg-(--success-soft)! text-(--text-success)! disabled:opacity-100!" : busy ? "bg-white! disabled:opacity-100!" : "bg-white! active:bg-(--line)!"}
        >
          {shared ? (
            <>
              <Icon name="check_circle" />
              게시판에 올렸어요
            </>
          ) : busy ? (
            <>
              <Spinner />
              올리는 중이에요
            </>
          ) : (
            "보호자 게시판에 올리기"
          )}
        </Button>
      )}
      {error && <p role="alert" className="text-base text-(--text-danger)">{error}</p>}
    </div>
  );
}
