import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/absoluteUrl";
import { verifySession } from "@/lib/dal";
import { CONSENT_ITEMS } from "@/app/v1120/_consent";

export async function POST(req: NextRequest) {
  const { caregiverId } = await verifySession();
  const formData = await req.formData();
  const name = typeof formData.get("name") === "string" ? String(formData.get("name")).trim() : "";
  const licenseNumber = String(formData.get("licenseNumber") ?? "").trim();

  // LAW-3: 1120 동의 화면은 동의한 항목 키를 보낸다. 필수 항목이 하나라도 빠지면 가입을 막는다
  const next = formData.get("next") === "/v1120" ? "/v1120" : "/";
  const agreed = String(formData.get("consent") ?? "").split(",").filter(Boolean);
  const allAgreed = CONSENT_ITEMS.every((i) => agreed.includes(i.key));
  if (next === "/v1120" && !allAgreed) {
    return NextResponse.json({ error: "모든 항목에 동의해야 쓸 수 있어요." }, { status: 400 });
  }

  await prisma.caregiver.update({
    where: { id: caregiverId },
    data: {
      name: name || undefined,
      licenseNumber: licenseNumber || null,
      ...(allAgreed ? { consentedAt: new Date(), consentItems: CONSENT_ITEMS.map((i) => i.key).join(",") } : {}),
    },
  });

  // 1120 온보딩(동의 화면)에서 온 요청은 1120 홈으로 돌려보낸다
  return NextResponse.redirect(absoluteUrl(next, req), 303);
}
