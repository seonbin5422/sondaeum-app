"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Screen } from "../../../_components/ui";
import { summarizeVisit } from "../../../_actions";

// C-13 AI 처리중. 서버(summarizeVisit)가 녹음 내용을 급여제공기록지 모양으로 정리해 저장하면 C-14로 넘어간다.
export default function ProcessingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    summarizeVisit(id).then(
      () => router.replace(`/v1120/visit/${id}/review`),
      () => setFailed(true),
    );
  }, [id, router, attempt]);

  return (
    <Screen>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        {failed ? (
          <>
            <p className="text-xl font-bold">정리하지 못했어요</p>
            <p className="text-lg text-muted">녹음 내용은 저장돼 있어요. 다시 눌러 주세요.</p>
            <Button
              onClick={() => {
                setFailed(false);
                setAttempt((n) => n + 1);
              }}
            >
              다시 정리하기
            </Button>
          </>
        ) : (
          <>
            <span className="h-14 w-14 animate-spin rounded-full border-4 border-accent-soft border-t-accent" />
            <p className="text-xl font-bold">AI가 급여제공기록지에 맞춰 정리하고 있어요</p>
            <p className="text-lg text-muted">잠깐만 기다려 주세요. 보통 10초 안에 끝나요.</p>
          </>
        )}
      </div>
    </Screen>
  );
}
