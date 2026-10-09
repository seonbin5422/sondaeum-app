import Link from "next/link";
import { caregiverLicense, caregiverName } from "../_mock";
import { Avatar, Screen } from "../_components/ui";

// 내 정보 탭 (C-06 요양보호사 프로필 + 설정)
export default function MePage() {
  const links: [string, string][] = [
    ["내 정보 고치기", "/v1120/onboarding"],
    ["동의한 내용 보기", "/v1120/onboarding/consent"],
    ["개인정보 처리방침", "/v1120/privacy"],
    ["로그아웃", "/v1120/login"],
  ];
  return (
    <Screen nav>
      <h1 className="text-2xl font-bold">내 정보</h1>
      <div className="flex items-center gap-4 rounded-[15px] bg-white p-5 shadow-[var(--shadow-card)]">
        <Avatar name={caregiverName} />
        <div>
          <p className="text-xl font-bold">{caregiverName} 요양보호사</p>
          <p className="text-base text-muted">자격번호 {caregiverLicense}</p>
        </div>
      </div>
      <ul className="flex flex-col divide-y divide-(--line) rounded-[15px] border border-(--line)">
        {links.map(([l, h]) => (
          <li key={l}>
            <Link href={h} className="flex min-h-16 items-center justify-between px-4 text-lg font-bold">
              {l}
              <span className="text-muted" aria-hidden>
                ›
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="text-center text-base text-muted">손다음 1120.ver 미리보기</p>
    </Screen>
  );
}
