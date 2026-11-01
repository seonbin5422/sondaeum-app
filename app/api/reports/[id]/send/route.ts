import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/absoluteUrl";
import { apiCaregiverId, notFound, ownsReport, unauthorized } from "@/lib/apiAuth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const me = await apiCaregiverId();
  if (!me) return unauthorized();
  if (!(await ownsReport(id, me))) return notFound();

  const report = await prisma.report.update({
    where: { id },
    data: { sentAt: new Date() },
  });

  await prisma.visit.update({
    where: { id: report.visitId },
    data: { status: "SENT" },
  });

  return NextResponse.redirect(absoluteUrl(`/visit/${report.visitId}/sent`, req), 303);
}
