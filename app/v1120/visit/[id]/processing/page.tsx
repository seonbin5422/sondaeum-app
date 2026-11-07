"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Icon, Screen } from "../../../_components/ui";
import { Spinner } from "../../../_components/Pressable";
import { fillManually, summarizeVisit } from "../../../_actions";

// C-13 AI 처리중 (Figma 512:511, 실패 512:528). 서버(summarizeVisit)가 녹음 내용을 급여제공기록지 모양으로 정리해 저장하면 C-14로 넘어간다.
// 뱅글뱅글 도는 원 + 가운데 % (11/7). 실제 진행률을 몰라 시간에 따라 차오르다 95%에서 기다린다
// shortcut: 가짜 진행률, 서버가 단계(받아쓰기·정리)를 알려 주게 되면 그 값으로 바꾼다
function Ring() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const t = setInterval(() => setPct(Math.round(95 * (1 - Math.exp(-(Date.now() - start) / 4000)))), 200);
    return () => clearInterval(t);
  }, []);
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <span className="relative flex size-[120px] items-center justify-center" role="progressbar" aria-label="정리 중" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <svg viewBox="0 0 120 120" className="absolute inset-0 size-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" strokeWidth="10" className="stroke-(--bg-brand)" />
        <circle cx="60" cy="60" r={r} fill="none" strokeWidth="10" strokeLinecap="round" className="stroke-(--brand-secondary) transition-[stroke-dashoffset] duration-200" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} />
      </svg>
      {/* 차오르는 원 위로 짧은 호가 계속 돈다: 숫자가 95%에서 멈춰도 일하는 중임을 보여 준다 */}
      <svg viewBox="0 0 120 120" className="spin absolute inset-0 size-full motion-reduce:hidden">
        <circle cx="60" cy="60" r={r} fill="none" strokeWidth="10" strokeLinecap="round" className="stroke-white/70" strokeDasharray={`${c * 0.08} ${c}`} />
      </svg>
      <span className="text-[28px] font-bold tabular-nums tracking-[-0.02em]">{pct}%</span>
    </span>
  );
}

export default function ProcessingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [manual, setManual] = useState(false); // "직접 채우기"를 누르고 빈 기록을 만드는 중
  const [manualError, setManualError] = useState("");

  useEffect(() => {
    summarizeVisit(id).then(
      () => router.replace(`/v1120/visit/${id}/review`),
      () => setFailed(true),
    );
  }, [id, router, attempt]);

  async function fillByHand() {
    setManual(true);
    setManualError("");
    try {
      await fillManually(id);
      router.replace(`/v1120/visit/${id}/review`);
    } catch (e) {
      setManualError(e instanceof Error ? e.message : "열지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요.");
      setManual(false);
    }
  }

  return (
    <Screen
      white
      bottom={
        failed && (
          <div className="flex flex-col gap-2">
            {manualError && (
              <p className="text-center text-base font-bold text-(--text-danger)" role="alert">
                {manualError}
              </p>
            )}
            <Button
              disabled={manual}
              onClick={() => {
                setFailed(false);
                setAttempt((n) => n + 1);
              }}
            >
              다시 정리하기
            </Button>
            <Button variant="secondary" onClick={fillByHand} disabled={manual}>
              {manual ? <><Spinner />기록지를 여는 중이에요</> : "직접 채우기"}
            </Button>
          </div>
        )
      }
    >
      {/* 공통/상단 바에서 뒤로를 뺀 모양: 정리 중에는 돌아갈 곳이 없어 제목을 왼쪽에 둔다 (Figma 558:1409) */}
      <div className="full-bleed -mt-5 flex h-16 items-center bg-(--screen-bg)">
        {/* 제목은 게시판·내 정보 탭처럼 가운데 내용 칸 왼쪽 20에 (padding %는 바깥 칸 기준이라 PC에서 어긋났음) */}
        <h1 className="mx-auto w-full max-w-md px-5 text-[22px] font-bold leading-[1.4] tracking-[-0.02em]">기록 정리</h1>
      </div>

      <section
        key={failed ? "failed" : "working"}
        // Figma: 상단 바 아래 정리 중은 240px, 실패는 216px 띄운다 (Screen gap 16 포함)
        className={`enter flex flex-col items-center gap-4 pb-8 text-center leading-[1.4] ${failed ? "mt-[200px]" : "mt-[224px] px-5"}`}
        aria-live="polite"
      >
        {failed ? (
          <>
            <span className="pop flex size-[120px] items-center justify-center rounded-full bg-(--bg-secondary) text-muted">
              <Icon name="error" size={56} />
            </span>
            <p className="text-[22px] font-bold tracking-[-0.02em]">정리하지 못했어요</p>
            <p className="text-lg text-muted">
              녹음 내용은 저장돼 있어요. 다시 눌러 주세요.
            </p>
          </>
        ) : (
          <>
            <p className="text-[22px] font-bold tracking-[-0.02em]">
              AI가 기록지에 맞춰 <span className="whitespace-nowrap">정리하고 있어요</span>
            </p>
            <p className="text-lg text-muted">
              10초 정도 걸려요.
              <br />
              화면을 닫아도 녹음 내용은 저장돼 있어요.
            </p>
            {/* Figma는 글 아래 막대지만, 사용자 결정(11/7)으로 같은 자리에 도는 원 + % */}
            <Ring />
          </>
        )}
      </section>
    </Screen>
  );
}
