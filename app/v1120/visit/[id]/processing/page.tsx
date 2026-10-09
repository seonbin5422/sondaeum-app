"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Screen } from "../../../_components/ui";
import { loadDraft, saveDraft } from "../../../_store";
import { extractRecord } from "../../../_extract";

// C-13 AI 처리중. 1120.ver에서는 AI 대신 _extract.ts가 녹음 내용에서 칸을 채운 뒤 C-14로 넘어간다.
export default function ProcessingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    const { record, quotes } = extractRecord(loadDraft(id).transcript);
    saveDraft(id, { record, quotes, sentAt: null });
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
