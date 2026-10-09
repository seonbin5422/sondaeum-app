"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../../_components/ui";

export function DeleteSteps({ name, permanent }: { name: string; permanent: boolean }) {
  const router = useRouter();
  const [moved, setMoved] = useState(false);
  const [typed, setTyped] = useState("");

  if (!permanent) {
    return (
      <div className="flex flex-col gap-5">
        <h1 className="text-2xl font-bold">{name} 수급자를 삭제할까요?</h1>
        <ul className="flex flex-col gap-2 rounded-xl bg-(--neutral-soft) px-4 py-3 text-lg">
          <li>· 목록과 홈에서 보이지 않아요.</li>
          <li>· 14일 동안은 수급자 탭 아래 &quot;삭제한 수급자&quot;에서 되살릴 수 있어요.</li>
          <li>· 보호자 대화방 링크는 바로 닫혀요.</li>
        </ul>
        <Button variant="danger" onClick={() => router.push("/v1120/clients")}>
          삭제하기
        </Button>
        <Button variant="secondary" onClick={() => router.back()}>
          취소
        </Button>
      </div>
    );
  }

  const ok = moved && typed.trim() === name;
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold">{name} 수급자 기록을 완전히 지울까요?</h1>
      <p className="text-lg">방문 기록, 보고서, 대화가 모두 지워지고 되살릴 수 없어요.</p>
      <div className="flex flex-col gap-2 rounded-xl bg-accent-soft px-4 py-3 text-accent-soft-foreground">
        <p className="text-lg font-bold">먼저 확인해 주세요</p>
        <p className="text-base">급여제공기록은 기관이 5년 동안 보관해야 해요. 필요한 기록을 기관 시스템에 옮겼는지 확인해 주세요.</p>
        <label className="mt-1 flex min-h-12 items-center gap-3 text-lg font-bold">
          <input type="checkbox" className="h-6 w-6 accent-[var(--accent)]" checked={moved} onChange={(e) => setMoved(e.target.checked)} />
          기관 시스템에 옮겼어요
        </label>
      </div>
      <label className="flex flex-col gap-2">
        <span className="text-lg font-bold">확인을 위해 수급자 이름을 적어 주세요</span>
        <input
          className="h-14 rounded-[15px] border border-border px-4 text-lg"
          value={typed}
          placeholder={name}
          onChange={(e) => setTyped(e.target.value)}
        />
      </label>
      <Button
        variant="danger"
        disabled={!ok}
        disabledReason={!moved ? "기관 시스템에 옮겼는지 먼저 확인해 주세요" : "수급자 이름을 똑같이 적어 주세요"}
        onClick={() => router.push("/v1120/clients")}
      >
        완전히 지우기
      </Button>
    </div>
  );
}
