"use client";

import { useRouter } from "next/navigation";

// 들어온 화면으로 돌아간다. 링크로 바로 들어와 돌아갈 곳이 없으면 fallback으로 간다.
export function BackButton({ fallback, label = "← 뒤로" }: { fallback: string; label?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => (window.history.length > 1 ? router.back() : router.push(fallback))}
      className="inline-flex min-h-12 w-fit items-center rounded-xl border border-border bg-white px-4 text-base font-bold active:bg-accent-soft print:hidden"
    >
      {label}
    </button>
  );
}
