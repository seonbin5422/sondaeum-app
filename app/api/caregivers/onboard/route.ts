import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/absoluteUrl";
import { verifySession } from "@/lib/dal";

export async function POST(req: NextRequest) {
  const { caregiverId } = await verifySession();
  const formData = await req.formData();
  const name = typeof formData.get("name") === "string" ? String(formData.get("name")).trim() : "";
  const licenseNumber = String(formData.get("licenseNumber") ?? "").trim();

  await prisma.caregiver.update({
    where: { id: caregiverId },
    data: {
      name: name || undefined,
      licenseNumber: licenseNumber || null,
    },
  });

  // 1120 온보딩(동의 화면)에서 온 요청은 1120 홈으로 돌려보낸다
  const next = formData.get("next") === "/v1120" ? "/v1120" : "/";
  return NextResponse.redirect(absoluteUrl(next, req), 303);
}
