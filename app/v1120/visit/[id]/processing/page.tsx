"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Screen } from "../../../_components/ui";
import { saveDraft } from "../../../_store";
import { aiDraftRecord } from "../../../_mock";

// C-13 AI 처리중. 1120.ver에서는 AI를 부르지 않고 임시 초안을 넣은 뒤 C-14로 넘어간다.
export default function ProcessingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    saveDraft(id, { record: structuredClone(aiDraftRecord), sentAt: null });
    const t = setTimeout(() => router.replace(`/v1120/visit/${id}/review`), 1800);
    return () => clearTimeout(t);
  }, [id, router]);

  return (
    <Screen>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <span className="h-14 w-14 animate-spin rounded-full border-4 border-accent-soft border-t-accent" />
        <p className="text-xl font-bold">AI가 급여제공기록지에 맞춰 정리하고 있어요</p>
        <p className="text-lg text-muted">잠깐만 기다려 주세요. 보통 10초 안에 끝나요.</p>
      </div>
    </Screen>
  );
}
