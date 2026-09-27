"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/app/components/ui/Avatar";
import { Callout } from "@/app/components/ui/Card";
import { LinkButton } from "@/app/components/ui/Button";

export interface CaregiverProfileInfo {
  name: string;
  licenseNumber: string | null;
}

function ProfileRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-3 last:border-b-0">
      <span className="shrink-0 text-base text-muted">{label}</span>
      <span className="text-right text-base font-semibold text-foreground">{children}</span>
    </div>
  );
}

export function CaregiverProfileModal({
  caregiverId,
  caregiver,
  feedbackMessage,
  initialEditUnlocked = false,
  initialEditFailed = false,
  onClose,
}: {
  caregiverId: string;
  caregiver: CaregiverProfileInfo;
  feedbackMessage: string;
  initialEditUnlocked?: boolean;
  initialEditFailed?: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [editUnlocked, setEditUnlocked] = useState(initialEditUnlocked);
  const [showEditFailed, setShowEditFailed] = useState(initialEditFailed);
  const [name, setName] = useState(caregiver.name);
  const [licenseNumber, setLicenseNumber] = useState(caregiver.licenseNumber ?? "");
  const [requestStatus, setRequestStatus] = useState<"idle" | "requesting" | "failed">("idle");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "failed">("idle");

  async function handleRequestEdit() {
    setShowEditFailed(false);
    setRequestStatus("requesting");
    try {
      const res = await fetch(`/api/caregivers/${caregiverId}/request-edit`, { method: "POST" });
      if (!res.ok) throw new Error();
      const { redirectUrl } = await res.json();
      window.location.href = redirectUrl;
    } catch {
      setRequestStatus("failed");
    }
  }

  async function handleSave() {
    setSaveStatus("saving");
    try {
      const res = await fetch(`/api/caregivers/${caregiverId}/apply-edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, licenseNumber }),
      });
      if (!res.ok) throw new Error();
      setEditUnlocked(false);
      setSaveStatus("idle");
      router.refresh();
    } catch {
      setSaveStatus("failed");
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
          <Avatar name={caregiver.name} className="h-16 w-16" />
          <p className="text-lg font-bold">요양보호사 프로필</p>
        </div>

        {!editUnlocked && (
          <div className="flex flex-col">
            <ProfileRow label="이름">{caregiver.name}</ProfileRow>
            <ProfileRow label="요양사자격번호">{caregiver.licenseNumber ?? "미입력"}</ProfileRow>
          </div>
        )}

        <Callout>
          <p className="mb-1 text-sm font-bold">AI 피드백</p>
          <p className="text-sm">{feedbackMessage}</p>
        </Callout>

        {showEditFailed && (
          <p className="text-record text-sm font-semibold">
            본인 확인에 실패해서 수정이 취소됐어요. 같은 카카오 계정으로 다시 시도해주세요.
          </p>
        )}

        {editUnlocked ? (
          <>
            <p className="text-muted text-sm">본인 확인이 완료됐어요. 수정할 정보를 입력해주세요.</p>

            <label className="flex flex-col gap-2 text-base text-muted">
              이름
              <input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setSaveStatus("idle");
                }}
                className="h-12 rounded-[15px] border border-border bg-background px-4 text-base text-foreground"
              />
            </label>

            <label className="flex flex-col gap-2 text-base text-muted">
              요양사자격번호
              <input
                value={licenseNumber}
                onChange={(e) => {
                  setLicenseNumber(e.target.value);
                  setSaveStatus("idle");
                }}
                placeholder="예: 12-345678"
                className="h-12 rounded-[15px] border border-border bg-background px-4 text-base text-foreground"
              />
            </label>

            <button
              type="button"
              onClick={handleSave}
              disabled={saveStatus === "saving"}
              className="h-12 w-full rounded-[15px] bg-accent text-base font-semibold text-accent-foreground active:bg-accent-dark disabled:opacity-40"
            >
              {saveStatus === "saving" ? "저장 중..." : "저장"}
            </button>
            {saveStatus === "failed" && (
              <p className="text-record text-center text-sm font-semibold">저장에 실패했어요.</p>
            )}

            <button
              type="button"
              onClick={() => {
                setName(caregiver.name);
                setLicenseNumber(caregiver.licenseNumber ?? "");
                setEditUnlocked(false);
              }}
              className="text-center text-base text-muted underline"
            >
              취소
            </button>
          </>
        ) : (
          <>
            <p className="text-muted text-sm">
              정보수정을 누르면 본인 확인을 위해 카카오 로그인을 한 번 더 요청해요.
            </p>

            <button
              type="button"
              onClick={handleRequestEdit}
              disabled={requestStatus === "requesting"}
              className="h-12 w-full rounded-[15px] bg-accent text-base font-semibold text-accent-foreground active:bg-accent-dark disabled:opacity-40"
            >
              {requestStatus === "requesting" ? "이동 중..." : "정보수정"}
            </button>
            {requestStatus === "failed" && (
              <p className="text-record text-center text-sm font-semibold">요청에 실패했어요.</p>
            )}
          </>
        )}

        <LinkButton href="/clients/manage" variant="secondary">
          전체수급자 관리
        </LinkButton>

        <form
          action="/api/auth/logout"
          method="POST"
          onSubmit={(e) => {
            if (!window.confirm("로그아웃 하시겠습니까?")) {
              e.preventDefault();
            }
          }}
        >
          <button type="submit" className="w-full text-center text-base text-muted underline">
            로그아웃
          </button>
        </form>

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
