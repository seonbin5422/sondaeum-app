import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encryptText } from "@/lib/crypto";
import { redactPii } from "@/lib/pii";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const transcript = typeof body.transcript === "string" ? body.transcript : "";

  let redacted: string;
  try {
    redacted = await redactPii(transcript);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "개인정보 필터링에 실패해 저장을 중단했습니다. 다시 시도해주세요." },
      { status: 500 }
    );
  }

  const visit = await prisma.visit.update({
    where: { id },
    data: { transcript: encryptText(redacted), status: "RECORDED", endedAt: new Date() },
  });

  return NextResponse.json({ visit });
}
