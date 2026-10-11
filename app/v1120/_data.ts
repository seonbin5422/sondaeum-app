import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionCaregiverId } from "@/lib/session";
import { purgeExpiredClients } from "@/lib/purgeExpiredClients";
import { WEEKDAY_LABELS, parseScheduleDays } from "@/lib/schedule";
import type { Client } from "@/app/generated/prisma/client";
import type { CareGrade, ClientProfile } from "./_types";

// 1120.ver 화면이 DB에서 읽는 곳. 수급자는 로그인한 요양보호사 것만 보인다 (SEC-2).

export const requireCaregiver = cache(async () => {
  const id = await getSessionCaregiverId();
  const caregiver = id ? await prisma.caregiver.findUnique({ where: { id } }) : null;
  if (!caregiver) redirect("/v1120/login");
  return caregiver;
});

// DB의 "월,수,금 09:00-11:00"을 화면의 "월·수·금 09:00–11:00"으로
export function displaySchedule(label: string | null) {
  return label ? label.replaceAll(",", "·").replace("-", "–") : "일정 미입력";
}

export function toProfile(c: Client): ClientProfile {
  return {
    id: c.id,
    name: c.name,
    age: c.age,
    gender: c.gender,
    allergies: c.allergies,
    medicalHistory: c.medicalHistory,
    medicationNotes: c.medicationNotes,
    personalNotes: c.personalNotes,
    guardianName: c.guardianName,
    guardianRelation: c.guardianRelation,
    guardianPhone: c.guardianPhone,
    guardianJoined: false, // shortcut: 대화방(DIF-5) 모델이 생기면 보호자 첫 입장 시각으로 바꾼다
    careRegistrationNumber: c.careRegistrationNumber,
    careGrade: c.careGrade as CareGrade | null,
    phone: c.phone,
    scheduleLabel: displaySchedule(c.scheduleLabel),
    scheduleDays: parseScheduleDays(c.scheduleLabel).map((d) => WEEKDAY_LABELS.indexOf(d)),
    isActive: c.isActive,
  };
}

// 내 수급자 전부 (삭제한 것 포함, 완전히 지우기 예약된 것 제외)
export async function myClients() {
  const caregiver = await requireCaregiver();
  await purgeExpiredClients();
  const rows = await prisma.client.findMany({
    where: { caregiverId: caregiver.id, purgeAt: null },
    orderBy: { name: "asc" },
  });
  return rows.map(toProfile);
}

// 내 수급자 하나. 남의 수급자거나 없으면 null
export async function myClient(id: string) {
  const caregiver = await requireCaregiver();
  const c = await prisma.client.findFirst({ where: { id, caregiverId: caregiver.id, purgeAt: null } });
  return c ? toProfile(c) : null;
}
