"use client";

import Link, { useLinkStatus } from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useFormStatus } from "react-dom";

// 누르면 바로 반응하는 버튼 (고령 사용자: 눌렀는지 모르고 여러 번 누르지 않게)
// 1) 누르는 순간 살짝 작아지고 색이 짙어짐(.press) 2) 안드로이드는 짧은 진동 3) 서버 일을 기다리는 동안 "잠시만요" + 도는 표시

export type Variant = "primary" | "secondary" | "danger";

export const variantClasses: Record<Variant, string> = {
  primary: "bg-accent text-foreground active:bg-accent-dark",
  secondary: "bg-(--bg-secondary) text-foreground active:bg-(--line)",
  danger: "bg-(--danger-soft) text-(--text-danger) active:bg-[#ffd4d4]",
};

// 비활성 = 같은 색 40% (Figma 공통/버튼 비활성)
export const buttonBase =
  "press flex w-full items-center justify-center gap-2 rounded-[15px] h-14 text-lg font-bold disabled:opacity-40 disabled:pointer-events-none";

export function buzz() {
  try {
    navigator.vibrate?.(12);
  } catch {}
}

export function Spinner() {
  return <span aria-hidden className="spin inline-block size-5 rounded-full border-[3px] border-current border-r-transparent" />;
}

export function Button({
  variant = "primary",
  className = "",
  disabledReason,
  pendingLabel = "잠시만요",
  children,
  onPointerDown,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  disabledReason?: string;
  pendingLabel?: string;
  children: ReactNode;
}) {
  // 폼 안의 제출 버튼이면 서버 일을 기다리는 동안 "잠시만요"를 보여 주고 다시 누르지 못하게 한다
  const { pending } = useFormStatus();
  const busy = pending && props.type === "submit";
  return (
    <div className="flex w-full flex-col gap-2">
      {props.disabled && disabledReason && <p className="text-center text-base text-(--text-danger)">{disabledReason}</p>}
      <button
        className={`${buttonBase} ${variantClasses[variant]} ${className}`}
        onPointerDown={(e) => {
          buzz();
          onPointerDown?.(e);
        }}
        aria-busy={busy || undefined}
        {...props}
        disabled={props.disabled || busy}
        style={busy ? { opacity: 1 } : undefined}
      >
        {busy ? (
          <>
            <Spinner />
            {pendingLabel}
          </>
        ) : (
          children
        )}
      </button>
    </div>
  );
}

// 링크로 다음 화면을 여는 동안(서버가 화면을 만드는 동안) 글자 대신 도는 표시를 보여 준다
function LinkPending({ children }: { children: ReactNode }) {
  const { pending } = useLinkStatus();
  return pending ? (
    <>
      <Spinner />
      잠시만요
    </>
  ) : (
    <>{children}</>
  );
}

export function PressLink({
  href,
  className = "",
  children,
  pendingText = true,
}: {
  href: string;
  className?: string;
  children: ReactNode;
  pendingText?: boolean;
}) {
  return (
    <Link href={href} className={`press ${className}`} onPointerDown={buzz}>
      {pendingText ? <LinkPending>{children}</LinkPending> : children}
    </Link>
  );
}

export function LinkButton({
  href,
  variant = "primary",
  className = "",
  children,
}: {
  href: string;
  variant?: Variant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <PressLink href={href} className={`${buttonBase} ${variantClasses[variant]} ${className}`}>
      {children}
    </PressLink>
  );
}
