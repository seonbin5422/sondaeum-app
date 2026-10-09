"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Field, Screen } from "../_components/ui";

// C-02 처음 설정 (이름·자격번호). 다음은 C-21 동의.
export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [license, setLicense] = useState("");
  return (
    <Screen>
      <p className="text-base font-bold text-muted">1 / 2</p>
      <h1 className="-mt-4 text-2xl font-bold">요양보호사님을 알려 주세요</h1>
      <p className="-mt-3 text-lg text-muted">보호자 보고서에 이름이 들어가요.</p>
      <Field label="이름 (필수)" value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 박현우" />
      <Field
        label="요양보호사 자격번호 (필수)"
        value={license}
        onChange={(e) => setLicense(e.target.value)}
        placeholder="예: 2019-서울-012345"
        hint="자격증에 적힌 번호예요."
      />
      <Button
        disabled={!name || !license.trim()}
        disabledReason={!name ? "이름을 적어 주세요" : "자격번호를 적어 주세요"} onClick={() => router.push("/v1120/onboarding/consent")}>
        다음
      </Button>
    </Screen>
  );
}
