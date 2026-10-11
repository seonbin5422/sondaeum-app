import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/absoluteUrl";
import { createSession } from "@/lib/session";

export const runtime = "nodejs";

// OPS-1 체험하기: 카카오 없이 체험용 요양보호사 계정을 만들고, 처음 가입처럼 온보딩부터 보여준다.
// shortcut: 샘플 수급자 3명·지난 2주 방문 기록·24시간 뒤 자동 삭제는 아직 없음, 1120 화면을 DB에 연결할 때 함께 만든다.
export async function POST(req: NextRequest) {
  const caregiver = await prisma.caregiver.create({
    data: { name: "체험 요양보호사" },
  });
  await createSession(caregiver.id);
  return NextResponse.redirect(absoluteUrl("/v1120/onboarding", req), 303);
}
