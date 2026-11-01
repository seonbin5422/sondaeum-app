import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/absoluteUrl";
import { apiCaregiverId, notFound, ownsClient, unauthorized } from "@/lib/apiAuth";

export async function POST(req: NextRequest) {
  const me = await apiCaregiverId();
  if (!me) return unauthorized();
  const formData = await req.formData();
  const clientId = formData.get("clientId");
  if (typeof clientId !== "string" || !clientId) {
    return NextResponse.json({ error: "clientId가 필요합니다." }, { status: 400 });
  }

  if (!(await ownsClient(clientId, me))) return notFound();

  const visit = await prisma.visit.create({
    data: {
      caregiverId: me, // SEC-2: 예전에는 첫 번째 요양보호사로 만들었다
      clientId,
      status: "RECORDING",
      startedAt: new Date(),
    },
  });

  return NextResponse.redirect(absoluteUrl(`/visit/${visit.id}/record`, req), 303);
}
