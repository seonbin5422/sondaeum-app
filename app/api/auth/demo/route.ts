import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/absoluteUrl";
import { createSession } from "@/lib/session";
import { WEEKDAY_LABELS } from "@/lib/schedule";
import { randomUUID } from "node:crypto";
import { encryptText } from "@/lib/crypto";
import type { Prisma } from "@/app/generated/prisma/client";
import { clients as sampleClients, sampleRecord } from "@/app/v1120/_mock";
import { NO_CONTACT, type CareRecord } from "@/app/v1120/_types";

export const runtime = "nodejs";

const DEMO_TTL_MS = 24 * 60 * 60 * 1000;

// 24시간 지난 체험 계정을 수급자·방문 기록과 함께 지운다.
// shortcut: 정해진 시각에 도는 작업이 없어 누군가 "둘러보기"를 누를 때만 지운다, 체험 계정이 많아지면 Vercel Cron으로 옮긴다
async function purgeExpiredDemos() {
  const expired = await prisma.caregiver.findMany({
    where: { isDemo: true, demoExpiresAt: { lte: new Date() } },
    select: { id: true },
  });
  for (const { id } of expired) {
    await prisma.comment.deleteMany({ where: { report: { visit: { OR: [{ caregiverId: id }, { client: { caregiverId: id } }] } } } });
    await prisma.report.deleteMany({ where: { visit: { OR: [{ caregiverId: id }, { client: { caregiverId: id } }] } } });
    await prisma.visit.deleteMany({ where: { OR: [{ caregiverId: id }, { client: { caregiverId: id } }] } });
    await prisma.comment.deleteMany({ where: { document: { client: { caregiverId: id } } } });
    await prisma.sharedDocument.deleteMany({ where: { client: { caregiverId: id } } });
    await prisma.client.deleteMany({ where: { caregiverId: id } });
    await prisma.aiUsage.deleteMany({ where: { caregiverId: id } });
    await prisma.caregiver.delete({ where: { id } });
  }
}

// 지난 2주 동안 일정 요일마다 보낸 방문 기록 (이력·서류 화면에서 볼 수 있게)
const NOTES = [
  "점심을 반만 드셨어요. 혈압 142/90.",
  "오른쪽 무릎이 아프다고 하셔서 걸으실 때 부축해 드렸어요. 혈압 128/82.",
  null,
  "밤에 두 번 깨셨다고 하셨어요. 낮에 30분 산책하며 기분이 좋으셨어요.",
  "아침 약을 드신 걸 확인했어요. 따님 이야기를 하시며 많이 웃으셨어요.",
  null,
  "저녁 반찬이 짜다고 조금만 드셨어요. 물을 자주 드시도록 권해 드렸어요.",
];
async function createSampleHistory(caregiverId: string) {
  const clients = await prisma.client.findMany({ where: { caregiverId } });
  const kstMidnight = new Date(`${new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date())}T00:00:00+09:00`);
  let n = 0;
  // DB가 멀 수 있어서 한 건씩 만들지 않고 모아서 두 번에 넣는다
  const visits: Prisma.VisitCreateManyInput[] = [];
  const reports: Prisma.ReportCreateManyInput[] = [];
  const sent: { clientId: string; reportId: string; sentAt: Date }[] = [];
  for (const c of clients) {
    const [days, time] = (c.scheduleLabel ?? "").split(" ");
    const [[sh, sm], [eh, em]] = (time ?? "09:00-11:00").split("-").map((t) => t.split(":").map(Number));
    for (let back = 14; back >= 1; back--) {
      const day = new Date(kstMidnight.getTime() - back * 24 * 60 * 60 * 1000);
      const kstWeekday = new Date(day.getTime() + 9 * 60 * 60 * 1000).getUTCDay(); // day는 한국 0시
      if (!days.split(",").includes(WEEKDAY_LABELS[kstWeekday])) continue;
      const at = (h: number, m: number) => new Date(day.getTime() + (h * 60 + m) * 60 * 1000);
      const notes = NOTES[n++ % NOTES.length];
      const record: CareRecord = {
        ...structuredClone(sampleRecord),
        change: { physical: "same", meal: n % 4 === 0 ? "worse" : "same", cognitive: "same" },
        bowel: { stoolAccidents: 0, urineAccidents: n % 3 === 0 ? 1 : 0, diaperChanges: null },
        notes,
      };
      const visitId = randomUUID();
      const reportId = randomUUID();
      sent.push({ clientId: c.id, reportId, sentAt: at(eh, em) });
      visits.push({ id: visitId, caregiverId, clientId: c.id, status: "SENT", startedAt: at(sh, sm), endedAt: at(eh, em), createdAt: at(sh, sm) });
      reports.push({
        id: reportId,
        visitId,
        meals: encryptText(""),
        medication: encryptText(""),
        notes: encryptText(notes ?? ""),
        careRecord: encryptText(JSON.stringify(record)),
        sentAt: at(eh, em),
      });
    }
  }
  await prisma.visit.createMany({ data: visits });
  await prisma.report.createMany({ data: reports });
  await createSampleBoard(caregiverId, clients, sent, kstMidnight);
}

