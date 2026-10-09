"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Screen } from "../../_components/ui";

// C-21 동의 (LAW-3). 개인정보 / 건강정보(민감) / 보호자 제공 / 국외 이전(Groq)을 따로 받는다. 문구는 기획 초안 전 임시.
const ITEMS = [
  { key: "personal", title: "개인정보 수집·이용", body: "이름, 자격번호, 수급자 이름·연락처를 돌봄 기록에 써요." },
  { key: "health", title: "건강정보(민감정보) 처리", body: "수급자의 식사·배변·혈압 같은 건강 상태를 기록해요." },
  { key: "guardian", title: "보호자에게 제공", body: "보낸 방문 보고서를 등록된 보호자에게 보여 줘요." },
  { key: "overseas", title: "국외 이전 (AI 정리)", body: "말한 내용을 정리하려고 미국의 AI 회사(Groq)에 보내요. 이름·전화번호는 먼저 지워요." },
] as const;

export default function ConsentPage() {
  const router = useRouter();
  const [agreed, setAgreed] = useState<Record<string, boolean>>({});
  const all = ITEMS.every((i) => agreed[i.key]);
  return (
    <Screen>
      <p className="text-base font-bold text-muted">2 / 2</p>
      <h1 className="-mt-4 text-2xl font-bold">동의가 필요해요</h1>
      <p className="-mt-3 text-lg text-muted">하나씩 읽고 눌러 주세요. 모두 필요한 항목이에요.</p>

      <button
        type="button"
        aria-pressed={all}
        onClick={() => setAgreed(Object.fromEntries(ITEMS.map((i) => [i.key, !all])))}
        className={`flex min-h-16 items-center gap-3 rounded-[15px] px-4 text-lg font-bold ${all ? "bg-accent-soft ring-2 ring-accent" : "border border-border"}`}
      >
        <span className={`flex h-7 w-7 items-center justify-center rounded-md ${all ? "bg-accent" : "border-2 border-border"}`}>{all ? "✓" : ""}</span>
        모두 동의하기
      </button>

      <ul className="flex flex-col gap-3">
        {ITEMS.map((i) => (
          <li key={i.key} className="flex flex-col gap-1 rounded-[15px] border border-(--line) p-4">
            <label className="flex min-h-12 items-center gap-3 text-lg font-bold">
              <input
                type="checkbox"
                className="h-6 w-6 accent-[var(--accent)]"
                checked={!!agreed[i.key]}
                onChange={(e) => setAgreed({ ...agreed, [i.key]: e.target.checked })}
              />
              (필수) {i.title}
            </label>
            <p className="text-base text-muted">{i.body}</p>
          </li>
        ))}
      </ul>
      <Link href="/v1120/privacy" className="text-lg font-bold underline underline-offset-4">
        개인정보 처리방침 전체 보기
      </Link>
      <Button disabled={!all} disabledReason="모든 항목에 동의해야 쓸 수 있어요" onClick={() => router.push("/v1120")}>
        동의하고 시작하기
      </Button>
    </Screen>
  );
}
