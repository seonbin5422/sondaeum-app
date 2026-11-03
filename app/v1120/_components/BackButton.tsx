"use client";

import { useRouter } from "next/navigation";
import { Icon } from "./Icon";

// 들어온 화면으로 돌아간다. 링크로 바로 들어와 돌아갈 곳이 없으면 fallback으로 간다.
// icon: 상단 바(TopBar back) 안의 ← 아이콘 모양 (className에 TOP_BACK을 넘긴다)
export function BackButton({ fallback, label = "← 뒤로", icon, className }: { fallback: string; label?: string; icon?: boolean; className?: string }) {
  const router = useRouter();
  const go = () => (window.history.length > 1 ? router.back() : router.push(fallback));
  if (icon)
    return (
      <button type="button" onClick={go} className={className}>
        <Icon name="arrow_back" size={28} />
        <span className="sr-only">뒤로</span>
      </button>
    );
  return (
    <button
      type="button"
      onClick={go}
      className="press inline-flex min-h-12 w-fit items-center rounded-xl bg-(--bg-secondary) px-4 text-base font-bold active:bg-(--line) print:hidden"
    >
      {label}
    </button>
  );
}