// 게시판(DIF-5)이 비어 보이지 않게: 보호자가 있는 첫 수급자의 최근 보고서 2개에 댓글, 둘째 수급자에게 진료 참고용 요약 글 하나
async function createSampleBoard(
  caregiverId: string,
  clients: { id: string; guardianRelation: string }[],
  sent: { clientId: string; reportId: string; sentAt: Date }[],
  kstMidnight: Date,
) {
  const [first, second] = clients.filter((c) => c.guardianRelation !== NO_CONTACT);
  const later = (d: Date, min: number) => new Date(d.getTime() + min * 60 * 1000);
  const comments: Prisma.CommentCreateManyInput[] = [];
  if (first) {
    const [last, prev] = sent.filter((s) => s.clientId === first.id).sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime());
    const add = (r: (typeof sent)[number] | undefined, lines: ["guardian" | "caregiver", number, string][]) =>
      r && lines.forEach(([author, min, text]) => comments.push({ reportId: r.reportId, author, body: encryptText(text), createdAt: later(r.sentAt, min) }));
    add(prev, [
      ["guardian", 420, "무릎이 아프시다고 해서 걱정이네요. 병원에 가 봐야 할까요?"],
      ["caregiver", 1140, "걸으실 때 조금 불편해하셨어요. 진료 받아 보시면 좋겠어요. 진료 참고용 요약을 만들어 드릴게요."],
    ]);
    add(last, [
      ["guardian", 300, "식사를 반만 드셨네요. 내일 반찬을 좀 보낼게요."],
      ["caregiver", 330, "네, 다음 방문 때 같이 챙겨 드릴게요."],
    ]);
  }
  if (second) {
    const ymd = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(d);
    const doc = await prisma.sharedDocument.create({
      data: { clientId: second.id, caregiverId, kind: "summary", from: ymd(new Date(kstMidnight.getTime() - 14 * 24 * 60 * 60 * 1000)), to: ymd(kstMidnight), createdAt: later(kstMidnight, -120) },
    });
    comments.push({ documentId: doc.id, author: "guardian", body: encryptText("다음 주 병원 갈 때 보여 드릴게요. 감사합니다."), createdAt: later(kstMidnight, -60) });
  }
  if (comments.length) await prisma.comment.createMany({ data: comments });
}

// OPS-1 체험하기: 카카오 없이 체험용 요양보호사 계정과 샘플 수급자 3명, 지난 2주 방문 기록을 만들고, 처음 가입처럼 온보딩부터 보여준다.
export async function POST(req: NextRequest) {
  await purgeExpiredDemos();
  const caregiver = await prisma.caregiver.create({
    data: { name: "체험 요양보호사", isDemo: true, demoExpiresAt: new Date(Date.now() + DEMO_TTL_MS) },
  });
  // 1120 화면 임시 데이터의 수급자 중 삭제되지 않은 3명을 그대로 쓴다
  await prisma.client.createMany({
    data: sampleClients
      .filter((c) => c.isActive)
      .slice(0, 3)
      .map((c) => {
        const [start, end] = c.scheduleLabel.split(" ").pop()!.split("–");
        return {
          caregiverId: caregiver.id,
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
          careRegistrationNumber: c.careRegistrationNumber,
          careGrade: c.careGrade,
          phone: c.phone,
          scheduleLabel: `${c.scheduleDays.map((d) => WEEKDAY_LABELS[d]).join(",")} ${start}-${end}`,
        };
      }),
  });
  await createSampleHistory(caregiver.id);
  await createSession(caregiver.id);
  return NextResponse.redirect(absoluteUrl("/v1120/onboarding", req), 303);
}
