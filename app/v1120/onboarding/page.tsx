"use client";

import { useState } from "react";
import { Button, LinkButton } from "../_components/ui";
import { PressLink } from "../_components/Pressable";

// C-24 온보딩 (Figma 575:2106·2123·2142). 로그인 뒤 처음 한 번, 세 장으로 쓰는 법을 소개하고 C-02 처음 설정으로 간다.
// 그림은 둘러보기(tour)에 쓰는 체험 계정 화면 캡처를 잘라 쓴다. bottom이면 캡처 아래쪽(녹음 버튼 쪽)을 보인다
const STEPS = [
  { title: "말로 하면 기록이 돼요", body: ["방문이 끝나면 오늘 한 일을 편하게 말씀해 주세요.", "사투리도 괜찮아요."], img: "mic", bottom: true },
  { title: "기록지 칸에 맞춰 정리해요", body: ["말하지 않은 칸은 비워 두니,", "확인하고 채워 주세요."], img: "sections", bottom: true },
  { title: "확인하고 보호자님께 보내요", body: ["보내기 전에 꼭 한 번 확인해요.", "보낸 뒤에는 고칠 수 없어요."], img: "send", bottom: false },
];
const NEXT = "/v1120/onboarding/profile";

export default function OnboardingIntroPage() {
  const [step, setStep] = useState(0);
  const s = STEPS[step];
  const last = step === STEPS.length - 1;
  return (
    <div className="v1120-white flex flex-1 flex-col bg-white">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col">
        <div className="flex items-center justify-between pt-2 pr-5 pl-2">
          {/* 첫 장은 뒤로 갈 곳이 없어 숨기되, 건너뛰기 자리가 같도록 칸은 남긴다 */}
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            className={`press flex size-12 items-center justify-center rounded-full active:bg-(--bg-secondary) ${step === 0 ? "invisible" : ""}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/v1120/onboarding/chevron-back.svg" alt="" width={24} height={24} />
            <span className="sr-only">이전</span>
          </button>
          <PressLink href={NEXT} pendingText={false} className="-mr-2 flex min-h-12 items-center px-2 text-base font-medium text-muted">
            건너뛰기
          </PressLink>
        </div>
        <div className="flex gap-1.5 px-5 pt-2" aria-label={`${STEPS.length}장 중 ${step + 1}장`} role="img">
          {STEPS.map((_, i) => (
            <span key={i} className={`h-1 flex-1 rounded-[2px] transition-colors ${i <= step ? "bg-accent" : "bg-(--line)"}`} />
          ))}
        </div>
        <section key={step} className="enter flex flex-col gap-3 px-5 pt-9 leading-[1.4]">
          <h1 className="text-[28px] font-bold tracking-[-0.02em]">{s.title}</h1>
          <p className="text-[17px] text-muted">
            {s.body[0]}
            <br />
            {s.body[1]}
          </p>
        </section>
        {/* 그림: Figma 그림 칸이 비어 있어 실제 화면 캡처를 귤색 바탕 위 폰 화면처럼 보인다 */}
        <div key={`img-${step}`} aria-hidden className="enter relative mx-5 mt-8 min-h-56 flex-1 overflow-hidden rounded-3xl bg-(--bg-brand)">
          {/* eslint-disable-next-line @next/next/no-img-element -- 정해진 캡처를 잘라 그대로 그린다 */}
          <img
            src={`/v1120/tour/${s.img}.webp`}
            alt=""
            className={`absolute left-1/2 w-[72%] max-w-72 -translate-x-1/2 rounded-2xl shadow-lg ${s.bottom ? "bottom-6" : "top-6"}`}
          />
          {/* 잘린 쪽 가장자리를 바탕색으로 흐린다 */}
          <span className={`absolute inset-x-0 h-12 from-(--bg-brand) ${s.bottom ? "top-0 bg-linear-to-b" : "bottom-0 bg-linear-to-t"}`} />
        </div>
        {!last && <link rel="preload" as="image" href={`/v1120/tour/${STEPS[step + 1].img}.webp`} />}
        <div className="flex gap-2 bg-white px-5 pt-4 pb-6">
          {step > 0 && (
            <Button variant="secondary" onClick={() => setStep(step - 1)}>
              이전
            </Button>
          )}
          {last ? (
            <LinkButton href={NEXT}>시작하기</LinkButton>
          ) : (
            <Button onClick={() => setStep(step + 1)}>다음</Button>
          )}
        </div>
      </main>
    </div>
  );
}
