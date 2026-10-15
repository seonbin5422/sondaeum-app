import Link from "next/link";
import { notFound } from "next/navigation";
import { chatTokenToClient, findClient } from "../../../_mock";
import { Avatar, Screen } from "../../../_components/ui";

// G-05 보호자 내 정보 (D-44). 보호자 로그인 전이라 요양보호사가 등록한 보호자 정보를 보여 준다
export default async function GuardianMePage({ params }: PageProps<"/v1120/c/[token]/me">) {
  const { token } = await params;
  const c = findClient(chatTokenToClient[token] ?? "");
  if (!c) notFound();
  return (
    <Screen nav guardianToken={token}>
      <h1 className="text-2xl font-bold">내 정보</h1>
      <div className="flex items-center gap-4 rounded-[15px] bg-white p-5 shadow-[var(--shadow-card)]">
        <Avatar name={c.guardianName} />
        <div>
          <p className="text-xl font-bold">{c.guardianName} 보호자님</p>
          <p className="text-base text-muted">{c.name} 어르신의 {c.guardianRelation}</p>
          <p className="text-base text-muted">{c.guardianPhone ?? "전화번호 없음"}</p>
        </div>
      </div>
      <p className="text-base text-muted">정보가 다르면 대화에서 요양보호사에게 알려 주세요.</p>
      <ul className="flex flex-col divide-y divide-(--line) rounded-[15px] border border-(--line)">
        <li>
          <Link href="/v1120/privacy" className="flex min-h-16 items-center justify-between px-4 text-lg font-bold">
            개인정보 처리방침
            <span className="text-muted" aria-hidden>
              ›
            </span>
          </Link>
        </li>
      </ul>
    </Screen>
  );
}
