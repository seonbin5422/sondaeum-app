import type { CSSProperties, InputHTMLAttributes, ReactNode } from "react";
import type { VisitStatus } from "../_types";
import { BottomNav } from "./BottomNav";
import { Icon } from "./Icon";
import { PressLink } from "./Pressable";

// 1120.ver 공용 컴포넌트. 기준: 본문 18px, 가장 작은 글자 16px, 터치 48px 이상, 아이콘만 있는 버튼 없음, 비활성 버튼에는 이유 한 줄.

export { Button, LinkButton } from "./Pressable";
export { Icon } from "./Icon";

// 작은 보조 링크(뒤로·바로가기). 테두리 없이 연한 회색 면 (1128)
export function SmallLinkButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <PressLink
      href={href}
      pendingText={false}
      className="inline-flex min-h-12 items-center gap-1 rounded-xl bg-(--bg-secondary) px-4 text-base font-bold active:bg-(--line)"
    >
      {children}
    </PressLink>
  );
}

// nav: 하단 메뉴바(홈·수급자·게시판·내 정보)를 붙인다. 기록 흐름·보호자 화면에는 붙이지 않는다.
export function Screen({
  children,
  bottom,
  nav = false,
  tab = false,
  guardianToken,
  white = false,
  plainBottom = false,
}: {
  children: ReactNode;
  bottom?: ReactNode;
  nav?: boolean;
  tab?: boolean; // 하단 메뉴 탭 화면(홈·수급자·게시판·내 정보): 메뉴를 오갈 때 바로 보이게 등장 모션을 끈다. 세부 화면은 모션 유지
  guardianToken?: string;
  white?: boolean; // Figma에서 바탕이 흰 화면(예: C-13 기록 정리)
  plainBottom?: boolean; // 아래 칸을 흰 면 대신 화면 바탕색으로 (녹음 화면, 사용자 11/7)
}) {
  const bg = white ? "white" : "var(--bg-secondary)";
  const pad = bottom && nav ? "pb-56" : bottom ? "pb-40" : nav ? "pb-28" : "";
  return (
    <div className={`flex flex-1 flex-col overflow-x-clip ${white ? "v1120-white" : ""}`} style={{ background: bg, "--screen-bg": bg } as CSSProperties}>
    <main className={`mx-auto flex w-full max-w-md flex-1 flex-col gap-4 p-5 ${pad} ${tab ? "still" : ""}`}>
      {children}
      {(bottom || nav) && (
        <div className="fixed inset-x-0 bottom-0 z-10">
          {bottom && (
            // 1128 수정안 (11/7): 아래 버튼 칸은 흰 면, 위 16 · 옆 20 · 아래 24, 버튼 사이 8
            <div className={plainBottom ? "bg-(--screen-bg)" : "bg-white"}>
              <div className="mx-auto flex w-full max-w-md flex-col gap-2 px-5 pb-6 pt-4">{bottom}</div>
            </div>
          )}
          {nav && <BottomNav guardianToken={guardianToken} />}
        </div>
      )}
    </main>
    </div>
  );
}

// 공통/상단 바 (Figma 508:100): 64px, 바탕은 화면 바탕색과 같게(사용자 11/7), 뒤로 48px 왼쪽 8, 제목 22px은 뒤로 바로 옆(64) 왼쪽 정렬, 본문까지 20.
// 뒤로·제목을 같은 max-w-md 칸 안에 둬서 넓은 화면에서도 둘이 어긋나지 않게 한다. 화면 맨 위에 붙도록 Screen 여백을 되돌린다
// 상단 바 뒤로 버튼 자리. BackButton icon도 같은 자리를 쓴다
export const TOP_BACK =
  "absolute left-2 top-1/2 flex size-12 -translate-y-1/2 items-center justify-center rounded-full active:bg-(--line)";

// back: 링크 대신 다른 뒤로 버튼(예: 들어온 화면으로 돌아가는 BackButton)을 넣을 때
export function TopBar({ backHref, title, back }: { backHref?: string; title?: string; back?: ReactNode }) {
  return (
    <div className="sticky top-0 z-10 full-bleed -mt-5 mb-1 bg-(--screen-bg) print:hidden">
      <div className="relative mx-auto flex h-16 max-w-md items-center pl-16 pr-5">
      {back ?? (
        <PressLink href={backHref ?? "/v1120"} pendingText={false} className={TOP_BACK}>
          <Icon name="arrow_back" size={28} />
          <span className="sr-only">뒤로</span>
        </PressLink>
      )}
      {title && <h1 className="text-[22px] font-bold leading-[1.4] tracking-[-0.02em]">{title}</h1>}
      </div>
    </div>
  );
}

