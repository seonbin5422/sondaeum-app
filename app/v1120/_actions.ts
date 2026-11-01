"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { deleteSession } from "@/lib/session";
import { WEEKDAY_LABELS } from "@/lib/schedule";
import { decryptText, encryptText, openPII, sealPII } from "@/lib/crypto";
import { CARE_GRADES, NO_CONTACT, type CareRecord } from "./_types";
import { clearFields, extractRecord, keepFilled } from "./_extract";
import { redactForAi, restoreNames, toRoleWords } from "./_redact";
import { fillGaps, fillRecord } from "./_ai";
import { takeAiCall } from "@/lib/aiLimit";
import { kstTodayRange, requireCaregiver } from "./_data";
import { cleanSignatures, isEmptySignatures } from "./_signatures";

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
  const guardianRelation = text(form, "guardianRelation") ?? "기타";
  // 보호자가 없는 수급자(D-49)는 이름·번호를 비운다. guardianName이 필수 칸이라 빈 글자로 둔다
  const noContact = guardianRelation === NO_CONTACT;
  const guardianName = noContact ? "" : text(form, "guardianName");
  const days = form
    .getAll("days")
    .map(Number)
    .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
    .sort();
  const start = text(form, "start");
  const end = text(form, "end");
  // 화면에서 막지만 서버에서도 한 번 더 확인 (D-31 필수 항목)
  if (!name || !careRegistrationNumber || (!guardianName && !noContact) || days.length === 0 || !start || !end) {
    throw new Error("필수 항목을 모두 적어 주세요.");
  }
  const grade = text(form, "careGrade");
  const age = text(form, "age");

  // SEC-5: 수급자 이름·전화번호와 보호자 전화번호는 암호화해 저장한다
  const data = {
    name: sealPII(name),
    careRegistrationNumber,
    guardianName: guardianName ?? "",
    guardianRelation,
    guardianPhone: noContact ? null : sealPII(text(form, "guardianPhone")),
    careGrade: grade && (CARE_GRADES as readonly string[]).includes(grade) ? grade : null,
    // lib/schedule.ts가 읽는 모양: "월,수,금 09:00-11:00"
    scheduleLabel: `${days.map((d) => WEEKDAY_LABELS[d]).join(",")} ${start}-${end}`,
    age: age && /^\d{1,3}$/.test(age) ? Number(age) : null,
    gender: text(form, "gender"),
    allergies: text(form, "allergies"),
    medicalHistory: text(form, "medicalHistory"),
    medicationNotes: text(form, "medicationNotes"),
    phone: sealPII(text(form, "phone")),
  };

  if (id) {
    await ownClientOrThrow(id);
    await prisma.client.update({ where: { id }, data });
    redirect(`/v1120/client/${id}`);
  }
  const created = await prisma.client.create({ data: { ...data, caregiverId: caregiver.id } });
  // 새로 등록하면 바로 보호자 게시판 초대 화면으로 (D-33). 보호자가 없으면 초대할 사람도 없다
  redirect(noContact ? `/v1120/client/${created.id}` : `/v1120/client/${created.id}/invite?new=1`);
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
  // 임시저장 뒤 다시 들어온 기록 확인은 resume=1: 뒤로가 홈으로, "더 말하기"로 녹음에 이어 감
  const next = { DRAFT_READY: "review?resume=1", RECORDED: "processing", SUMMARIZING: "processing" }[visit.status as string] ?? "record";
  redirect(`/v1120/visit/${visit.id}/${next}`);
}

// 녹음 내용을 문장마다 저장 (D-27: 중간에 멈춰도 이어서 기록)
// 원문은 암호화만 해서 저장한다. 정리 때 _redact.ts로 개인정보를 지운 글만 AI로 보낸다 (LAW-6)
export async function saveTranscript(visitId: string, transcript: string) {
  await ownVisitOrThrow(visitId);
  await prisma.visit.update({ where: { id: visitId }, data: { transcript: encryptText(transcript), status: "RECORDING" } });
}

// "다 말했어요": 녹음을 끝내고 정리 화면으로
export async function finishRecording(visitId: string, transcript: string, changed: string[] = []) {
  const v = await ownVisitOrThrow(visitId);
  if (!transcript.trim()) throw new Error("녹음 내용이 없어요.");
  // 기록 확인에서 돌아와 고쳐 말한 칸은 비워 둔다 → 다시 정리할 때 그 칸만 새로 말한 값으로 채워진다 (D-42 261101.ver)
  if (v.report?.careRecord && changed.length) {
    const cleared = clearFields(JSON.parse(decryptText(v.report.careRecord)) as CareRecord, changed.slice(0, 50).map(String));
    await prisma.report.update({ where: { visitId }, data: { careRecord: encryptText(JSON.stringify(cleared)) } });
  }
  await prisma.visit.update({
    where: { id: visitId },
    data: { transcript: encryptText(transcript), status: "RECORDED", endedAt: new Date() },
  });
}

