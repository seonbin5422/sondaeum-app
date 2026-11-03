import { Icon } from "./Icon";
import { CONSENT_REFUSE, type CONSENT_ITEMS } from "../_consent";

// C-21 동의 항목 한 줄 요약 + "자세히 보기" (처음 설정·내 정보가 같이 쓴다)
export function ConsentDetails({ item }: { item: (typeof CONSENT_ITEMS)[number] }) {
  return (
    <>
      <p className="text-base leading-[1.4] text-muted">{item.body}</p>
      <details className="group text-base">
        <summary className="press flex min-h-12 w-fit cursor-pointer list-none items-center gap-1 font-bold text-(--text-brand) [&::-webkit-details-marker]:hidden">
          자세히 보기
          <Icon name="expand_more" className="transition-transform group-open:rotate-180" />
        </summary>
        <dl className="enter flex flex-col gap-2 rounded-xl bg-(--bg-secondary) p-4">
          {item.rows.map(([k, v]) => (
            <div key={k}>
              <dt className="font-bold">{k}</dt>
              <dd className="text-muted">{v}</dd>
            </div>
          ))}
          {"note" in item && <p className="text-muted">{item.note}</p>}
          <p className="text-muted">{CONSENT_REFUSE}</p>
        </dl>
      </details>
    </>
  );
}
