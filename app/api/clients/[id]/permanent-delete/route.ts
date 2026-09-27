import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/absoluteUrl";

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // 즉시 지우지 않고 유예기간을 둔다 — 악의적 기록 은폐를 막기 위해 서버에는
  // 실제로 2주간 원본이 남아있는다(화면에는 노출하지 않음).
  await prisma.client.update({
    where: { id },
    data: { purgeAt: new Date(Date.now() + FOURTEEN_DAYS_MS) },
  });

  return NextResponse.redirect(absoluteUrl("/clients/manage", req), 303);
}
