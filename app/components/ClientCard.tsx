"use client";

import { useState } from "react";
import Link from "next/link";
import { Avatar } from "@/app/components/ui/Avatar";
import { Card } from "@/app/components/ui/Card";
import { Chip } from "@/app/components/ui/Chip";
import { ClientProfileModal } from "@/app/components/ClientProfileModal";

export function ClientCard({
  id,
  name,
  age,
  gender,
  allergies,
  medicalHistory,
  medicationNotes,
  personalNotes,
  careRegistrationNumber,
  scheduleLabel,
  draftVisitId,
}: {
  id: string;
  name: string;
  age: number | null;
  gender: string | null;
  allergies: string | null;
  medicalHistory: string | null;
  medicationNotes: string | null;
  personalNotes: string | null;
  careRegistrationNumber: string | null;
  scheduleLabel: string | null;
  draftVisitId: string | null;
}) {
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setProfileOpen(true)}
          aria-label={`${name} 방문대상자 카드 보기`}
        >
          <Avatar name={name} className="h-[78px] w-[78px]" />
        </button>
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xl font-bold">{name}</p>
            {careRegistrationNumber && <Chip variant="outline">{careRegistrationNumber}</Chip>}
          </div>
          {scheduleLabel && <Chip variant="schedule">{scheduleLabel}</Chip>}
        </div>
      </div>
      <div className="flex gap-3">
        <Link
          href={`/client/${id}/edit`}
          className="flex h-14 w-24 shrink-0 items-center justify-center rounded-[15px] bg-gray-100 text-lg font-semibold text-muted active:bg-gray-200"
        >
          수정
        </Link>
        {draftVisitId ? (
          <Link
            href={`/visit/${draftVisitId}/review`}
            className="flex h-14 flex-1 items-center justify-center rounded-[15px] bg-accent text-lg font-semibold text-accent-foreground active:bg-accent-dark"
          >
            임시저장파일 공유
          </Link>
        ) : (
          <form action="/api/visits" method="POST" className="flex-1">
            <input type="hidden" name="clientId" value={id} />
            <button
              type="submit"
              className="h-14 w-full rounded-[15px] bg-accent text-lg font-semibold text-accent-foreground active:bg-accent-dark"
            >
              기록하기
            </button>
          </form>
        )}
      </div>

      {profileOpen && (
        <ClientProfileModal
          clientId={id}
          client={{ name, age, gender, allergies, medicalHistory, medicationNotes, personalNotes }}
          onClose={() => setProfileOpen(false)}
        />
      )}
    </Card>
  );
}
