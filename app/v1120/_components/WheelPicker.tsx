"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "./Pressable";

// 시각·날짜 휠 피커 (사용자 11/14): 칸을 누르면 아래에서 시트가 올라오고, 숫자 목록을 굴려 가운데 줄에 맞춘 값으로 정한다.
// 브라우저 기본 입력칸은 맥 사파리에 고르기 창이 없고 PC·휴대폰 모양도 달라서 직접 만든다. 마우스 휠·터치 스크롤·숫자 누르기 모두 된다.

const ROW = 48; // 한 줄 높이(px). 가운데 줄 위아래로 두 줄씩 보인다
const pad = (n: number) => String(n).padStart(2, "0");

type Column = { items: string[]; unit: string };

function Wheel({ col, index, onIndex, label }: { col: Column; index: number; onIndex: (i: number) => void; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // 처음 열 때 고른 값이 가운데 오게
  useLayoutEffect(() => {
    if (ref.current) ref.current.scrollTop = index * ROW;
    // 열 때 한 번만 맞춘다. 굴리는 중에 다시 맞추면 손가락과 싸운다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="flex flex-1 items-center gap-1">
      <div
        ref={ref}
        role="listbox"
        aria-label={label}
        tabIndex={0}
        className="h-[240px] flex-1 snap-y snap-mandatory overflow-y-scroll overscroll-contain [scrollbar-width:none] focus:outline-none"
        style={{ paddingBlock: ROW * 2 }}
        onScroll={(e) => {
          const el = e.currentTarget;
          clearTimeout(timer.current);
          // 굴리기를 멈췄을 때 가장 가까운 줄로 정한다
          timer.current = setTimeout(() => onIndex(Math.max(0, Math.min(col.items.length - 1, Math.round(el.scrollTop / ROW)))), 80);
        }}
        onKeyDown={(e) => {
          const step = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0;
          if (!step) return;
          e.preventDefault();
          const next = Math.max(0, Math.min(col.items.length - 1, index + step));
          ref.current?.scrollTo({ top: next * ROW, behavior: "smooth" });
          onIndex(next);
        }}
      >
        {col.items.map((it, i) => (
          <button
            key={it}
            type="button"
            role="option"
            aria-selected={i === index}
            tabIndex={-1}
            onClick={() => {
              ref.current?.scrollTo({ top: i * ROW, behavior: "smooth" });
              onIndex(i);
            }}
            className={`flex h-12 w-full snap-center items-center justify-center text-[22px] transition-colors ${i === index ? "font-bold text-foreground" : "text-muted"}`}
          >
            {it}
          </button>
        ))}
      </div>
      <span className="w-6 shrink-0 text-lg font-medium">{col.unit}</span>
    </div>
  );
}

function Sheet({ title, cols, start, onDone, onClose }: { title: string; cols: Column[]; start: number[]; onDone: (idx: number[]) => void; onClose: () => void }) {
  const [idx, setIdx] = useState(start);
  return createPortal(
    <div className="fixed inset-0 z-40 flex items-end bg-black/45" role="dialog" aria-modal="true" aria-label={title} onClick={onClose} onKeyDown={(e) => e.key === "Escape" && onClose()}>
      <div className="enter mx-auto flex w-full max-w-md flex-col gap-4 rounded-t-3xl bg-white p-6 pb-[calc(24px+env(safe-area-inset-bottom))]" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold">{title}</h2>
        <div className="relative flex gap-3">
          {/* 가운데 고른 줄 표시: 연한 귤색 면 */}
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-[96px] h-12 rounded-xl bg-(--bg-brand)" />
          {cols.map((c, ci) => (
            <div key={ci} className="relative flex flex-1">
              <Wheel col={c} index={idx[ci]} label={`${title} ${c.unit}`} onIndex={(i) => setIdx((p) => p.map((v, k) => (k === ci ? i : v)))} />
            </div>
          ))}
        </div>
        <Button onClick={() => onDone(idx)}>확인</Button>
        <Button variant="secondary" onClick={onClose}>
          취소
        </Button>
      </div>
    </div>,
    document.querySelector(".v1120") ?? document.body,
  );
}

// 시각 고르기 "HH:MM". name을 주면 폼에 같은 이름으로 실린다(ClientForm)
const HOURS = Array.from({ length: 24 }, (_, i) => pad(i));
const MINUTES = Array.from({ length: 60 }, (_, i) => pad(i));
export function TimeWheel({ label, value, onChange, name, className = "" }: { label: string; value: string; onChange?: (v: string) => void; name?: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const [v, setV] = useState(value);
  const shown = onChange ? value : v; // onChange가 있으면 부모가 값을 쥔다
  const ok = /^\d{2}:\d{2}$/.test(shown);
  const [h, m] = ok ? shown.split(":").map(Number) : [9, 0];
  return (
    <>
      {name && <input type="hidden" name={name} value={shown} />}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`${label} ${ok ? `${h}시 ${m}분` : "고르기"}`}
        className={`press flex h-14 items-center justify-center rounded-[15px] px-4 text-lg font-bold ${ok ? "bg-(--bg-secondary)" : "bg-(--bg-brand) text-(--text-brand)"} ${className}`}
      >
        {ok ? shown : "--:--"}
      </button>
      {open && (
        <Sheet
          title={label}
          cols={[
            { items: HOURS, unit: "시" },
            { items: MINUTES, unit: "분" },
          ]}
          start={[h, m]}
          onClose={() => setOpen(false)}
          onDone={([hi, mi]) => {
            const t = `${HOURS[hi]}:${MINUTES[mi]}`;
            setV(t);
            onChange?.(t);
            setOpen(false);
          }}
        />
      )}
    </>
  );
}

// 날짜 고르기 "YYYY-MM-DD". max보다 뒤를 고르면 max로 맞춘다
export function DateWheel({ label, value, onChange, max, className = "" }: { label: string; value: string; onChange: (v: string) => void; max: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const maxY = Number(max.slice(0, 4));
  const years = Array.from({ length: 3 }, (_, i) => String(maxY - 2 + i));
  const months = Array.from({ length: 12 }, (_, i) => pad(i + 1));
  const days = Array.from({ length: 31 }, (_, i) => pad(i + 1));
  const [y, mo, d] = value.split("-");
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`press flex items-center text-lg font-bold ${className}`} aria-label={`${label} ${value}`}>
        {`${Number(mo)}월 ${Number(d)}일`}
      </button>
      {open && (
        <Sheet
          title={label}
          cols={[
            { items: years, unit: "년" },
            { items: months, unit: "월" },
            { items: days, unit: "일" },
          ]}
          start={[Math.max(0, years.indexOf(y)), Number(mo) - 1, Number(d) - 1]}
          onClose={() => setOpen(false)}
          onDone={([yi, mi, di]) => {
            const yy = Number(years[yi]);
            const last = new Date(Date.UTC(yy, mi + 1, 0)).getUTCDate(); // 그 달의 마지막 날 (2월 30일 → 28·29일)
            const pick = `${yy}-${months[mi]}-${pad(Math.min(di + 1, last))}`;
            onChange(pick > max ? max : pick);
            setOpen(false);
          }}
        />
      )}
    </>
  );
}
