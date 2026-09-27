import Link from "next/link";
import type { ReactNode } from "react";

const backButtonClass = "absolute left-0 flex h-[38px] w-[38px] items-center justify-center";

function BackIcon() {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- local icon, optimization not applicable
    <img src="/brand/back-arrow.png" alt="" className="h-[22px] w-[22px]" />
  );
}

export function PageHeader({
  title,
  backHref,
  onBack,
  right,
}: {
  title: ReactNode;
  backHref?: string;
  onBack?: () => void;
  right?: ReactNode;
}) {
  return (
    <div className="relative flex h-14 items-center justify-center">
      {backHref ? (
        <Link href={backHref} aria-label="뒤로 가기" className={backButtonClass}>
          <BackIcon />
        </Link>
      ) : onBack ? (
        <button type="button" onClick={onBack} aria-label="뒤로 가기" className={backButtonClass}>
          <BackIcon />
        </button>
      ) : null}
      <h1 className="text-xl font-semibold">{title}</h1>
      {right && <div className="absolute right-0">{right}</div>}
    </div>
  );
}
