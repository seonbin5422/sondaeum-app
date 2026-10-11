// C-21 동의 항목 (LAW-3). 처음 설정의 동의 화면과 내 정보의 "동의한 내용 보기"가 같이 쓴다. 문구는 기획 초안 전 임시.
export const CONSENT_ITEMS = [
  { key: "personal", title: "개인정보 수집·이용", body: "이름, 자격번호, 수급자 이름·연락처를 돌봄 기록에 써요." },
  { key: "health", title: "건강정보(민감정보) 처리", body: "수급자의 식사·배변·혈압 같은 건강 상태를 기록해요." },
  { key: "guardian", title: "보호자에게 제공", body: "보낸 방문 보고서를 등록된 보호자에게 보여 줘요." },
  { key: "overseas", title: "국외 이전 (AI 정리)", body: "말한 내용을 정리하려고 미국의 AI 회사(Groq)에 보내요. 이름·전화번호는 먼저 지워요." },
] as const;
