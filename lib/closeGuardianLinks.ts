import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";

// 보호자 링크를 기한 전에 모두 닫는다: 보낸 보고서·올린 서류 링크를 새 값으로 바꾸고 게시판 초대 링크를 지운다.
// 기한(boardExpiresAt)만 당기면 새 보고서를 보낼 때 옛 링크가 다시 열려서, 링크 값 자체를 바꾼다. 다음 초대 때 새 초대 링크가 생긴다(myBoardToken)
export async function closeGuardianLinks(clientId: string) {
  const reports = await prisma.report.findMany({ where: { visit: { clientId } }, select: { id: true } });
  const docs = await prisma.sharedDocument.findMany({ where: { clientId }, select: { id: true } });
  const token = () => randomUUID().replaceAll("-", "");
  await prisma.$transaction([
    ...reports.map((r) => prisma.report.update({ where: { id: r.id }, data: { shareToken: token() } })),
    ...docs.map((d) => prisma.sharedDocument.update({ where: { id: d.id }, data: { shareToken: token() } })),
    prisma.client.update({ where: { id: clientId }, data: { boardToken: null } }),
  ]);
}
