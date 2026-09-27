import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/absoluteUrl";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const clientId = formData.get("clientId");
  if (typeof clientId !== "string" || !clientId) {
    return NextResponse.json({ error: "clientId가 필요합니다." }, { status: 400 });
  }

  const caregiver = await prisma.caregiver.findFirst();
  if (!caregiver) {
    return NextResponse.json({ error: "등록된 요양보호사가 없습니다." }, { status: 500 });
  }

  const visit = await prisma.visit.create({
    data: {
      caregiverId: caregiver.id,
      clientId,
      status: "RECORDING",
      startedAt: new Date(),
    },
  });

  return NextResponse.redirect(absoluteUrl(`/visit/${visit.id}/record`, req), 303);
}
