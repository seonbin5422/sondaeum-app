import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/absoluteUrl";
import { createSession } from "@/lib/session";
import { WEEKDAY_LABELS } from "@/lib/schedule";
import { clients as sampleClients } from "@/app/v1120/_mock";

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
    await prisma.caregiver.delete({ where: { id } });
  }
}

// OPS-1 체험하기: 카카오 없이 체험용 요양보호사 계정과 샘플 수급자 3명을 만들고, 처음 가입처럼 온보딩부터 보여준다.
// shortcut: 지난 2주 방문 기록은 아직 없음, 방문 기록(2단계)을 DB에 연결할 때 함께 만든다
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
  await createSession(caregiver.id);
  return NextResponse.redirect(absoluteUrl("/v1120/onboarding", req), 303);
}