// 녹음 글에서 개인정보를 지우고 AI로 급여제공기록지를 채운다 (LAW-1·2·6).
// 키가 없거나 AI가 실패하면 _extract.ts(낱말 찾기)로 채워서 기록은 계속 만든다
async function fillVisitRecord(transcript: string, clientId: string, caregiverId: string) {
  const fallback = () => extractRecord(transcript);
  if (!transcript.trim() || !process.env.GROQ_API_KEY) return fallback();
  const [client, caregiver] = await Promise.all([
    prisma.client.findUnique({ where: { id: clientId }, select: { name: true, guardianName: true, phone: true, guardianPhone: true } }),
    prisma.caregiver.findUnique({ where: { id: caregiverId }, select: { name: true } }),
  ]);
  if (!client) return fallback();
  // SEC-3: 한도를 넘으면 AI 없이 낱말 찾기로 채운다 (기록은 막지 않음)
  if (!(await takeAiCall(caregiverId, "fill-record"))) return fallback();
  const people = { client: openPII(client.name), guardian: client.guardianName, caregiver: caregiver?.name, phones: [openPII(client.phone), openPII(client.guardianPhone)] };
  try {
    const { record, quotes } = fillGaps(await fillRecord(redactForAi(transcript, people)), fallback());
    const roles = (t: string | null) => (t ? toRoleWords(t) : t);
    const names = (t: string | null) => (t ? restoreNames(t, people) : t);
    return {
      record: { ...record, physicalNote: roles(record.physicalNote), notes: roles(record.notes), guardianNotes: roles(record.guardianNotes ?? null) },
      quotes: Object.fromEntries(Object.entries(quotes).map(([k, t]) => [k, names(t)])) as typeof quotes,
      byAi: true,
    };
  } catch (err) {
    console.error("AI 정리 실패, 낱말 찾기로 채움", err);
    return fallback();
  }
}

