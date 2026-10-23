import { CONSENT_REFUSE, type CONSENT_ITEMS } from "../_consent";

// C-21 동의 항목 한 줄 요약 + "자세히 보기" (처음 설정·내 정보가 같이 쓴다)
export function ConsentDetails({ item }: { item: (typeof CONSENT_ITEMS)[number] }) {
  return (
    <>
      <p className="text-base text-muted">{item.body}</p>
      <details className="text-base">
        <summary className="flex min-h-12 cursor-pointer items-center font-bold underline underline-offset-4">자세히 보기</summary>
        <dl className="flex flex-col gap-2 pb-1">
          {item.rows.map(([k, v]) => (
            <div key={k}>
              <dt className="font-bold">{k}</dt>
              <dd className="text-muted">{v}</dd>
            </div>
          ))}
          <p className="text-muted">{CONSENT_REFUSE}</p>
        </dl>
      </details>
    </>
  );
}
