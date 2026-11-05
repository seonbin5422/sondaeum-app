import { prisma } from "@/lib/prisma";

// 지운 수급자 수를 돌려준다 (Cron 기록용)
export async function purgeExpiredClients() {
  const expired = await prisma.client.findMany({
    where: { purgeAt: { lte: new Date() } },
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
