"use client";

import { useState } from "react";
import { Avatar } from "@/app/components/ui/Avatar";

export interface ClientProfileInfo {
  name: string;
  age: number | null;
  gender: string | null;
  allergies: string | null;
  medicalHistory: string | null;
  medicationNotes: string | null;
  personalNotes: string | null;
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-3 last:border-b-0">
      <span className="shrink-0 text-base text-muted">{label}</span>
      <span className="text-right text-base font-semibold text-foreground">{value}</span>
    </div>
  );
}

export function ClientProfileModal({
  clientId,
  client,
  onClose,
}: {
  clientId: string;
  client: ClientProfileInfo;
  onClose: () => void;
}) {
  const [notes, setNotes] = useState(client.personalNotes ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "failed">("idle");

  async function handleSave() {
    setStatus("saving");
    try {
      const res = await fetch(`/api/clients/${clientId}/notes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) throw new Error();
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("failed");
    }
  }

  return (
    <div
      className="fixed inset-0 z-20 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-md flex-col gap-4 rounded-[15px] bg-card p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <Avatar name={client.name} className="h-16 w-16" />
          <p className="text-lg font-bold">방문대상자 카드</p>
        </div>

        <div className="flex flex-col">
          <ProfileRow label="이름" value={client.name} />
          <ProfileRow label="나이" value={client.age ? `${client.age}세` : "미입력"} />
          <ProfileRow label="성별" value={client.gender ?? "미입력"} />
          <ProfileRow label="알레르기 여부" value={client.allergies ?? "미입력"} />
          <ProfileRow label="현재 병력" value={client.medicalHistory ?? "미입력"} />
          <ProfileRow label="복용약명 메모" value={client.medicationNotes ?? "미입력"} />
        </div>

        <label className="flex flex-col gap-2 text-base text-muted">
          특이사항
          <textarea
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              setStatus("idle");
            }}
            placeholder="예: 큰 목소리로 천천히 말씀드려야 함"
            className="min-h-20 resize-none rounded-[15px] border border-border bg-background px-4 py-3 text-base text-foreground"
          />
        </label>

        <button
          type="button"
          onClick={handleSave}
          disabled={status === "saving"}
          className="h-12 w-full rounded-[15px] bg-accent text-base font-semibold text-accent-foreground active:bg-accent-dark disabled:opacity-40"
        >
          {status === "saving" ? "저장 중..." : "저장하기"}
        </button>
        {status === "saved" && <p className="text-center text-sm text-muted">저장됐어요.</p>}
        {status === "failed" && (
          <p className="text-record text-center text-sm font-semibold">저장에 실패했어요.</p>
        )}

        <button
          type="button"
          onClick={onClose}
          className="text-center text-base text-muted underline"
        >
          닫기
        </button>
      </div>
    </div>
  );
}
