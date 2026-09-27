"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/Button";

export function ProcessingScreen({ visitId }: { visitId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`/api/visits/${visitId}/summarize`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "AI 요약에 실패했습니다.");
      }
      router.push(`/visit/${visitId}/review`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다.");
    }
  }, [visitId, router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- kicks off the one-time AI summarize call on mount
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
      {!error ? (
        <>
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-accent-soft border-t-accent" />
          <p className="text-xl font-semibold">AI가 방문 내용을 정리하고 있어요...</p>
          <p className="text-muted text-base">잠시만 기다려주세요.</p>
        </>
      ) : (
        <>
          <p className="text-xl font-semibold text-record">{error}</p>
          <Button onClick={run}>다시 시도</Button>
        </>
      )}
    </div>
  );
}
