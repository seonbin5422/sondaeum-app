"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Field, Screen, StepBadge, TopBar } from "../_components/ui";

// C-02 처음 설정 (이름·자격번호). 다음은 C-21 동의.
export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [license, setLicense] = useState("");
  return (
    <Screen
      white
      bottom={
        <Button
          disabled={!name || !license.trim()}
          disabledReason={!name ? "이름을 적어 주세요" : "자격번호를 적어 주세요"}
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
      <TopBar backHref="/v1120/login" title="처음 설정" />
      <header className="enter flex flex-col items-start gap-2 pt-1 leading-[1.4]">
        <StepBadge>1 / 2</StepBadge>
        <h1 className="text-2xl font-bold">요양보호사님을 알려 주세요</h1>
        <p className="text-lg text-muted">
          보호자 보고서에 <span className="whitespace-nowrap">이름이 들어가요.</span>
        </p>
      </header>
      {/* Figma 510:173: 흰 바탕에 입력칸만, 카드 없음 */}
      <div className="enter flex flex-col gap-6 pt-6">
        <Field label="이름 (필수)" value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 박현우" autoComplete="name" />
        <Field
          label="요양보호사 자격번호 (필수)"
          value={license}
          onChange={(e) => setLicense(e.target.value)}
          placeholder="예: 2019-서울-012345"
          hint="자격증에 적힌 번호예요."
        />
      </div>
    </Screen>
  );
}
