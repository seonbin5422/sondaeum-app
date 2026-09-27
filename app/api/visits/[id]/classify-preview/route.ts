import { NextRequest, NextResponse } from "next/server";
import { classifyCareNote } from "@/lib/careNoteAi";

export async function POST(req: NextRequest) {
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