// C-13 정리: 녹음 내용을 급여제공기록지 모양으로 채워 보고서 초안을 만든다
// shortcut: AI 정리를 디자인 쪽에서 먼저 붙였다(10/13), 개발 1이 LAW-1·2 프롬프트를 다듬으면 _ai.ts만 바꾼다
export async function summarizeVisit(visitId: string) {
  const v = await ownVisitOrThrow(visitId);
  // 이미 정리 중이거나 끝났으면 다시 하지 않는다 (STB-2)
  if (v.status === "SUMMARIZING" || v.status === "DRAFT_READY") return;
  await prisma.visit.update({ where: { id: visitId }, data: { status: "SUMMARIZING" } });
  try {
    const filled = await fillVisitRecord(v.transcript ? decryptText(v.transcript) : "", v.clientId, v.caregiverId);
    // "더 말하기"로 다시 정리할 때는 이미 있던 값(직접 고친 값 포함)을 지키고 빈 칸만 새로 채운다
    const record = v.report?.careRecord ? keepFilled(JSON.parse(decryptText(v.report.careRecord)), filled.record, v.report.wasEdited) : filled.record;
    const quotes = filled.quotes;
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

// C-14 특이사항 칸에서 빠진 도움·조치를 그 자리에서 말로 더한다: 지금 특이사항 + 새로 한 말을 AI가 다시 정리한다.
// 새로 한 말은 녹음 글 끝에도 붙여 둔다(나중에 다시 정리해도 남도록)
export async function addToNotes(visitId: string, spoken: string): Promise<CareRecord> {
  const v = await ownVisitOrThrow(visitId);
  if (!v.report?.careRecord) throw new Error("정리된 기록이 없어요.");
  const text = spoken.trim();
  if (!text) throw new Error("말한 내용이 없어요.");
  const old = JSON.parse(decryptText(v.report.careRecord)) as CareRecord;
  const joined = `${old.notes ?? ""} ${text}`.trim();
  const filled = await fillVisitRecord(joined, v.clientId, v.caregiverId);
  const record: CareRecord =
    "byAi" in filled && filled.record.notes
      ? { ...old, notes: filled.record.notes, guardianNotes: filled.record.guardianNotes, notesNoAction: filled.record.notesNoAction, notesAsk: filled.record.notesAsk }
      : { ...old, notes: joined, guardianNotes: null, notesNoAction: false, notesAsk: null }; // AI가 없거나 실패하면 한 말을 그대로 붙인다
  const transcript = `${v.transcript ? decryptText(v.transcript) : ""} ${text}`.trim();
  await prisma.$transaction([
    prisma.visit.update({ where: { id: visitId }, data: { transcript: encryptText(transcript) } }),
    prisma.report.update({
      where: { visitId },
      data: { careRecord: encryptText(JSON.stringify(record)), notes: encryptText(record.notes ?? ""), wasEdited: true },
    }),
  ]);
  return record;
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

// 급여제공기록지 서명 저장 (LAW-9). 서명은 기록 내용이 아니라서 보낸 뒤에도 받을 수 있다. 개인정보라 암호화해 둔다
export async function saveSignatures(visitId: string, value: unknown) {
  const v = await ownVisitOrThrow(visitId, { editable: false });
  if (!v.report) throw new Error("정리된 기록이 없어요.");
  const s = cleanSignatures(value);
  await prisma.report.update({
    where: { visitId },
    data: { signatures: isEmptySignatures(s) ? null : encryptText(JSON.stringify(s)) },
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

// 게시판 댓글 (DIF-5, D-15 261101.ver). 글은 암호화해 저장한다 (LAW-11)
const COMMENT_MAX = 500;
function commentBody(text: string) {
  const t = text.trim();
  if (!t) throw new Error("댓글을 적어 주세요.");
  if (t.length > COMMENT_MAX) throw new Error(`댓글은 ${COMMENT_MAX}자까지 쓸 수 있어요.`);
  return encryptText(t);
}

// 댓글을 달 글: 보낸 보고서 또는 게시판에 올린 서류 (같은 shareToken 자리를 쓴다)
async function postTarget(shareToken: string, caregiverId?: string) {
  const own = caregiverId ? { caregiverId } : { isActive: true };
  const [r, d] = await Promise.all([
    prisma.report.findFirst({
      where: { shareToken, sentAt: { not: null }, visit: { ...(caregiverId ? { caregiverId } : {}), client: { ...own, purgeAt: null } } },
      select: { id: true },
    }),
    prisma.sharedDocument.findFirst({ where: { shareToken, client: { ...own, purgeAt: null } }, select: { id: true } }),
  ]);
  if (r) return { reportId: r.id };
  if (d) return { documentId: d.id };
  throw new Error("게시글을 찾을 수 없어요.");
}

// C-18 요양보호사: 내 수급자의 글에만
export async function commentAsCaregiver(shareToken: string, text: string) {
  const caregiver = await requireCaregiver();
  const target = await postTarget(shareToken, caregiver.id);
  await prisma.comment.create({ data: { ...target, author: "caregiver", body: commentBody(text) } });
}

// G-02 보호자: 로그인 없이 링크로. 보낸 보고서·올린 서류, 지우지 않은 수급자에만
// shortcut: 링크만 있으면 누구나 보호자로 댓글을 단다, 보호자 로그인(D-44)이 생기면 그걸로 막는다
export async function commentAsGuardian(shareToken: string, text: string) {
  const target = await postTarget(shareToken);
  await prisma.comment.create({ data: { ...target, author: "guardian", body: commentBody(text) } });
}

// 게시글을 열면 상대가 단 댓글을 읽음으로 (DIF-5 안 읽은 수)
export async function markReadAsCaregiver(shareToken: string) {
  const caregiver = await requireCaregiver();
  const target = await postTarget(shareToken, caregiver.id);
  await prisma.comment.updateMany({ where: { ...target, author: "guardian", readAt: null }, data: { readAt: new Date() } });
}
export async function markReadAsGuardian(shareToken: string) {
  const target = await postTarget(shareToken);
  await prisma.comment.updateMany({ where: { ...target, author: "caregiver", readAt: null }, data: { readAt: new Date() } });
}

// 하단 메뉴 "게시판" 위 숫자 (화면이 바뀔 때마다 다시 묻는다)
export async function myUnreadTotal(): Promise<number> {
  const { myUnreadByClient } = await import("./_data");
  return [...(await myUnreadByClient()).values()].reduce((a, b) => a + b, 0);
}

// C-20 진료 참고용 요약 "게시판에 올리기": 같은 기간을 이미 올렸으면 다시 만들지 않는다
export async function shareSummary(clientId: string, from: string, to: string) {
  const c = await ownClientOrThrow(clientId);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to) || from > to) throw new Error("기간이 올바르지 않아요.");
  if (c.guardianRelation === NO_CONTACT) throw new Error("보호자가 없어 게시판이 없어요.");
  const exists = await prisma.sharedDocument.findFirst({ where: { clientId, kind: "summary", from, to } });
  if (!exists) await prisma.sharedDocument.create({ data: { clientId, caregiverId: c.caregiverId!, kind: "summary", from, to } });
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
