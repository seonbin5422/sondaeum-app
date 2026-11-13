"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CoachCard, markSeen, setTour } from "../_components/Coach";
import { TOUR } from "../_coachSteps";

// 사용법 둘러보기: 체험 계정 화면 캡처(예시 화면) 위에 코치마크처럼 한 곳씩 짚는다. 캡처는 화면 비율 그대로 꽉 차게 키운다
export function Tour() {
  const router = useRouter();
  const [i, setI] = useState(0);
  const [view, setView] = useState<{ w: number; h: number } | null>(null);
  useEffect(() => {
    setTour("done");
    markSeen("home"); // 홈 코치마크와 같은 내용이라 다시 띄우지 않는다
    const fit = () => setView({ w: innerWidth, h: innerHeight });
    fit();
    addEventListener("resize", fit);
    return () => removeEventListener("resize", fit);
  }, []);
  if (!view) return null;

  const done = () => router.push("/v1120");
  const st = TOUR[i];
  const last = i === TOUR.length - 1;
  const k = Math.min(view.w / 390, view.h / 844);
  const left = (view.w - 390 * k) / 2;
  const top = (view.h - 844 * k) / 2;
  const [x, y, w, h] = st.ring;
  const below = y + h / 2 < 422; // 짚은 곳이 위쪽이면 설명은 아래에

  return (
    <div className="fixed inset-0 z-40 overflow-hidden bg-foreground" role="dialog" aria-modal="true" aria-labelledby="coach-title" onKeyDown={(e) => e.key === "Escape" && done()}>
      {/* eslint-disable-next-line @next/next/no-img-element -- 정해진 크기의 캡처를 좌표에 맞춰 그대로 그린다 */}
      <img src={`/v1120/tour/${st.img}.webp`} alt="" className="absolute" style={{ left, top, width: 390 * k, height: 844 * k }} />
      {/* 다음 캡처를 미리 받아 넘길 때 깜빡이지 않게 */}
      {!last && <link rel="preload" as="image" href={`/v1120/tour/${TOUR[i + 1].img}.webp`} />}
      <div
        aria-hidden
        className="pointer-events-none absolute rounded-2xl ring-4 ring-accent transition-[top,left,width,height] duration-200 motion-reduce:transition-none"
        style={{ left: left + x * k, top: top + y * k, width: w * k, height: h * k, boxShadow: "0 0 0 9999px rgb(0 0 0 / 0.65)" }}
      />
      <div className={`absolute inset-x-0 mx-auto flex max-w-md flex-col px-4 ${below ? "bottom-0 pb-[calc(16px+env(safe-area-inset-bottom))]" : "top-0 pt-[calc(16px+env(safe-area-inset-top))]"}`}>
        <CoachCard
          key={i}
          chip={`둘러보기 ${i + 1} / ${TOUR.length} · 예시 화면`}
          title={st.title}
          body={st.body}
          secondary={i === 0 ? { label: "건너뛰기", onClick: done } : { label: "이전", onClick: () => setI(i - 1) }}
          primary={last ? { label: "시작하기", onClick: done } : { label: "다음", onClick: () => setI(i + 1) }}
          onClose={i === 0 || last ? undefined : done}
        />
      </div>
    </div>
  );
}
