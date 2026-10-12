import Link from "next/link";
import { requireCaregiver } from "../../_data";
import { CONSENT_ITEMS } from "../../_consent";
import { Screen, TopBar } from "../../_components/ui";

// 내 정보 > 동의한 내용 보기. 처음 설정(C-21)에서 모두 동의해야 쓸 수 있다. 날짜는 LAW-3 동의 기록(Caregiver.consentedAt)
export default async function MyConsentPage() {
  const me = await requireCaregiver();
  const agreed = new Set((me.consentItems ?? "").split(","));
  const when = me.consentedAt
    ? new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", dateStyle: "long" }).format(me.consentedAt)
    : null;
  return (
    <Screen>
      <TopBar backHref="/v1120/me" title="동의한 내용" />
      <p className="text-lg text-muted">{when ? `${when}에 아래 항목에 동의했어요.` : "처음 시작할 때 아래 항목에 동의했어요. (동의 날짜는 10월 13일부터 기록해요)"}</p>
      <ul className="flex flex-col gap-3">
        {CONSENT_ITEMS.map((i) => (
          <li key={i.key} className="flex flex-col gap-1 rounded-[15px] border border-(--line) p-4">
            <p className="flex items-center justify-between gap-3 text-lg font-bold">
              {i.title}
              {(!me.consentedAt || agreed.has(i.key)) && (
                <span className="shrink-0 rounded-full bg-(--success-soft) px-3 py-0.5 text-base text-(--success)">✓ 동의함</span>
              )}
            </p>
            <p className="text-base text-muted">{i.body}</p>
          </li>
        ))}
      </ul>
      <Link href="/v1120/privacy" className="text-lg font-bold underline underline-offset-4">
        개인정보 처리방침 전체 보기
      </Link>
    </Screen>
  );
}
