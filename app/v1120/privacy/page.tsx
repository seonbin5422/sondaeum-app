import { Screen, TopBar } from "../_components/ui";

// LAW-12 개인정보 처리방침 (기획 문구가 오기 전 자리만 잡은 화면)
const SECTIONS = [
  ["모으는 정보", "요양보호사: 이름, 자격번호, 카카오 계정 식별값. 수급자: 이름, 나이, 성별, 장기요양등급, 병력·복용약, 방문 기록, 보호자 이름·관계."],
  ["쓰는 곳", "방문 기록 정리, 보호자 보고서, 서류 만들기."],
  ["보호자에게 주는 정보", "보낸 방문 보고서와 대화방 메시지. 보호자 링크는 수급자마다 따로 있고 기한이 지나면 닫혀요."],
  ["국외 이전", "말한 내용을 AI로 정리하려고 Groq(미국)에 보내요. 이름·전화번호·주소는 보내기 전에 지워요."],
  ["보관 기간", "수급자를 완전히 지우면 기록도 지워요. 급여제공기록은 기관이 5년 보관해야 하니, 지우기 전에 기관 시스템에 옮겨 주세요."],
  ["문의", "개인정보 보호 담당자 (기획 확정 전)"],
];

export default function PrivacyPage() {
  return (
    <Screen>
      <TopBar backHref="/v1120/me" title="개인정보 처리방침" />
      <p className="text-base text-muted">기획 문구 확정 전 임시 내용이에요 (LAW-12).</p>
      {SECTIONS.map(([t, b]) => (
        <section key={t} className="flex flex-col gap-1">
          <h2 className="text-lg font-bold">{t}</h2>
          <p className="text-lg">{b}</p>
        </section>
      ))}
    </Screen>
  );
}
