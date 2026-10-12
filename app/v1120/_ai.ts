import Groq from "groq-sdk";
import { cleanEnv } from "@/lib/env";

// C-13 정리의 특이사항 요약. 받는 글은 _redact.ts로 개인정보를 지운 특이사항 문장뿐이다.
// 나머지 칸(체크·분·횟수)은 아직 _extract.ts가 채운다.

const SYSTEM_PROMPT = [
  "당신은 요양보호사가 방문 중 말로 남긴 기록에서 '특이사항'을 정리하는 도우미입니다.",
  "입력은 녹음을 글로 옮긴 문장이라 군말·반복·말 끊김이 섞여 있습니다.",
  "규칙:",
  "1. 요양보호사가 보고 들은 사실만 적습니다. 진단·병명 추측·처방·치료 권유는 쓰지 않습니다 (예: '고혈압이 의심됩니다', '병원에 가 보셔야 합니다' 금지).",
  "2. 입력에 없는 내용은 만들지 않습니다. 숫자(혈압·횟수·시간)는 들은 그대로 씁니다.",
  "3. 군말과 같은 말 반복은 빼고, 한 가지 사실을 한 문장으로 짧게 씁니다. 최대 3문장.",
  "4. 가족이 읽기 쉽게 모든 문장을 '-요'로 끝냅니다('-습니다' 금지). 사람은 '어르신'이라고 부릅니다.",
  "   예: '음 혈압이 어 135에 85? 무릎이 아프다고 무릎이 계속' → '혈압은 135/85였어요. 무릎이 계속 아프다고 하셨어요.'",
  "5. '[전화번호]' 같은 가림 표시는 그대로 두거나 뺍니다. 되살리지 않습니다.",
  "6. 특이사항으로 볼 내용이 없으면 notes를 빈 문자열로 둡니다.",
].join("\n");

const groq = new Groq({ apiKey: cleanEnv(process.env.GROQ_API_KEY) });

export async function summarizeNotes(redacted: string): Promise<string | null> {
  const completion = await groq.chat.completions.create({
    model: "openai/gpt-oss-120b",
    temperature: 0,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: redacted },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "care_notes",
        strict: true,
        schema: {
          type: "object",
          properties: { notes: { type: "string", description: "정리한 특이사항. 없으면 빈 문자열" } },
          required: ["notes"],
          additionalProperties: false,
        },
      },
    },
  });
  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("AI 정리 응답이 비어 있어요.");
  const notes = (JSON.parse(raw) as { notes?: unknown }).notes;
  return typeof notes === "string" && notes.trim() ? notes.trim() : null;
}
