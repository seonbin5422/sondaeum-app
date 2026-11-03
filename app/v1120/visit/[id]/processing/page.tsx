"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Icon, Screen } from "../../../_components/ui";
import { Spinner } from "../../../_components/Pressable";
import { fillManually, summarizeVisit } from "../../../_actions";

// C-13 AI 처리중 (Figma 512:511, 실패 512:528). 서버(summarizeVisit)가 녹음 내용을 급여제공기록지 모양으로 정리해 저장하면 C-14로 넘어간다.
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
          <>
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
          </>
        )
      }
    >
      {/* 공통/상단 바에서 뒤로를 뺀 모양: 정리 중에는 돌아갈 곳이 없다 */}
      <div className="full-bleed -mt-5 flex h-16 items-center justify-center bg-white px-16">
        <h1 className="text-center text-[22px] font-bold leading-[1.4] tracking-[-0.02em]">기록 정리</h1>
      </div>

      <section
        key={failed ? "failed" : "working"}
        className={`enter mt-24 flex flex-col items-center gap-4 py-8 text-center leading-[1.4] ${failed ? "-mx-5 px-5" : "px-5"}`}
        aria-live="polite"
      >
        {failed ? (
          <>
            <span className="pop flex size-[120px] items-center justify-center rounded-full bg-(--danger-soft) text-(--danger)">
              <Icon name="error" size={56} />
            </span>
            <p className="text-[22px] font-bold tracking-[-0.02em]">정리하지 못했어요</p>
            <p className="text-lg text-muted">
              녹음 내용은 저장돼 있어요. 다시 눌러 주세요.
            </p>
          </>
        ) : (
          <>
            <span className="flex size-[120px] items-center justify-center rounded-full bg-(--bg-brand) text-(--brand-secondary)">
              <Icon name="auto_awesome" size={56} className="animate-pulse" />
            </span>
            <p className="text-[22px] font-bold tracking-[-0.02em]">
              AI가 기록지에 맞춰 <span className="whitespace-nowrap">정리하고 있어요</span>
            </p>
            <p className="text-lg text-muted">
              10초 정도 걸려요. 화면을 닫아도 녹음 내용은 저장돼 있어요.
            </p>
            {/* 진행 막대: 실제 진행률을 몰라 10초 동안 90%까지 차오르게만 한다 */}
            <div className="h-3 w-full overflow-hidden rounded-full" role="progressbar" aria-label="정리 중">
              <div className="h-full rounded-full bg-accent [animation:v1120-fill_10s_cubic-bezier(0.2,0,0,1)_forwards] motion-reduce:w-1/2 motion-reduce:[animation:none]" />
            </div>
            <style>{`@keyframes v1120-fill { from { width: 8%; } to { width: 90%; } }`}</style>
          </>
        )}
      </section>
    </Screen>
  );
}
