"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Screen, TopBar } from "../../../_components/ui";
import { ReportSections } from "../../../_components/ReportView";
import { missingItems } from "../../../_store";
import { sendReport } from "../../../_actions";
import { SignatureSection } from "../../../_components/SignatureBox";
import { EMPTY_SIGNATURES } from "../../../_signatures";
import { caregiverTitle, type CareRecord, type Signatures } from "../../../_types";

// C-15 보낼 내용 보기 (와이어 263:308). 빠진 항목이 있으면 먼저 아래 시트로 알려 주고, 주 버튼은 "돌아가서 채울게요".
// recipient: 보호자 호칭(보호자님 등), 보호자가 없으면 null (D-49)
export function ConfirmScreen({
  id,
  record,
  reviewHref,
  recipient,
  date,
  clientName,
  caregiverName,
  signatures,
}: {
  id: string;
  record: CareRecord;
  reviewHref: string;
  recipient: string | null;
  date: string;
  clientName: string;
  caregiverName: string;
  signatures?: Signatures;
}) {
  const router = useRouter();
  const [sig, setSig] = useState<Signatures>(signatures ?? EMPTY_SIGNATURES);
  const onSig = useCallback((s: Signatures) => setSig(s), []);
  const signed = sig.caregiver.length > 0;
  const missing = missingItems(record);
  const [sheetOpen, setSheetOpen] = useState(missing.length > 0);

  return (
    <>
      <Screen
        white
        bottom={
          <div className="flex flex-col gap-2">
            <p className="text-center text-base font-medium text-muted">{recipient ? "보낸" : "저장한"} 뒤에는 고칠 수 없어요.</p>
            <form action={sendReport.bind(null, id)} className="flex">
              <input type="hidden" name="signatures" value={JSON.stringify(sig)} />
              <Button type="submit" disabled={!signed} disabledReason="아래에 요양보호사 서명을 해야 보낼 수 있어요." pendingLabel={recipient ? "보내는 중이에요" : "저장하는 중이에요"}>
                {recipient ? "저장하고 공유하기" : "저장하기"}
              </Button>
            </form>
          </div>
        }
      >
        <TopBar backHref={reviewHref} title="보낼 내용 보기" />
        {/* Figma 558:2360: 흰 바탕에 칸 없이 나열하고 항목 사이는 가는 선. 공용 ReportSections의 흰 카드를 여기서만 선으로 바꾼다 */}
        <div className="flex flex-col gap-1 [&>section]:rounded-none [&>section]:border-b [&>section]:border-(--line) [&>section]:px-1 [&>section]:py-5 [&_section_span.rounded-full]:bg-white">
        <p className="text-lg font-medium text-muted">{recipient ? `${recipient}께는 이렇게 보여요.` : "이렇게 저장돼요."}</p>
        {/* 보고서 머리 (Figma 558:2362) */}
        <section className="enter flex flex-col gap-1 leading-[1.4]">
          <h2 className="text-[22px] font-bold tracking-[-0.02em]">
            <span className="whitespace-nowrap">{date}</span> 방문 보고서
          </h2>
          <p className="text-base text-muted">
            <span className="whitespace-nowrap">{clientName} 어르신</span> · <span className="whitespace-nowrap">{caregiverTitle(caregiverName)}</span>
          </p>
        </section>
        <ReportSections record={record} flat />
        {/* 확인 서명 (D-48 261114.ver): 요양보호사 서명은 매번 필수, 수급자·보호자 서명은 받을 수 있을 때. 못 받으면 사유를 적는다 */}
        <section className="enter flex flex-col gap-3 leading-[1.4]">
          <h2 className="text-xl font-bold">확인 서명</h2>
          <p className="text-base text-muted">요양보호사 서명은 꼭 해야 보낼 수 있어요. 수급자나 보호자 서명은 받을 수 있으면 받고, 못 받으면 사유를 적어 주세요.</p>
          <SignatureSection visitId={id} initial={signatures} caregiverName={caregiverName} onChange={onSig} />
        </section>
        </div>
      </Screen>

      {sheetOpen && (
        <div className="fixed inset-0 z-20 flex items-end bg-black/40" role="dialog" aria-modal="true" aria-labelledby="missing-title">
          <div className="enter mx-auto flex w-full max-w-md flex-col gap-4 rounded-t-3xl bg-white p-6">
            <h2 id="missing-title" className="text-xl font-bold">
              아직 확인하지 않은 <span className="whitespace-nowrap">칸이 있어요</span>
            </h2>
            <ul className="flex flex-col gap-1 rounded-xl bg-(--bg-brand) px-4 py-3 text-lg font-bold text-(--text-brand)">
              {missing.map((m) => (
                <li key={m}>· {m}</li>
              ))}
            </ul>
            <p className="text-base text-muted">
              지금 채우면 보호자 보고서와 급여제공기록지에 함께 들어가요. 보낸 뒤에는 고칠 수 없어요.
            </p>
            <Button onClick={() => router.push(reviewHref)}>돌아가서 채울게요</Button>
            <Button variant="secondary" onClick={() => setSheetOpen(false)}>
              그대로 보낼게요
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
