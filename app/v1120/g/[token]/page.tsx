import { prisma } from "@/lib/prisma";
import { decryptText, openPII } from "@/lib/crypto";
import { serviceTimeOf } from "../../_data";
import { contactTitle, type CareRecord, type GuardianReportProps } from "../../_types";
import { GuardianReport } from "./GuardianReport";

// G-01 보호자 보고서. 로그인 없이 링크(shareToken)로 연다. 보낸 기록만, 지운 수급자는 안 보인다.
// shortcut: 링크 만료·미리보기 봇 제외(STB-5)·열람 기록은 아직 없음
async function sentReport(token: string): Promise<GuardianReportProps | null> {
  const r = await prisma.report.findUnique({
    where: { shareToken: token },
    include: { visit: { include: { client: true, caregiver: true } } },
  });
  const { visit } = r ?? {};
  if (!r?.sentAt || !r.careRecord || !visit || !visit.client.isActive || visit.client.purgeAt) return null;
  const time = serviceTimeOf(visit.client.scheduleLabel, visit.startedAt ?? visit.createdAt);
  return {
    guardianName: visit.client.guardianName,
    guardianTitle: contactTitle(visit.client.guardianRelation),
    clientName: openPII(visit.client.name),
    caregiverName: visit.caregiver.name,
    startedAt: time.startedAt,
    endedAt: time.endedAt,
    record: JSON.parse(decryptText(r.careRecord)) as CareRecord,
  };
}

export default async function GuardianReportPage({ params, searchParams }: PageProps<"/v1120/g/[token]">) {
  const { token } = await params;
  const { order, from } = await searchParams;
  return <GuardianReport token={token} order={order === "improved" ? "improved" : "base"} sent={await sentReport(token)} fromBoard={from === "board"} />;
}
