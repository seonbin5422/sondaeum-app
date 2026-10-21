"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Screen, TopBar } from "../../../_components/ui";
import { ReportSections } from "../../../_components/ReportView";
import { missingItems } from "../../../_store";
import { sendReport } from "../../../_actions";
import type { CareRecord } from "../../../_types";

// C-15 보낼 내용 보기 (와이어 263:308). 빠진 항목이 있으면 먼저 아래 시트로 알려 주고, 주 버튼은 "돌아가서 채울게요".
// recipient: 받는 분 호칭(보호자님 등), 받을 분이 없으면 null (D-49)
export function ConfirmScreen({ id, record, reviewHref, recipient }: { id: string; record: CareRecord; reviewHref: string; recipient: string | null }) {
  const router = useRouter();
  const missing = missingItems(record);
  const [sheetOpen, setSheetOpen] = useState(missing.length > 0);

  return (
    <>
      <Screen
        bottom={
          <>
            <p className="text-center text-base text-muted">{recipient ? "보낸" : "저장한"} 뒤에는 고칠 수 없어요.</p>
            <form action={sendReport.bind(null, id)} className="flex">
              <button
                type="submit"
                className="flex h-16 w-full items-center justify-center rounded-[15px] bg-accent text-lg font-bold text-accent-foreground active:bg-accent-dark"
              >
                {recipient ? "저장하고 보내기" : "저장하기"}
              </button>
            </form>
          </>
        }
      >
        <TopBar backHref={reviewHref} title="보낼 내용 보기" />
        <p className="text-lg text-muted">{recipient ? `${recipient}께는 이렇게 보여요.` : "이렇게 저장돼요."}</p>
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
              onClick={() => router.push(reviewHref)}
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
