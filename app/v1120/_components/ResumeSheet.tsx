"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { PressLink, buzz } from "./Pressable";
import { Icon } from "./Icon";

export type ResumeItem = { href: string; name: string; date: string; step: string };

// 홈 "마무리 못 한 기록"의 "이어서 하기". 1건이면 바로 가고, 2건 이상이면 아래에서 시트를 올려 고르게 한다 (팀 피드백 11/6)
// 시트 모양은 ScheduleSheet(일정 달력)와 같다
export function ResumeSheet({ items, className }: { items: ResumeItem[]; className: string }) {
  const [open, setOpen] = useState(false);
  if (items.length === 1)
    return (
      <PressLink href={items[0].href} className={className}>
        이어서 하기
      </PressLink>
    );
  return (
    <>
      <button type="button" onPointerDown={buzz} onClick={() => setOpen(true)} className={`press ${className}`}>
        이어서 하기
      </button>
      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-20 flex items-end bg-black/45"
            role="dialog"
            aria-modal="true"
            aria-label="이어서 쓸 기록 고르기"
            onClick={(e) => e.target === e.currentTarget && setOpen(false)}
          >
            <div className="enter mx-auto flex max-h-[92vh] w-full max-w-md flex-col items-center gap-4 overflow-y-auto rounded-t-3xl bg-white px-5 pb-8 pt-3">
              <span aria-hidden className="h-[5px] w-12 shrink-0 rounded-full bg-(--line)" />
              <div className="flex w-full items-start">
                <div className="flex flex-1 flex-col gap-1 leading-[1.4]">
                  <h2 className="text-[22px] font-bold">어느 기록부터 마무리할까요?</h2>
                  <p className="text-base text-muted">마무리 못 한 기록이 {items.length}건 있어요.</p>
                </div>
                <button
                  type="button"
                  onPointerDown={buzz}
                  onClick={() => setOpen(false)}
                  className="press flex size-12 shrink-0 items-center justify-center rounded-full active:bg-(--bg-secondary)"
                >
                  <Icon name="close" size={28} />
                  <span className="sr-only">닫기</span>
                </button>
              </div>
              <ul className="flex w-full flex-col gap-px overflow-hidden rounded-2xl bg-(--line)">
                {items.map((v) => (
                  <li key={v.href} className="bg-(--bg-secondary)">
                    <PressLink href={v.href} pendingText={false} className="flex min-h-16 items-center gap-3 px-4 py-3.5 active:bg-(--line)">
                      <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white text-xl font-bold text-muted">
                        {v.name.slice(0, 1)}
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5 leading-[1.4]">
                        <span className="text-lg font-bold">{v.name} 수급자</span>
                        <span className="text-base text-muted">
                          <span className="whitespace-nowrap">{v.date}</span> · <span className="whitespace-nowrap">{v.step}</span>
                        </span>
                      </span>
                      <Icon name="chevron_right" size={28} className="text-muted" />
                    </PressLink>
                  </li>
                ))}
              </ul>
            </div>
          </div>,
          document.querySelector(".v1120") ?? document.body,
        )}
    </>
  );
}
