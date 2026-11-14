"use client";

import { useEffect, useRef, useState } from "react";
import { saveSignatures, signAsGuardian } from "../_actions";
import { EMPTY_SIGNATURES, SIGN_H as H, SIGN_W as W } from "../_signatures";
import type { Signatures, Stroke } from "../_types";
import { Button } from "./Pressable";

// 급여제공기록지 서명칸 (LAW-9). 손가락·펜이 지나간 점을 SVG 선으로 그린다.
// 좌표는 칸 크기와 상관없는 0~W·0~H 값으로 모아서, 칸이 늘거나 줄어도(인쇄·화면 돌림) 서명이 그대로 따라간다.

const toPath = (s: Stroke) => s.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");

function SignatureBox({ label, value, onChange }: { label: string; value: Stroke[]; onChange: (v: Stroke[]) => void }) {
  const [strokes, setStrokes] = useState(value);
  const [drawing, setDrawing] = useState(false);
  const svg = useRef<SVGSVGElement>(null);

  // iOS Safari는 svg의 touch-action:none을 무시하고 화면을 같이 끌어서, 서명칸 안에서는 터치 스크롤을 직접 막는다 (React onTouchMove는 passive라 못 막음)
  useEffect(() => {
    const el = svg.current;
    const stop = (e: TouchEvent) => e.preventDefault();
    el?.addEventListener("touchmove", stop, { passive: false });
    return () => el?.removeEventListener("touchmove", stop);
  }, []);

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
    <div className="flex min-w-0 flex-col gap-1 break-inside-avoid">
      {/* 서명칸 (Figma 516:854): 연한 회색 면 r12, 140px, 이름은 칸 안 위쪽 */}
      <div className="relative h-[140px] touch-none overflow-hidden rounded-xl bg-(--bg-secondary) print:bg-white">
        <span className="pointer-events-none absolute inset-x-3 top-3 text-base font-medium leading-[1.4] text-muted">{label}</span>
        {strokes.length === 0 && (
          <span aria-hidden className="pointer-events-none absolute inset-x-3 bottom-3 text-center text-base font-bold text-(--text-brand) print:hidden">
            눌러서 서명
          </span>
        )}
        <svg
          ref={svg}
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
      {strokes.length > 0 && (
        <button
          type="button"
          onClick={() => {
            setStrokes([]);
            onChange([]);
          }}
          className="press min-h-12 self-start rounded-xl px-2 text-base font-bold text-muted active:bg-(--bg-secondary) print:hidden"
        >
          다시 쓰기
        </button>
      )}
    </div>
  );
}

// 보기만 하는 서명칸: 들어온 서명을 그리고, 없으면 누가 어디서 서명하는지 적는다
function SignatureView({ label, value, empty }: { label: string; value: Stroke[]; empty: string }) {
  return (
    <div className="relative h-[140px] overflow-hidden rounded-xl bg-(--bg-secondary) print:bg-white">
      <span className="pointer-events-none absolute inset-x-3 top-3 text-base font-medium leading-[1.4] text-muted">{label}</span>
      {value.length === 0 ? (
        <span className="absolute inset-x-3 bottom-3 text-center text-base text-muted print:hidden">{empty}</span>
      ) : (
        <svg role="img" aria-label={`${label} 서명 (서명함)`} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
          {value.map((s, i) =>
            s.length === 1 ? (
              <circle key={i} cx={s[0][0]} cy={s[0][1]} r={1.5} fill="#222222" />
            ) : (
              <path key={i} d={toPath(s)} fill="none" stroke="#222222" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            ),
          )}
        </svg>
      )}
    </div>
  );
}

