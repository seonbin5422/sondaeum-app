"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Button, buzz } from "./Pressable";

// 코치마크: 화면을 처음 열 때 핵심 기능을 하나씩 짚어 준다 (사용자 11/14, 60대 사용자 기준).
// 짚을 곳은 data-coach="이름"으로 표시한다. 그 화면에 없는 곳(예: 마무리 못 한 기록이 없을 때)은 건너뛴다.
// 본 화면은 이 기기에만 기억한다 — 내 정보 "사용법 다시 보기"가 지운다
export type CoachStep = { target: string; title: string; body: string }; // target: data-coach 값, 없으면 id

const KEY = "sondaeum-coach:";
const seen = (id: string) => {
  try {
    return localStorage.getItem(KEY + id) === "1";
  } catch {
    return false;
  }
};
const markSeen = (id: string) => {
  try {
    localStorage.setItem(KEY + id, "1");
  } catch {}
};
export function resetCoach() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(KEY))
      .forEach((k) => localStorage.removeItem(k));
  } catch {}
}

const find = (target: string) => {
  const el = document.querySelector<HTMLElement>(`[data-coach="${target}"]`) ?? document.getElementById(target);
  return el && el.getClientRects().length ? el : null;
};

export function Coach({ id, steps }: { id: string; steps: CoachStep[] }) {
  const [list, setList] = useState<CoachStep[] | null>(null);
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const card = useRef<HTMLElement>(null);

  // 들어오는 움직임(.enter)이 끝난 뒤에 시작해야 짚는 자리가 맞는다
  useEffect(() => {
    if (seen(id)) return;
    const t = setTimeout(() => {
      const shown = steps.filter((s) => find(s.target));
      if (shown.length) setList(shown);
    }, 700);
    return () => clearTimeout(t);
  }, [id, steps]);

  const step = list?.[i];
  useEffect(() => {
    if (!step) return;
    const el = find(step.target);
    if (!el) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
    // 부드럽게 내려가는 중·화면 크기가 바뀔 때도 따라가게 매 프레임 잰다 (짧게만 떠 있어서 괜찮음)
    let raf = 0;
    const track = () => {
      const r = el.getBoundingClientRect();
      setRect((p) => (p && p.top === r.top && p.left === r.left && p.width === r.width && p.height === r.height ? p : r));
      raf = requestAnimationFrame(track);
    };
    track();
    // 화면 읽기 프로그램이 새 설명부터 읽게 카드로 옮긴다 (버튼에 두면 파란 테두리가 떠서 눌린 것처럼 보임)
    requestAnimationFrame(() => card.current?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(raf);
  }, [step]);

  if (!list || !step || !rect) return null;
  const last = i === list.length - 1;
  const close = () => {
    markSeen(id);
    setList(null);
  };
  // 짚은 곳이 위쪽이면 설명은 아래에, 아래쪽이면 위에
  const below = rect.top + rect.height / 2 < window.innerHeight / 2;
  const pad = 8;

  return createPortal(
    <div
      className="fixed inset-0 z-40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="coach-title"
      onKeyDown={(e) => e.key === "Escape" && close()}
    >
      {/* 짚은 곳만 밝게: 둘레 그림자로 나머지를 어둡게 덮는다. 누르는 건 막는다(설명을 먼저 읽게) */}
      <div
        aria-hidden
        className="pointer-events-none absolute rounded-2xl ring-4 ring-accent transition-[top,left,width,height] duration-200 motion-reduce:transition-none"
        style={{
          top: rect.top - pad,
          left: rect.left - pad,
          width: rect.width + pad * 2,
          height: rect.height + pad * 2,
          boxShadow: "0 0 0 9999px rgb(0 0 0 / 0.65)",
        }}
      />
      <div
        className={`absolute inset-x-0 mx-auto flex max-w-md flex-col gap-3 px-4 ${
          below ? "bottom-0 pb-[calc(16px+env(safe-area-inset-bottom))]" : "top-0 pt-[calc(16px+env(safe-area-inset-top))]"
        }`}
      >
        <section ref={card} tabIndex={-1} key={i} className="enter flex flex-col gap-3 rounded-2xl bg-white p-5 leading-[1.4] outline-none">
          <span className="w-fit rounded-full bg-(--bg-brand) px-3 py-1 text-base font-bold text-(--text-brand)">
            사용법 <span className="whitespace-nowrap">{i + 1} / {list.length}</span>
          </span>
          <h2 id="coach-title" className="text-[22px] font-bold tracking-[-0.02em]">
            {step.title}
          </h2>
          <p className="text-lg" aria-live="polite">
            {step.body}
          </p>
          <div className="flex gap-2 pt-1">
            {!last && (
              <div className="flex flex-1">
                <Button variant="secondary" onClick={close}>
                  그만 보기
                </Button>
              </div>
            )}
            <div className="flex flex-[2]">
              <Button onClick={() => (last ? close() : setI(i + 1))}>
                {last ? "알겠어요" : "다음"}
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>,
    document.querySelector(".v1120") ?? document.body,
  );
}

// 내 정보 "사용법 다시 보기": 본 기록을 지우고 홈으로 가서 처음부터 다시 보여 준다
export function CoachReplay({ home, children }: { home: string; children: ReactNode }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onPointerDown={buzz}
      onClick={() => {
        resetCoach();
        router.push(home);
      }}
      className="press flex min-h-16 w-full items-center gap-3 px-4 py-3.5 text-left active:bg-(--bg-secondary)"
    >
      {children}
    </button>
  );
}
