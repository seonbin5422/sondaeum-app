import { prisma } from "@/lib/prisma";
import { decryptText } from "@/lib/crypto";
import type { CareRecord, GuardianReportProps } from "../../_types";
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
  return {
    guardianName: visit.client.guardianName,
    clientName: visit.client.name,
    caregiverName: visit.caregiver.name,
    startedAt: (visit.startedAt ?? r.sentAt).toISOString(),
    endedAt: (visit.endedAt ?? r.sentAt).toISOString(),
    record: JSON.parse(decryptText(r.careRecord)) as CareRecord,
  };
}

export default async function GuardianReportPage({ params, searchParams }: PageProps<"/v1120/g/[token]">) {
  const { token } = await params;
  const { order } = await searchParams;
  return <GuardianReport token={token} order={order === "improved" ? "improved" : "base"} sent={await sentReport(token)} />;
}
