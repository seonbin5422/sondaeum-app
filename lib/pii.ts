import { redactForAi } from "@/app/v1120/_redact";

// LAW-6: 예전 화면 경로(녹음 끝내기·보고서 고치기·보고서 분류)도 1120처럼 앱 안에서 번호 모양(주민·카드·전화·계좌)을 지운다.
// 전에는 지우는 일 자체를 Groq에 시켜서 지우기 전 원문이 먼저 해외로 나갔다(03-legal 3절).
// shortcut: 이름은 DB 값을 아는 1120 경로(_actions.ts)만 지운다. 예전 화면은 정리 예정이라 번호만, 옛 화면을 계속 쓰게 되면 이름도 넘긴다
export function redactPii(text: string): string {
  return redactForAi(text, { client: "" });
}
