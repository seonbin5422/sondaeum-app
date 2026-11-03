"use client";

import { useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Screen, StepBadge, TopBar } from "../../_components/ui";
import { buzz } from "../../_components/Pressable";
import { ConsentDetails } from "../../_components/ConsentDetails";
import { CONSENT_ITEMS as ITEMS } from "../../_consent";

// C-21 동의 (LAW-3). 개인정보 / 건강정보(민감) / 보호자 제공 / 국외 이전(Groq)을 따로 받는다. 항목은 _consent.ts.

export default function ConsentPage() {
  const router = useRouter();
  const [agreed, setAgreed] = useState<Record<string, boolean>>({});
  const all = ITEMS.every((i) => agreed[i.key]);
  // 동의하고 시작하기: 1단계에서 받아 둔 이름·자격번호를 실어 보내 실제로 저장한다
  function submit(e: FormEvent<HTMLFormElement>) {
    const saved = sessionStorage.getItem("v1120-onboarding");
    if (!saved) {
      // 1단계를 거치지 않고 들어왔으면 저장할 값이 없으니 1단계로 돌려보낸다
      e.preventDefault();
      router.replace("/v1120/onboarding");
      return;
    }
    const { name, licenseNumber } = JSON.parse(saved);
    const form = e.currentTarget;
    (form.elements.namedItem("name") as HTMLInputElement).value = name;
    (form.elements.namedItem("licenseNumber") as HTMLInputElement).value = licenseNumber;
    sessionStorage.removeItem("v1120-onboarding");
  }
  return (
    <Screen
      white
      bottom={
        <form action="/api/caregivers/onboard" method="post" onSubmit={submit}>
          <input type="hidden" name="name" />
          <input type="hidden" name="licenseNumber" />
          <input type="hidden" name="next" value="/v1120" />
          <input type="hidden" name="consent" value={ITEMS.filter((i) => agreed[i.key]).map((i) => i.key).join(",")} />
          <Button type="submit" disabled={!all} disabledReason="모든 항목에 동의해야 쓸 수 있어요">
            동의하고 시작하기
          </Button>
        </form>
      }
    >
      <TopBar backHref="/v1120/onboarding" title="처음 설정" />
      <header className="enter flex flex-col items-start gap-2 pt-1 leading-[1.4]">
        <StepBadge>2 / 2</StepBadge>
        <h1 className="text-2xl font-bold">동의가 필요해요</h1>
        <p className="text-lg text-muted">
          하나씩 읽고 눌러 주세요. <span className="whitespace-nowrap">모두 필요한 항목이에요.</span>
        </p>
      </header>

      <div className="enter rounded-2xl border border-(--line) bg-white p-1" style={{ "--i": 1 } as CSSProperties}>
        <ConsentRow
          on={all}
          onChange={(v) => setAgreed(Object.fromEntries(ITEMS.map((i) => [i.key, v])))}
          title="모두 동의하기"
          sub={<p className="text-base text-muted">아래 네 가지에 한 번에 동의해요.</p>}
        />
      </div>

      <ul className="enter flex flex-col rounded-2xl bg-white p-1" style={{ "--i": 2 } as CSSProperties}>
        {ITEMS.map((i) => (
          <li key={i.key}>
            <ConsentRow
              on={!!agreed[i.key]}
              onChange={(v) => setAgreed({ ...agreed, [i.key]: v })}
              title={`(필수) ${i.title}`}
              sub={<ConsentDetails item={i} />}
            />
          </li>
        ))}
      </ul>
      <Link
        href="/v1120/privacy"
        onPointerDown={buzz}
        className="press inline-flex min-h-12 items-center justify-center rounded-xl text-lg font-medium text-(--text-brand) active:bg-(--bg-secondary)"
      >
        개인정보 처리방침 전체 보기 ›
      </Link>
    </Screen>
  );
}

// 공통/동의 항목 (Figma 508:147): 동의=check_circle(brand/secondary), 안 함=빈 원(line). 아이콘·제목 줄 전체가 누름 영역.
// 설명·"자세히 보기"는 그 아래 둔다 (자세히 보기를 펼칠 때 동의가 같이 바뀌지 않게)
function ConsentRow({ on, onChange, title, sub }: { on: boolean; onChange: (v: boolean) => void; title: string; sub: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 p-4 leading-[1.4]">
      <label
        onPointerDown={buzz}
        className="press -m-2 flex min-h-12 cursor-pointer items-center gap-3 rounded-xl p-2 active:bg-(--bg-secondary) has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-accent/50"
      >
        <input type="checkbox" className="sr-only" checked={on} onChange={(e) => onChange(e.target.checked)} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={String(on)}
          src={`/v1120/icons/consent-${on ? "on" : "off"}.svg`}
          alt=""
          width={32}
          height={32}
          className={`size-8 shrink-0 ${on ? "done-pulse" : ""}`}
        />
        <span className="text-lg font-bold">{title}</span>
      </label>
      <div className="flex flex-col gap-1 pl-11">{sub}</div>
    </div>
  );
}
