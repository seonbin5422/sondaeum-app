"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { verifyGuardian } from "../_actions";
import { Button, Field, Screen } from "./ui";

// 보호자 링크를 처음 연 기기에서 보호자 전화번호 끝 4자리를 묻는다. 맞히면 30일 동안 다시 묻지 않는다
export function GuardianCheck({ token }: { token: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  return (
    <Screen white>
      <form
        className="flex flex-col gap-4 pt-10 leading-[1.4]"
        action={async (form) => {
          const r = await verifyGuardian(token, String(form.get("digits") ?? "").trim());
          if (r.ok) router.refresh();
          else setError(r.error);
        }}
      >
        <h1 className="text-2xl font-bold">보호자 확인</h1>
        <p className="text-lg text-muted">어르신 건강 기록이 담긴 링크예요. 요양보호사에게 알려 준 보호자 전화번호 끝 4자리를 넣어 주세요.</p>
        <Field label="전화번호 끝 4자리" name="digits" inputMode="numeric" pattern="\d{4}" maxLength={4} autoComplete="off" required autoFocus />
        <p role="alert" className="min-h-6 text-base text-(--text-danger)">
          {error}
        </p>
        <Button type="submit">확인</Button>
      </form>
    </Screen>
  );
}
