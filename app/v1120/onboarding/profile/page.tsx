"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Screen, StepBadge, TopBar } from "../../_components/ui";
import { CheckedField } from "../../_components/CheckedField";
import { checkField } from "../../_validate";

// C-02 처음 설정 (Figma 558:895, 이름·자격번호). 앞은 C-24 소개, 다음은 C-21 동의.
export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [license, setLicense] = useState("");
  // 동의(C-21)에서 뒤로 돌아오면 적었던 값을 다시 채운다 (11/13 2차 평가: 입력이 사라짐)
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem("v1120-onboarding") ?? "null");
      if (saved) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- sessionStorage is only readable after mount (SSR)
        setName(saved.name ?? "");
        setLicense(saved.licenseNumber ?? "");
      }
    } catch {}
  }, []);
  const wrong = checkField("name", name) ?? checkField("license", license);
  return (
    <Screen
      white
      bottom={
        <Button
          disabled={!name || !license.trim() || !!wrong}
          disabledReason={!name ? "이름을 적어 주세요" : !license.trim() ? "자격번호를 적어 주세요" : (wrong ?? undefined)}
          onClick={() => {
            // 동의(C-21) 전에는 서버에 저장하지 않고 이 탭에만 잠시 둔다
            sessionStorage.setItem("v1120-onboarding", JSON.stringify({ name: name.trim(), licenseNumber: license.trim() }));
            router.push("/v1120/onboarding/consent");
          }}
        >
          다음
        </Button>
      }
    >
      <TopBar backHref="/v1120/onboarding" />
      <header className="enter flex flex-col items-start gap-2 pt-1 leading-[1.4]">
        <StepBadge>1 / 2</StepBadge>
        <h1 className="text-2xl font-bold">요양보호사님을 알려 주세요</h1>
        <p className="text-lg text-muted">
          보호자 보고서에 <span className="whitespace-nowrap">이름이 들어가요.</span>
        </p>
      </header>
      {/* Figma 558:895: 흰 바탕에 입력칸만, 카드 없음. 상단 바는 제목 없이 뒤로만 */}
      <div className="enter flex flex-col gap-6 pt-6">
        <CheckedField rule="name" label="이름 (필수)" value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 박현우" autoComplete="name" />
        <CheckedField
          rule="license"
          label="요양보호사 자격번호 (필수)"
          value={license}
          onChange={(e) => setLicense(e.target.value)}
          placeholder="예: 2019-1234567"
          hint="자격증의 '제 ○○○○-○○○○○○○ 호'에 적힌 번호예요."
        />
      </div>
    </Screen>
  );
}
