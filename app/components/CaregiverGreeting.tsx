"use client";

import { useState } from "react";
import { CaregiverProfileModal } from "@/app/components/CaregiverProfileModal";

export interface CaregiverInfo {
  id: string;
  name: string;
  licenseNumber: string | null;
}

export function CaregiverGreeting({
  caregiver,
  feedbackMessage,
  initialEdit,
}: {
  caregiver: CaregiverInfo | null;
  feedbackMessage: string;
  initialEdit?: "granted" | "failed" | null;
}) {
  const [open, setOpen] = useState(Boolean(initialEdit));

  if (!caregiver) {
    return <p className="text-2xl">요양보호사님, 안녕하세요</p>;
  }

  return (
    <>
      <p className="text-2xl">
        <button type="button" onClick={() => setOpen(true)}>
          <span className="font-semibold underline-offset-2">{caregiver.name}</span>
        </button>
        님, 안녕하세요
      </p>

      {open && (
        <CaregiverProfileModal
          caregiverId={caregiver.id}
          caregiver={{ name: caregiver.name, licenseNumber: caregiver.licenseNumber }}
          feedbackMessage={feedbackMessage}
          initialEditUnlocked={initialEdit === "granted"}
          initialEditFailed={initialEdit === "failed"}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
