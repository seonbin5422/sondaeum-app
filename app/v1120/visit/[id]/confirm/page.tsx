"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Screen, TopBar } from "../../../_components/ui";
import { ReportSections } from "../../../_components/ReportView";
import { loadDraft, missingItems, saveDraft } from "../../../_store";
import type { CareRecord } from "../../../_types";

// C-15 보낼 내용 보기 (와이어 263:308). 빠진 항목이 있으면 먼저 아래 시트로 알려 주고, 주 버튼은 "돌아가서 채울게요".
export default function ConfirmPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [record, setRecord] = useState<CareRecord | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    const r = loadDraft(id).record;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load the draft from sessionStorage on mount
    setRecord(r);
    setSheetOpen(missingItems(r).length > 0);
  }, [id]);

  if (!record) return null;
  const missing = missingItems(record);

  function send() {
    saveDraft(id, { sentAt: new Date().toISOString() });
    router.push(`/v1120/visit/${id}/sent`);
  }

  return (
    <>
      <Screen
        bottom={
          <>
            <p className="text-center text-base text-muted">보낸 뒤에는 고칠 수 없어요.</p>
            <button
              type="button"
              onClick={send}
              className="flex h-16 w-full items-center justify-center rounded-[15px] bg-accent text-lg font-bold text-accent-foreground active:bg-accent-dark"
            >
              저장하고 보내기
            </button>
          </>
        }
      >
        <TopBar backHref={`/v1120/visit/${id}/review`} title="보낼 내용 보기" />
        <p className="text-lg text-muted">보호자님께는 이렇게 보여요.</p>
        <ReportSections record={record} />
      </Screen>

      {sheetOpen && (
        <div className="fixed inset-0 z-10 flex items-end bg-black/40" role="dialog" aria-modal="true">
          <div className="mx-auto flex w-full max-w-md flex-col gap-4 rounded-t-2xl bg-white p-6">
            <h2 className="text-xl font-bold">아직 확인하지 않은 항목이 {missing.length}개 있어요</h2>
            <ul className="flex flex-col gap-1 rounded-xl bg-accent-soft px-4 py-3 text-lg font-bold text-accent-soft-foreground">
              {missing.map((m) => (
                <li key={m}>· {m}</li>
              ))}
            </ul>
            <p className="text-base text-muted">
              지금 채우면 보호자 보고서와 급여제공기록지에 함께 들어가요. 보낸 뒤에는 고칠 수 없어요.
            </p>
            <button
              type="button"
              onClick={() => router.push(`/v1120/visit/${id}/review`)}
              className="flex h-16 w-full items-center justify-center rounded-[15px] bg-accent text-lg font-bold text-accent-foreground active:bg-accent-dark"
            >
              돌아가서 채울게요
            </button>
            <button
              type="button"
              onClick={() => setSheetOpen(false)}
              className="flex h-14 w-full items-center justify-center rounded-[15px] border border-border bg-white text-lg font-bold active:bg-accent-soft"
            >
              그대로 보낼게요
            </button>
          </div>
        </div>
      )}
    </>
  );
}
