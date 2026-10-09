import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { VisitStatus } from "../_types";

// 1120.ver 공용 컴포넌트. 기준: 본문 18px, 터치 48px 이상, 아이콘만 있는 버튼 없음, 비활성 버튼에는 이유 한 줄.

type Variant = "primary" | "secondary" | "danger";

const variantClasses: Record<Variant, string> = {
  primary: "bg-accent text-accent-foreground active:bg-accent-dark",
  secondary: "bg-white text-foreground border border-border active:bg-accent-soft",
  danger: "bg-(--danger) text-white active:opacity-90",
};

const base =
  "flex w-full items-center justify-center gap-2 rounded-[15px] h-16 text-lg font-bold transition-colors disabled:bg-(--neutral-soft) disabled:text-muted disabled:border-transparent disabled:pointer-events-none";

export function Button({
  variant = "primary",
  className = "",
  disabledReason,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; disabledReason?: string; children: ReactNode }) {
  return (
    <div className="flex w-full flex-col gap-2">
      {props.disabled && disabledReason && <p className="text-center text-base text-muted">{disabledReason}</p>}
      <button className={`${base} ${variantClasses[variant]} ${className}`} {...props}>
        {children}
      </button>
    </div>
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
    <Link href={href} className={`${base} ${variantClasses[variant]} ${className}`}>
      {children}
    </Link>
  );
}

export function SmallLinkButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-12 items-center rounded-xl border border-border bg-white px-4 text-base font-bold active:bg-accent-soft"
    >
      {children}
    </Link>
  );
}

export function Screen({ children, bottom }: { children: ReactNode; bottom?: ReactNode }) {
  return (
    <main className={`mx-auto flex w-full max-w-md flex-1 flex-col gap-6 p-6 ${bottom ? "pb-40" : ""}`}>
      {children}
      {bottom && (
        <div className="fixed inset-x-0 bottom-0 bg-gradient-to-t from-white via-white to-white/0 pt-6">
          <div className="mx-auto flex w-full max-w-md flex-col gap-3 p-6 pt-0">{bottom}</div>
        </div>
      )}
    </main>
  );
}

export function TopBar({ backHref, title }: { backHref: string; title?: string }) {
  return (
    <div className="flex items-center gap-3">
      <SmallLinkButton href={backHref}>← 뒤로</SmallLinkButton>
      {title && <h1 className="text-xl font-bold">{title}</h1>}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`flex flex-col gap-4 rounded-[15px] bg-white p-5 shadow-[var(--shadow-card)] ${className}`}>
      {children}
    </section>
  );
}

export function Callout({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl bg-accent-soft px-4 py-3 text-base text-accent-soft-foreground">
      {title && <p className="font-bold">{title}</p>}
      <div>{children}</div>
    </div>
  );
}

const statusStyles: Record<VisitStatus, { label: string; className: string }> = {
  NOT_STARTED: { label: "시작 전", className: "bg-(--neutral-soft) text-muted" },
  RECORDING: { label: "기록 중", className: "bg-accent-soft text-accent-soft-foreground" },
  RECORDED: { label: "녹음 완료", className: "bg-accent-soft text-accent-soft-foreground" },
  SUMMARIZING: { label: "AI 정리 중", className: "bg-accent-soft text-accent-soft-foreground" },
  DRAFT_READY: { label: "확인 필요", className: "bg-accent-soft text-accent-soft-foreground" },
  SENT: { label: "보냄 완료", className: "bg-(--success-soft) text-(--success)" },
};

export function StatusBadge({ status }: { status: VisitStatus }) {
  const s = statusStyles[status];
  return <span className={`rounded-full px-3 py-0.5 text-base font-bold ${s.className}`}>{s.label}</span>;
}

export function Chip({ children, tone = "schedule" }: { children: ReactNode; tone?: "schedule" | "done" | "outline" }) {
  const tones = {
    schedule: "bg-chip-schedule text-foreground",
    done: "bg-(--success-soft) text-(--success)",
    outline: "border border-border bg-white text-foreground",
  };
  return <span className={`inline-flex rounded-full px-3 py-1 text-base font-medium ${tones[tone]}`}>{children}</span>;
}

export function Avatar({ name }: { name: string }) {
  return (
    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent-soft text-2xl font-bold text-accent-soft-foreground">
      {name.slice(0, 1)}
    </span>
  );
}
