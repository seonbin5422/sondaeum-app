import { NextRequest, NextResponse } from "next/server";
import { classifyCareNote } from "@/lib/careNoteAi";
import { apiCaregiverId, notFound, ownsVisit, unauthorized } from "@/lib/apiAuth";
import { AI_LIMIT_MESSAGE, takeAiCall } from "@/lib/aiLimit";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await apiCaregiverId();
  if (!me) return unauthorized();
  if (!(await ownsVisit(id, me))) return notFound();
  if (!(await takeAiCall(me, "classify-preview"))) return NextResponse.json({ error: AI_LIMIT_MESSAGE }, { status: 429 });
  const body = await req.json();
  const transcript = typeof body.transcript === "string" ? body.transcript.trim() : "";

  if (!transcript) {
    return NextResponse.json({ error: "내용이 없습니다." }, { status: 400 });
  }

  try {
    const draft = await classifyCareNote(transcript);
    return NextResponse.json(draft);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "분류에 실패했습니다." }, { status: 500 });
  }
}
