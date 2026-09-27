import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { cleanEnv } from "@/lib/env";
import { MAX_AUDIO_UPLOAD_BYTES, AUDIO_TOO_LARGE_MESSAGE } from "@/lib/audioUpload";

export const runtime = "nodejs";
export const maxDuration = 60;

const groq = new Groq({ apiKey: cleanEnv(process.env.GROQ_API_KEY) });

export async function POST(req: NextRequest) {
  const contentLength = Number(req.headers.get("content-length") ?? 0);
  if (contentLength > MAX_AUDIO_UPLOAD_BYTES) {
    return NextResponse.json({ error: AUDIO_TOO_LARGE_MESSAGE }, { status: 400 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const file = form.get("audio");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "오디오 파일이 없습니다." }, { status: 400 });
  }
  if (file.size > MAX_AUDIO_UPLOAD_BYTES) {
    return NextResponse.json({ error: AUDIO_TOO_LARGE_MESSAGE }, { status: 400 });
  }

  let transcription;
  try {
    transcription = await groq.audio.transcriptions.create({
      file,
      model: "whisper-large-v3-turbo",
      language: "ko",
      response_format: "json",
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "음성 파일을 처리하지 못했어요. 파일 형식을 확인하거나 다시 시도해주세요." },
      { status: 500 }
    );
  }

  const text = transcription.text?.trim();
  if (!text) {
    return NextResponse.json(
      { error: "음성에서 내용을 찾지 못했어요. 다시 녹음하거나 직접 입력해주세요." },
      { status: 500 }
    );
  }

  return NextResponse.json({ text });
}
