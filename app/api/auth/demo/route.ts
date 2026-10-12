import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/absoluteUrl";
import { createSession } from "@/lib/session";
import { WEEKDAY_LABELS } from "@/lib/schedule";
import { randomUUID } from "node:crypto";
import { encryptText } from "@/lib/crypto";
import type { Prisma } from "@/app/generated/prisma/client";
import { clients as sampleClients, sampleRecord } from "@/app/v1120/_mock";
import type { CareRecord } from "@/app/v1120/_types";

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
    await prisma.report.deleteMany({ where: { visit: { OR: [{ caregiverId: id }, { client: { caregiverId: id } }] } } });
    await prisma.visit.deleteMany({ where: { OR: [{ caregiverId: id }, { client: { caregiverId: id } }] } });
    await prisma.client.deleteMany({ where: { caregiverId: id } });
    await prisma.aiUsage.deleteMany({ where: { caregiverId: id } });
    await prisma.caregiver.delete({ where: { id } });
  }
}

// 지난 2주 동안 일정 요일마다 보낸 방문 기록 (이력·서류 화면에서 볼 수 있게)
const NOTES = ["점심을 반만 드셨어요. 혈압 142/90.", "오른쪽 무릎이 아프다고 하셨어요. 혈압 128/82.", null, "밤에 두 번 깨셨다고 하셨어요.", null];
async function createSampleHistory(caregiverId: string) {
  const clients = await prisma.client.findMany({ where: { caregiverId } });
  const kstMidnight = new Date(`${new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date())}T00:00:00+09:00`);
  let n = 0;
  // DB가 멀 수 있어서 한 건씩 만들지 않고 모아서 두 번에 넣는다
  const visits: Prisma.VisitCreateManyInput[] = [];
  const reports: Prisma.ReportCreateManyInput[] = [];
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
      visits.push({ id: visitId, caregiverId, clientId: c.id, status: "SENT", startedAt: at(sh, sm), endedAt: at(eh, em), createdAt: at(sh, sm) });
      reports.push({
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
