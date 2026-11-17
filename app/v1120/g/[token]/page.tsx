import { guardianPassed } from "@/lib/guardianGate";
import { GuardianCheck } from "../../_components/GuardianCheck";
import { prisma } from "@/lib/prisma";
import { decryptText, openPII } from "@/lib/crypto";
import { boardOpen, serviceTimeOf } from "../../_data";
import { isSampleReportToken } from "../../_mock";
import { BoardExpired, LinkGone } from "../../_components/Board";
import { fixRecordText } from "../../_ai";
import { contactTitle, type CareRecord, type GuardianReportProps } from "../../_types";
import { GuardianReport } from "./GuardianReport";
import { getSessionCaregiverId } from "@/lib/session";
import { cleanSignatures } from "../../_signatures";

// G-01 보호자 보고서. 로그인 없이 링크(shareToken)로 연다. 보낸 기록만, 지운 수급자는 안 보인다.
// 맞지 않는 링크는 "볼 수 없는 링크", 기한(STB-5, 게시판과 같은 boardExpiresAt)이 지나면 "기간이 지났어요". 보낸 요양보호사 본인은 기한과 상관없이 본다

// 보호자 서명이 이미 들어왔는지. 풀 수 없으면 안 한 것으로 본다
function recipientSigned(enc: string | null) {
  if (!enc) return false;
  try {
    return cleanSignatures(JSON.parse(decryptText(enc))).recipient.length > 0;
  } catch {
    return false;
  }
}

async function sentReport(token: string, me: string | null): Promise<GuardianReportProps | "expired" | null> {
  const r = await prisma.report.findUnique({
    where: { shareToken: token },
    include: { visit: { include: { client: true, caregiver: true } } },
  });
  const { visit } = r ?? {};
  if (!r?.sentAt || !r.careRecord || !visit || !visit.client.isActive || visit.client.purgeAt) return null;
  if (me !== visit.caregiverId && !boardOpen(visit.client)) return "expired";
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
    clientId: me && me === visit.caregiverId ? visit.clientId : undefined, // 보낸 본인만 자기 게시판으로
  };
}

export default async function GuardianReportPage({ params, searchParams }: PageProps<"/v1120/g/[token]">) {
  const { token } = await params;
  const { order, from } = await searchParams;
  // 요양보호사로 로그인된 기기(보낸 화면의 "보호자가 보는 화면 확인하기" 등)에서는 서명칸을 보기만 한다
  const me = await getSessionCaregiverId();
  const asCaregiver = !!me;
  const sent = await sentReport(token, me);
  if (sent === "expired") return <BoardExpired />;
  if (!sent && !isSampleReportToken(token)) return <LinkGone />;
  if (!(await guardianPassed(token))) return <GuardianCheck token={token} />;
  return <GuardianReport token={token} order={order === "improved" ? "improved" : "base"} sent={sent} fromBoard={from === "board"} asCaregiver={asCaregiver} />;
}
