import { prisma } from "@/lib/prisma";

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

// 완전히 지우기 예약(purgeAt)이 지났거나 일반 삭제(deletedAt) 뒤 14일이 지난 수급자를 지운다. 지운 수를 돌려준다 (Cron 기록용)
export async function purgeExpiredClients() {
  const expired = await prisma.client.findMany({
    where: { OR: [{ purgeAt: { lte: new Date() } }, { isActive: false, deletedAt: { lte: new Date(Date.now() - FOURTEEN_DAYS_MS) } }] },
    select: { id: true },
  });

  for (const { id } of expired) {
    await prisma.comment.deleteMany({ where: { report: { visit: { clientId: id } } } });
    await prisma.report.deleteMany({ where: { visit: { clientId: id } } });
    await prisma.visit.deleteMany({ where: { clientId: id } });
    await prisma.comment.deleteMany({ where: { document: { clientId: id } } });
    await prisma.sharedDocument.deleteMany({ where: { clientId: id } });
    await prisma.client.delete({ where: { id } });
  }
  return expired.length;
}
