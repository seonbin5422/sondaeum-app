import Groq from "groq-sdk";
import { cleanEnv } from "@/lib/env";

const groq = new Groq({ apiKey: cleanEnv(process.env.GROQ_API_KEY) });

const REDACTION_SYSTEM_PROMPT =
  "당신은 요양보호사 방문 기록에서 개인 민감정보를 찾아 제거하는 도우미입니다. " +
  "다음 종류의 정보를 발견하면 해당 부분만 '[개인정보 제외]'로 바꾸세요: " +
  "주민등록번호, 전화번호, 계좌번호·카드번호, 구체적인 주소(도로명·지번·상세 위치), " +
  "어르신과 요양보호사 본인을 제외한 제3자의 실명, 구체적인 금액이 언급된 가족 간 금전·유산 분쟁 내용. " +
  "어르신의 건강 상태, 식사, 복약, 돌봄에 필요한 정보는 절대 지우거나 바꾸지 마세요. " +
  "원문의 나머지 문장·순서는 그대로 두고, 해당되는 부분만 '[개인정보 제외]'로 치환한 " +
  "전체 텍스트만 반환하세요. 설명, 사과, 요약 등 다른 말은 절대 덧붙이지 마세요.";

/**
 * 암호화 직전에 호출한다. Groq 호출이 실패하면 예외를 그대로 던져서
 * (원문을 그대로 저장하는 대신) 상위 라우트가 저장을 중단하게 한다 —
 * 개인정보 보호 기능이므로 실패를 조용히 넘기지 않는다(fail-closed).
 */
async function requestRedaction(text: string): Promise<string | undefined> {
  const completion = await groq.chat.completions.create({
    model: "openai/gpt-oss-20b",
    messages: [
      { role: "system", content: REDACTION_SYSTEM_PROMPT },
      { role: "user", content: text },
    ],
  });
  return completion.choices[0]?.message?.content?.trim() || undefined;
}

export async function redactPii(text: string): Promise<string> {
  if (!text.trim()) return text;

  // gpt-oss-20b가 민감정보 없는 짧은 텍스트에 대해 가끔 빈 응답을 내놓는 경우가 있어
  // (모델의 정상적인 비결정성, API 실패가 아님) 한 번 재시도한다.
  const redacted = (await requestRedaction(text)) ?? (await requestRedaction(text));
  if (!redacted) throw new Error("개인정보 필터링 응답이 비어 있습니다.");
  return redacted;
}
