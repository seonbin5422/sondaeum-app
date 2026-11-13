"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CoachCard, markSeen, setTour } from "../_components/Coach";
import { TOUR } from "../_coachSteps";

// 사용법 둘러보기: 체험 계정 화면 캡처(예시 화면) 위에 코치마크처럼 한 곳씩 짚는다.
// 캡처는 화면 폭에 맞추고(전에는 비율대로 줄여 옆에 검은 띠가 생겨 바탕이 갑자기 바뀐 것처럼 보임, 사용자 11/14),
// 화면보다 길면 짚은 곳이 가운데 오게 위아래로 옮긴다. 남는 곳은 캡처와 같은 바탕색
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
  const k = Math.min(view.w, 448) / 390; // 넓은 화면에서는 앱과 같은 폭(max-w-md)까지만
  const left = (view.w - 390 * k) / 2;
  const [x, y, w, h] = st.ring;
  const H = 844 * k;
  const below = y + h / 2 < 422; // 짚은 곳이 캡처 위쪽이면 설명은 아래에
  // 설명 카드(약 280px)가 덮지 않는 칸의 가운데에 짚은 곳이 오게 옮긴다
  const CARD = 280;
  const mid = below ? (view.h - CARD) / 2 : CARD + (view.h - CARD) / 2;
  const top = H <= view.h ? 0 : Math.min(0, Math.max(view.h - H, mid - (y + h / 2) * k));

  return (
    <div className={`fixed inset-0 z-40 overflow-hidden ${st.white ? "bg-white" : "bg-(--bg-secondary)"}`} role="dialog" aria-modal="true" aria-labelledby="coach-title" onKeyDown={(e) => e.key === "Escape" && done()}>
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
