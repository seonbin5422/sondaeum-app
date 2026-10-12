"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { deleteSession } from "@/lib/session";
import { WEEKDAY_LABELS } from "@/lib/schedule";
import { decryptText, encryptText } from "@/lib/crypto";
import { CARE_GRADES, type CareRecord } from "./_types";
import { extractRecord } from "./_extract";
import { redactForAi } from "./_redact";
import { summarizeNotes } from "./_ai";
import { kstTodayRange, requireCaregiver } from "./_data";

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

// ---- 방문 기록 (2단계) ----

// 내 방문인지 확인. 보낸 뒤에는 고칠 수 없다 (STB-1)
async function ownVisitOrThrow(visitId: string, { editable = true } = {}) {
  const caregiver = await requireCaregiver();
  const v = await prisma.visit.findFirst({ where: { id: visitId, caregiverId: caregiver.id }, include: { report: true } });
  if (!v) throw new Error("방문 기록을 찾을 수 없어요.");
  if (editable && v.status === "SENT") throw new Error("이미 보낸 기록은 고칠 수 없어요.");
  return v;
}

// 홈 "기록하기": 오늘 이 수급자 방문이 이미 있으면 이어서, 없으면 새로 만든다
export async function startVisit(clientId: string) {
  const caregiver = await requireCaregiver();
  await ownClientOrThrow(clientId);
  const { start, end } = kstTodayRange();
  const existing = await prisma.visit.findFirst({
    where: { caregiverId: caregiver.id, clientId, createdAt: { gte: start, lt: end }, status: { not: "SENT" } },
    orderBy: { createdAt: "desc" },
  });
  const visit =
    existing ??
    (await prisma.visit.create({ data: { caregiverId: caregiver.id, clientId, status: "RECORDING", startedAt: new Date() } }));
  const next = { DRAFT_READY: "review", RECORDED: "processing", SUMMARIZING: "processing" }[visit.status as string] ?? "record";
  redirect(`/v1120/visit/${visit.id}/${next}`);
}

// 녹음 내용을 문장마다 저장 (D-27: 중간에 멈춰도 이어서 기록)
// 원문은 암호화만 해서 저장한다. AI로 나가는 건 정리 때 _redact.ts로 개인정보를 지운 특이사항 문장뿐이다 (LAW-6)
export async function saveTranscript(visitId: string, transcript: string) {
  await ownVisitOrThrow(visitId);
  await prisma.visit.update({ where: { id: visitId }, data: { transcript: encryptText(transcript), status: "RECORDING" } });
}

// "다 말했어요": 녹음을 끝내고 정리 화면으로
export async function finishRecording(visitId: string, transcript: string) {
  await ownVisitOrThrow(visitId);
  if (!transcript.trim()) throw new Error("녹음 내용이 없어요.");
  await prisma.visit.update({
    where: { id: visitId },
    data: { transcript: encryptText(transcript), status: "RECORDED", endedAt: new Date() },
  });
}

// 특이사항 문장을 개인정보를 지운 뒤 AI로 요약한다. AI가 실패하면 원문 문장을 그대로 둬서 기록은 계속 만든다
async function aiNotes(said: string | null, clientId: string, caregiverId: string) {
  if (!said || !process.env.GROQ_API_KEY) return said;
  const [client, caregiver] = await Promise.all([
    prisma.client.findUnique({ where: { id: clientId }, select: { name: true, guardianName: true, phone: true, guardianPhone: true } }),
    prisma.caregiver.findUnique({ where: { id: caregiverId }, select: { name: true } }),
  ]);
  if (!client) return said;
  const redacted = redactForAi(said, {
    client: client.name,
    guardian: client.guardianName,
    caregiver: caregiver?.name,
    phones: [client.phone, client.guardianPhone],
  });
  try {
    return await summarizeNotes(redacted);
  } catch (err) {
    console.error("AI 특이사항 요약 실패, 원문 문장을 씀", err);
    return said;
  }
}

// C-13 정리: 녹음 내용을 급여제공기록지 모양으로 채워 보고서 초안을 만든다
// shortcut: 특이사항만 AI(LAW-1 프롬프트)로 요약하고 나머지 칸은 _extract.ts(낱말·숫자 찾기)로 채운다, 개발 1의 AI 요약이 준비되면 여기만 바꾼다
export async function summarizeVisit(visitId: string) {
  const v = await ownVisitOrThrow(visitId);
  // 이미 정리 중이거나 끝났으면 다시 하지 않는다 (STB-2)
  if (v.status === "SUMMARIZING" || v.status === "DRAFT_READY") return;
  await prisma.visit.update({ where: { id: visitId }, data: { status: "SUMMARIZING" } });
  try {
    const extracted = extractRecord(v.transcript ? decryptText(v.transcript) : "");
    const quotes = extracted.quotes; // "내가 한 말" 근거는 원문 그대로
    const record = { ...extracted.record, notes: await aiNotes(extracted.record.notes, v.clientId, v.caregiverId) };
    const fields = { careRecord: encryptText(JSON.stringify(record)), aiRawJson: encryptText(JSON.stringify(quotes)) };
    await prisma.report.upsert({
      where: { visitId },
      // 옛 화면용 칸(식사·복약·특이사항)은 1120 기록에서 쓰지 않는다
      create: { visitId, meals: encryptText(""), medication: encryptText(""), notes: encryptText(record.notes ?? ""), ...fields },
      update: fields,
    });
    await prisma.visit.update({ where: { id: visitId }, data: { status: "DRAFT_READY" } });
  } catch (err) {
    await prisma.visit.update({ where: { id: visitId }, data: { status: "RECORDED" } });
    throw err;
  }
}

// C-14 기록 확인에서 고친 값 저장
export async function saveRecord(visitId: string, record: CareRecord) {
  const v = await ownVisitOrThrow(visitId);
  if (!v.report) throw new Error("정리된 기록이 없어요.");
  await prisma.report.update({
    where: { visitId },
    data: { careRecord: encryptText(JSON.stringify(record)), notes: encryptText(record.notes ?? ""), wasEdited: true },
  });
}

// C-15 "저장하고 보내기": 보낸 뒤에는 고칠 수 없다
export async function sendReport(visitId: string) {
  const v = await ownVisitOrThrow(visitId);
  if (!v.report) throw new Error("정리된 기록이 없어요.");
  await prisma.report.update({ where: { visitId }, data: { sentAt: new Date() } });
  await prisma.visit.update({ where: { id: visitId }, data: { status: "SENT", endedAt: v.endedAt ?? new Date() } });
  redirect(`/v1120/visit/${visitId}/sent`);
}

// C-06 내 정보 고치기
export async function updateMe(form: FormData) {
  const caregiver = await requireCaregiver();
  const name = text(form, "name");
  const licenseNumber = text(form, "licenseNumber");
  if (!name || !licenseNumber) throw new Error("이름과 자격번호를 적어 주세요.");
  await prisma.caregiver.update({ where: { id: caregiver.id }, data: { name, licenseNumber } });
  redirect("/v1120/me");
}
