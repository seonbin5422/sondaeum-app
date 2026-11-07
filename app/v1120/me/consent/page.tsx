import type { CSSProperties } from "react";
import { requireCaregiver } from "../../_data";
import { CONSENT_ITEMS } from "../../_consent";
import { PressLink } from "../../_components/Pressable";
import { Icon, Screen, TopBar } from "../../_components/ui";
import { ConsentDetails } from "../../_components/ConsentDetails";

// 내 정보 > 동의한 내용 보기 (Figma 1120 수정본 558:2310). 처음 설정(C-21)에서 모두 동의해야 쓸 수 있다. 날짜는 LAW-3 동의 기록(Caregiver.consentedAt)
export default async function MyConsentPage() {
  const me = await requireCaregiver();
  const agreed = new Set((me.consentItems ?? "").split(","));
  const when = me.consentedAt
    ? new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", dateStyle: "long" }).format(me.consentedAt)
    : null;
  return (
    <Screen white>
      <TopBar backHref="/v1120/me" title="동의한 내용" />
      {/* 안내·항목·링크 사이 12px (수정본) */}
      <div className="flex flex-col gap-3">
      <p className="text-lg leading-[1.4] text-muted">
        처음 시작할 때 아래 항목에 동의했어요.{" "}
        <span className="whitespace-nowrap">{when ? `(${when})` : "(동의 날짜는 10월 13일부터 기록해요)"}</span>
      </p>
      <ul className="enter flex flex-col gap-5 rounded-2xl bg-white p-5" style={{ "--i": 1 } as CSSProperties}>
        {CONSENT_ITEMS.map((i) => (
          <li key={i.key} className="flex flex-col gap-1">
            <p className="flex items-center gap-2 text-lg font-bold leading-[1.4]">
              <span className="flex-1">{i.title}</span>
              {(!me.consentedAt || agreed.has(i.key)) && (
                <span className="flex shrink-0 items-center gap-0.5 whitespace-nowrap rounded-full font-bold bg-(--success-soft) px-3 py-0.5 text-base text-(--text-success)">
                  <Icon name="check" size={18} />
                  동의함
                </span>
              )}
            </p>
            <ConsentDetails item={i} />
          </li>
        ))}
      </ul>
      <PressLink
        href="/v1120/privacy"
        pendingText={false}
        className="mx-auto flex min-h-12 items-center rounded-xl px-4 text-lg font-medium text-(--text-brand) active:bg-(--bg-brand)"
      >
        개인정보 처리방침 전체 보기 ›
      </PressLink>
      </div>
    </Screen>
  );
}
