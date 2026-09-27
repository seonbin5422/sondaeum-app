import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { readEditGrantCaregiverId, clearEditGrantCookie } from "@/lib/editGrant";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { caregiverId } = await verifySession();
  if (caregiverId !== id) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const grantedCaregiverId = await readEditGrantCaregiverId();
  if (grantedCaregiverId !== caregiverId) {
    return NextResponse.json({ error: "본인 확인이 만료됐어요. 정보수정을 다시 눌러주세요." }, { status: 403 });
  }

  const body = await req.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const licenseNumber = typeof body.licenseNumber === "string" ? body.licenseNumber.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "이름을 입력해주세요." }, { status: 400 });
  }

  await prisma.caregiver.update({
    where: { id: caregiverId },
    data: { name, licenseNumber: licenseNumber || null },
  });
  await clearEditGrantCookie();

  return NextResponse.json({ ok: true });
}