// 공통/귤색 머리 (Figma 508:148): 하단 메뉴 탭 화면(수급자·게시판·내 정보) 맨 위
export function OrangeHeader({ title, sub, children }: { title: string; sub?: ReactNode; children?: ReactNode }) {
  return (
    <header className="enter-down -mx-5 -mt-5 flex flex-col gap-1 rounded-b-3xl bg-accent px-6 pb-7 pt-8 text-foreground">
      <h1 className="text-[28px] font-bold leading-[1.4] tracking-[-0.02em]">{title}</h1>
      {sub && <p className="text-lg">{sub}</p>}
      {children}
    </header>
  );
}

// 공통/목록 행 (Figma 508:119): 회색 원 아이콘 · 제목 18 · 설명 16 · 오른쪽 화살표
export function ListRow({
  href,
  icon,
  title,
  desc,
  chevron = true,
}: {
  href?: string;
  icon?: ReactNode;
  title: ReactNode;
  desc?: ReactNode;
  chevron?: boolean;
}) {
  const inner = (
    <>
      {icon && (
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-(--bg-secondary)">{icon}</span>
      )}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5 leading-[1.4]">
        <span className="text-lg font-bold">{title}</span>
        {desc && <span className="text-base text-muted">{desc}</span>}
      </span>
      {chevron && href && <Icon name="chevron_right" className="text-muted" />}
    </>
  );
  const cls = "flex min-h-16 items-center gap-3 px-4 py-3.5";
  return href ? (
    <PressLink href={href} pendingText={false} className={`${cls} active:bg-(--bg-secondary)`}>
      {inner}
    </PressLink>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

// 공통/단계 (Figma 508:151): "1 / 2"
// 빈 목록 안내: 회색 느낌표 + 문구 (수급자·게시판이 비었을 때)
export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="enter flex flex-col items-center gap-3 py-10 text-center text-lg leading-[1.4] text-muted">
      <Icon name="error" size={48} />
      <p>{children}</p>
    </div>
  );
}

export function StepBadge({ children }: { children: ReactNode }) {
  return <span className="w-fit rounded-full bg-(--bg-secondary) px-3 py-1 text-base font-bold text-muted">{children}</span>;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`flex flex-col gap-4 enter rounded-2xl bg-white p-5 ${className}`}>
      {children}
    </section>
  );
}

export function Callout({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl bg-(--bg-brand) px-4 py-3 text-base text-(--text-brand)">
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
  SENT: { label: "보냄 완료", className: "bg-(--success-soft) text-(--text-success)" },
};

export function StatusBadge({ status }: { status: VisitStatus }) {
  const s = statusStyles[status];
  return <span className={`rounded-full px-3 py-0.5 text-base font-bold ${s.className}`}>{s.label}</span>;
}

export function Chip({ children, tone = "schedule" }: { children: ReactNode; tone?: "schedule" | "done" | "outline" }) {
  const tones = {
    schedule: "bg-chip-schedule text-foreground",
    done: "bg-(--success-soft) text-(--text-success)",
    outline: "bg-(--bg-secondary) text-foreground",
  };
  return <span className={`inline-flex rounded-full px-3 py-1 text-base font-medium ${tones[tone]}`}>{children}</span>;
}

export function Avatar({ name }: { name: string }) {
  return (
    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-(--bg-secondary) text-2xl font-bold text-muted">
      {name.slice(0, 1)}
    </span>
  );
}

export function Field({
  label,
  hint,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-lg font-bold">{label}</span>
      <input
        className="h-14 rounded-[15px] bg-(--bg-secondary) px-4 text-lg transition-shadow placeholder:text-muted focus:bg-white focus:outline-none focus:ring-[3px] focus:ring-accent/50"
        {...props}
      />
      {hint && <span className="text-base text-muted">{hint}</span>}
    </label>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-lg font-bold">{children}</h2>;
}

// 공통/선택 칩 (Figma 508:132): 고른 것=브랜드 귤색 면+본문색 굵은 글자, 안 고른 것=연한 회색 면. 테두리 없음
// 사용자 11/3: 연한 귤색은 고령자에게 안 고른 것과 차이가 작아 보여서 브랜드 메인색(#ffb133)으로 바꿈
export function selectChipClass(selected: boolean) {
  return `press inline-flex h-12 items-center justify-center rounded-full px-[18px] text-lg ${
    selected ? "bg-accent font-bold text-foreground" : "bg-(--bg-secondary) text-foreground"
  }`;
}