// 급여제공기록지 아래 확인 서명. visitId가 있으면(요양보호사 쪽) 서명할 때마다 암호화해 저장하고, 없으면(보호자 쪽 임시 화면) 화면에만 둔다
// onChange: 보내기 화면(C-15)이 요양보호사 서명이 있는지 알고, 보낼 때 함께 넘기려고 쓴다
// caregiverOnly: 보내기 화면(C-15)은 요양보호사 서명만. 보호자는 받은 보고서에서 따로 서명한다 (D-48 261114.ver)
// readOnly: 최종 기록지 확인(급여제공기록지)에서는 두 서명을 보기만 한다. 요양보호사는 보낼 때(C-15), 보호자는 받은 보고서(G-01)에서 서명한다 (D-48 261114.ver)
export function SignatureSection({ visitId, initial, caregiverName, onChange, caregiverOnly = false, readOnly = false }: { visitId?: string; initial?: Signatures; caregiverName: string; onChange?: (s: Signatures) => void; caregiverOnly?: boolean; readOnly?: boolean }) {
  const [sig, setSig] = useState<Signatures>(initial ?? EMPTY_SIGNATURES);
  useEffect(() => onChange?.(sig), [sig, onChange]);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "failed">("idle");
  const last = useRef(JSON.stringify(initial ?? EMPTY_SIGNATURES)); // 마지막으로 저장한 값. 같으면 다시 저장하지 않는다 (처음 열 때 "저장했어요"가 뜨지 않게)

  useEffect(() => {
    const now = JSON.stringify(sig);
    if (!visitId || now === last.current) return;
    // 사유는 글자마다 바뀌어서 잠깐 멈췄을 때 한 번만 저장한다
    setStatus("saving");
    const t = setTimeout(() => {
      saveSignatures(visitId, sig).then(
        () => {
          last.current = now;
          setStatus("saved");
        },
        () => setStatus("failed"),
      );
    }, 600);
    return () => clearTimeout(t);
  }, [sig, visitId]);

  return (
    <>
      <div className={caregiverOnly ? "flex flex-col" : "grid grid-cols-2 gap-3"}>
        {/* 요양보호사 쪽(visitId 있음)은 수급자·보호자 칸을 보기만 한다: 대리 서명 막기, 보호자는 받은 보고서에서 서명 (D-48 261114.ver) */}
        {!caregiverOnly &&
          (visitId || readOnly ? (
            <SignatureView label="수급자 또는 보호자" value={sig.recipient} empty="보호자가 받은 보고서에서 서명해요" />
          ) : (
            <SignatureBox label="수급자 또는 보호자" value={sig.recipient} onChange={(recipient) => setSig((s) => ({ ...s, recipient }))} />
          ))}
        {readOnly ? (
          <SignatureView label={`요양보호사 ${caregiverName}`} value={sig.caregiver} empty="보낼 때 서명해요" />
        ) : (
          <SignatureBox label={`요양보호사 ${caregiverName}`} value={sig.caregiver} onChange={(caregiver) => setSig((s) => ({ ...s, caregiver }))} />
        )}
      </div>
      {!caregiverOnly && sig.recipientMeta && (
        <p className="text-base text-muted">보호자 서명: {new Date(sig.recipientMeta.at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}, 보고서 링크에서</p>
      )}
      {!caregiverOnly && (
      <label className="flex flex-col gap-2 text-lg font-bold">
        서명 불가 사유
        <input
          value={sig.reason}
          maxLength={200}
          onChange={(e) => setSig((s) => ({ ...s, reason: e.target.value }))}
          placeholder="예: 수급자 손 떨림으로 서명 어려움"
          className="h-14 rounded-[15px] bg-(--bg-secondary) px-4 text-lg font-normal transition-shadow placeholder:text-muted focus:bg-white focus:outline-none focus:ring-[3px] focus:ring-accent/50 print:bg-white print:px-0 print:placeholder:text-transparent"
        />
      </label>
      )}
      {visitId && (
        <p
          role="status"
          key={status}
          className={`min-h-6 text-base print:hidden ${status === "failed" ? "text-(--text-danger)" : status === "saved" ? "done-pulse font-bold text-(--text-success)" : "text-muted"}`}
        >
          {status === "saving" ? "저장 중…" : status === "saved" ? (readOnly ? "사유를 저장했어요" : "서명을 저장했어요") : status === "failed" ? (readOnly ? "저장하지 못했어요. 다시 적어 주세요." : "서명을 저장하지 못했어요. 다시 써 주세요.") : ""}
        </p>
      )}
    </>
  );
}

// 보호자 보고서(G-01)의 확인 서명: 보호자가 서명해 제출하면 요양보호사 쪽 급여제공기록지 서명칸에 들어간다 (D-48 261114.ver)
export function GuardianSignForm({ token, signed: signedBefore }: { token: string; signed: boolean }) {
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [state, setState] = useState<"idle" | "sending" | "done" | "failed">(signedBefore ? "done" : "idle");
  if (state === "done") {
    return <p className="rounded-xl bg-(--success-soft) px-4 py-3 text-lg font-bold text-(--text-success)">서명을 보냈어요. 고마워요.</p>;
  }
  return (
    <>
      <SignatureBox label="수급자 또는 보호자" value={strokes} onChange={setStrokes} />
      <Button
        disabled={strokes.length === 0 || state === "sending"}
        disabledReason={strokes.length === 0 ? "위 칸에 서명하면 보낼 수 있어요." : undefined}
        onClick={() => {
          setState("sending");
          signAsGuardian(token, strokes).then(
            () => setState("done"),
            () => setState("failed"),
          );
        }}
      >
        {state === "sending" ? "보내는 중이에요" : "서명 보내기"}
      </Button>
      {state === "failed" && <p className="text-base font-bold text-(--text-danger)">서명을 보내지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요.</p>}
    </>
  );
}
