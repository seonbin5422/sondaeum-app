"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { deleteSession } from "@/lib/session";
import { WEEKDAY_LABELS } from "@/lib/schedule";
import { CARE_GRADES } from "./_types";
import { requireCaregiver } from "./_data";

// 1120.ver 화면의 저장 동작. 모든 동작은 로그인한 요양보호사의 수급자에만 쓴다 (SEC-2).

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

function text(form: FormData, key: string) {
  const v = form.get(key);
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

// 남의 수급자 id로 요청이 와도 못 건드리게, 내 것인지 먼저 확인
async function ownClientOrThrow(id: string) {
  const caregiver = await requireCaregiver();
  const c = await prisma.client.findFirst({ where: { id, caregiverId: caregiver.id } });
  if (!c) throw new Error("수급자를 찾을 수 없어요.");
  return c;
}

// C-07 등록 · C-08 수정 (ClientForm)
export async function saveClient(form: FormData) {
  const caregiver = await requireCaregiver();
  const id = text(form, "id");
  const name = text(form, "name");
  const careRegistrationNumber = text(form, "careRegistrationNumber");
  const guardianName = text(form, "guardianName");
  const days = form
    .getAll("days")
    .map(Number)
    .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
    .sort();
  const start = text(form, "start");
  const end = text(form, "end");
  // 화면에서 막지만 서버에서도 한 번 더 확인 (D-31 필수 항목)
  if (!name || !careRegistrationNumber || !guardianName || days.length === 0 || !start || !end) {
    throw new Error("필수 항목을 모두 적어 주세요.");
  }
  const grade = text(form, "careGrade");
  const age = text(form, "age");

  const data = {
    name,
    careRegistrationNumber,
    guardianName,
    guardianRelation: text(form, "guardianRelation") ?? "기타",
    guardianPhone: text(form, "guardianPhone"),
    careGrade: grade && (CARE_GRADES as readonly string[]).includes(grade) ? grade : null,
    // lib/schedule.ts가 읽는 모양: "월,수,금 09:00-11:00"
    scheduleLabel: `${days.map((d) => WEEKDAY_LABELS[d]).join(",")} ${start}-${end}`,
    age: age && /^\d{1,3}$/.test(age) ? Number(age) : null,
    gender: text(form, "gender"),
    allergies: text(form, "allergies"),
    medicalHistory: text(form, "medicalHistory"),
    medicationNotes: text(form, "medicationNotes"),
    phone: text(form, "phone"),
  };

  if (id) {
    await ownClientOrThrow(id);
    await prisma.client.update({ where: { id }, data });
    redirect(`/v1120/client/${id}`);
  }
  const created = await prisma.client.create({ data: { ...data, caregiverId: caregiver.id } });
  // 새로 등록하면 바로 보호자 대화방 초대 화면으로 (D-33)
  redirect(`/v1120/client/${created.id}/invite?new=1`);
}

// C-10 삭제: 목록에서 숨기고 "삭제한 수급자"에서 되살릴 수 있다
// shortcut: 화면 안내("14일이 지나면 완전히 지워져요")와 달리 자동으로 지우지 않음, 삭제 시각 칸을 추가할 때 맞춘다
export async function deleteClient(id: string) {
  await ownClientOrThrow(id);
  await prisma.client.update({ where: { id }, data: { isActive: false } });
  redirect("/v1120/clients");
}

export async function restoreClient(id: string) {
  await ownClientOrThrow(id);
  await prisma.client.update({ where: { id }, data: { isActive: true } });
  redirect("/v1120/clients");
}

// C-11 완전히 지우기: 기록 은폐를 막으려고 14일 뒤에 실제로 지운다 (옛 permanent-delete와 같은 방식)
export async function permanentDeleteClient(id: string) {
  await ownClientOrThrow(id);
  await prisma.client.update({ where: { id }, data: { purgeAt: new Date(Date.now() + FOURTEEN_DAYS_MS) } });
  redirect("/v1120/clients");
}

export async function logout() {
  await deleteSession();
  redirect("/v1120/login");
}
