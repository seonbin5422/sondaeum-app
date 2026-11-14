import { prisma } from "@/lib/prisma";
import { decryptText, openPII } from "@/lib/crypto";
import { serviceTimeOf } from "../../_data";
import { fixRecordText } from "../../_ai";
import { contactTitle, type CareRecord, type GuardianReportProps } from "../../_types";
import { GuardianReport } from "./GuardianReport";
import { getSessionCaregiverId } from "@/lib/session";
import { cleanSignatures } from "../../_signatures";

// G-01 보호자 보고서. 로그인 없이 링크(shareToken)로 연다. 보낸 기록만, 지운 수급자는 안 보인다.
// shortcut: 링크 만료·미리보기 봇 제외(STB-5)·열람 기록은 아직 없음

// 보호자 서명이 이미 들어왔는지. 풀 수 없으면 안 한 것으로 본다
function recipientSigned(enc: string | null) {
  if (!enc) return false;
  try {
    return cleanSignatures(JSON.parse(decryptText(enc))).recipient.length > 0;
  } catch {
    return false;
  }
}

async function sentReport(token: string): Promise<GuardianReportProps | null> {
  const r = await prisma.report.findUnique({
    where: { shareToken: token },
    include: { visit: { include: { client: true, caregiver: true } } },
  });
  const { visit } = r ?? {};
  if (!r?.sentAt || !r.careRecord || !visit || !visit.client.isActive || visit.client.purgeAt) return null;
  const record = fixRecordText(JSON.parse(decryptText(r.careRecord)) as CareRecord);
  const time = serviceTimeOf(visit.client.scheduleLabel, visit.startedAt ?? visit.createdAt, record);
  return {
    guardianName: visit.client.guardianName,
    guardianTitle: contactTitle(visit.client.guardianRelation),
    clientName: openPII(visit.client.name),
    caregiverName: visit.caregiver.name,
    startedAt: time.startedAt,
    endedAt: time.endedAt,
    record,
    recipientSigned: recipientSigned(r.signatures),
  };
}

export default async function GuardianReportPage({ params, searchParams }: PageProps<"/v1120/g/[token]">) {
  const { token } = await params;
  const { order, from } = await searchParams;
  // 요양보호사로 로그인된 기기(보낸 화면의 "보호자가 보는 화면 확인하기" 등)에서는 서명칸을 보기만 한다
  const asCaregiver = !!(await getSessionCaregiverId());
  return <GuardianReport token={token} order={order === "improved" ? "improved" : "base"} sent={await sentReport(token)} fromBoard={from === "board"} asCaregiver={asCaregiver} />;
}
