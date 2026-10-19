"use client";

import { useEffect, useRef, useState } from "react";
import { saveSignatures } from "../_actions";
import { EMPTY_SIGNATURES, SIGN_H as H, SIGN_W as W } from "../_signatures";
import type { Signatures, Stroke } from "../_types";

// 급여제공기록지 서명칸 (LAW-9). 손가락·펜이 지나간 점을 SVG 선으로 그린다.
// 좌표는 칸 크기와 상관없는 0~W·0~H 값으로 모아서, 칸이 늘거나 줄어도(인쇄·화면 돌림) 서명이 그대로 따라간다.

const toPath = (s: Stroke) => s.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");

function SignatureBox({ label, value, onChange }: { label: string; value: Stroke[]; onChange: (v: Stroke[]) => void }) {
  const [strokes, setStrokes] = useState(value);
  const [drawing, setDrawing] = useState(false);

  const at = (e: React.PointerEvent<SVGSVGElement>): [number, number] => {
    const r = e.currentTarget.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H];
  };
  const end = () => {
    if (!drawing) return;
    setDrawing(false);
    onChange(strokes); // 한 획을 다 그렸을 때만 저장한다
  };

  return (
    <div className="flex flex-col gap-1 break-inside-avoid">
      <div className="flex min-h-12 items-center justify-between">
        <span className="text-base font-bold">{label}</span>
        {strokes.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setStrokes([]);
              onChange([]);
            }}
            className="min-h-12 px-2 text-base text-muted underline print:hidden"
          >
            다시 쓰기
          </button>
        )}
      </div>
      <div className="relative h-28 rounded-xl border border-border bg-white">
        {strokes.length === 0 && (
          <span aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center text-base text-muted print:hidden">
            여기에 서명해 주세요
          </span>
        )}
        <svg
          role="img"
          aria-label={`${label} 서명칸${strokes.length ? " (서명함)" : ""}`}
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full touch-none"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            setDrawing(true);
            const p = at(e); // 이벤트는 바로 읽어야 한다 (setState 안에서 읽으면 currentTarget이 비어 있음)
            setStrokes((s) => [...s, [p]]);
          }}
          onPointerMove={(e) => {
            if (!drawing) return;
            const p = at(e);
            setStrokes((s) => [...s.slice(0, -1), [...s[s.length - 1], p]]);
          }}
          onPointerUp={end}
          onPointerCancel={end}
        >
          {/* 서명 기준선 */}
          <line x1={16} x2={W - 16} y1={H - 24} y2={H - 24} stroke="var(--line)" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
          {strokes.map((s, i) =>
            s.length === 1 ? (
              <circle key={i} cx={s[0][0]} cy={s[0][1]} r={1.5} fill="#222222" />
            ) : (
              <path
                key={i}
                d={toPath(s)}
                fill="none"
                stroke="#222222"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            ),
          )}
        </svg>
      </div>
    </div>
  );
}

// 급여제공기록지 아래 확인 서명. visitId가 있으면(요양보호사 쪽) 서명할 때마다 암호화해 저장하고, 없으면(보호자 쪽 임시 화면) 화면에만 둔다
export function SignatureSection({ visitId, initial, caregiverName }: { visitId?: string; initial?: Signatures; caregiverName: string }) {
  const [sig, setSig] = useState<Signatures>(initial ?? EMPTY_SIGNATURES);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "failed">("idle");
  const first = useRef(true);

  useEffect(() => {
    if (first.current || !visitId) {
      first.current = false;
      return;
    }
    // 사유는 글자마다 바뀌어서 잠깐 멈췄을 때 한 번만 저장한다
    setStatus("saving");
    const t = setTimeout(() => {
      saveSignatures(visitId, sig).then(
        () => setStatus("saved"),
        () => setStatus("failed"),
      );
    }, 600);
    return () => clearTimeout(t);
  }, [sig, visitId]);

  return (
    <>
      <div className="grid gap-3 print:grid-cols-2">
        <SignatureBox label="수급자 또는 보호자" value={sig.recipient} onChange={(recipient) => setSig((s) => ({ ...s, recipient }))} />
        <SignatureBox label={`요양보호사 ${caregiverName}`} value={sig.caregiver} onChange={(caregiver) => setSig((s) => ({ ...s, caregiver }))} />
      </div>
      <label className="flex flex-col gap-1 text-base font-bold">
        서명 불가 사유
        <input
          value={sig.reason}
          maxLength={200}
          onChange={(e) => setSig((s) => ({ ...s, reason: e.target.value }))}
          placeholder="서명할 수 없을 때만 적어 주세요"
          className="h-12 rounded-xl border border-border px-3 font-normal placeholder:text-muted focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/50 print:placeholder:text-transparent"
        />
      </label>
      {visitId && (
        <p role="status" className={`text-base print:hidden ${status === "failed" ? "text-(--danger)" : "text-muted"}`}>
          {status === "saving" ? "서명 저장 중…" : status === "saved" ? "서명을 저장했어요" : status === "failed" ? "서명을 저장하지 못했어요. 다시 써 주세요." : ""}
        </p>
      )}
    </>
  );
}
