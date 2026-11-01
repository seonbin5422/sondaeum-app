import { prisma } from "@/lib/prisma";

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
}
