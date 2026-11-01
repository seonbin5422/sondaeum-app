"use client";

import { useEffect, useRef, useState } from "react";

// 브라우저 음성 인식 (기존 RecordScreen.tsx와 같은 방식). 확정된 문장이 나올 때마다 onFinal을 불러
// 바로 저장할 수 있게 한다 (D-27: 끊겨도 직전까지 말한 내용은 남김).

interface ResultLike {
  isFinal: boolean;
  0: { transcript: string };
}
interface EventLike {
  resultIndex: number;
  results: ArrayLike<ResultLike>;
}
interface RecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: EventLike) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  abort(): void;
  start: () => void;
  stop: () => void;
}
type Ctor = new () => RecognitionLike;

function getCtor(): Ctor | null {
  const w = window as unknown as { SpeechRecognition?: Ctor; webkitSpeechRecognition?: Ctor };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function useSpeech(onFinal: (text: string) => void) {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [recording, setRecording] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<RecognitionLike | null>(null);
  const keepRef = useRef(false);
  const onFinalRef = useRef(onFinal);
  const failsRef = useRef(0); // 자동으로 다시 켜다 연달아 실패한 횟수

  useEffect(() => {
    onFinalRef.current = onFinal;
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time browser feature detection, unavailable during SSR
    setSupported(!!getCtor());
  }, []);

  // LAW-5: 녹음은 누를 때만. 화면을 떠나거나(뒤로 가기) 다른 앱으로 가면 마이크를 끄고 자동으로 다시 켜지 않는다
  useEffect(() => {
    const off = () => {
      keepRef.current = false;
      recRef.current?.abort();
      recRef.current = null;
      setRecording(false);
    };
    const onHide = () => document.visibilityState === "hidden" && off();
    document.addEventListener("visibilitychange", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      off();
    };
  }, []);

  // first: 사용자가 누른 시작. 아니면 안드로이드가 말이 멈출 때마다 끝내서 자동으로 다시 켠 것
  function create(first: boolean): RecognitionLike | null {
    const C = getCtor();
    if (!C) return null;
    const rec = new C();
    rec.lang = "ko-KR";
    rec.continuous = true;
    rec.interimResults = true;
    // 안드로이드 크롬은 확정 문장마다 앞서 확정된 말까지 다시 붙여 보낸다("기저귀" → "기저귀 5분" …). 새로 붙은 뒤쪽만 넘긴다
    const android = /Android/i.test(navigator.userAgent);
    let last = "";
    rec.onresult = (e) => {
      failsRef.current = 0;
      let text = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (!r.isFinal) {
          text += r[0].transcript;
          continue;
        }
        const full = r[0].transcript.trim();
        const add = android && last && full.startsWith(last) ? full.slice(last.length).trim() : full;
        last = full;
        if (add) onFinalRef.current(add);
      }
      if (android && last && text.trim().startsWith(last)) text = text.trim().slice(last.length);
      setInterim(text);
    };
    rec.onerror = (e) => {
      setInterim("");
      if (e.error === "no-speech" || e.error === "aborted") return;
      // 자동으로 다시 켤 때는 앞 세션이 마이크를 늦게 놓아 not-allowed·audio-capture가 잠깐 날 수 있다. 몇 번은 조용히 다시 켠다
      if (!first && ++failsRef.current <= 3) return;
      keepRef.current = false;
      setError(
        first && (e.error === "not-allowed" || e.error === "service-not-allowed")
          ? "마이크 권한이 꺼져 있어요. 설정에서 마이크를 허용해 주세요."
          : `마이크가 끊겼어요. 다시 눌러 이어서 말해 주세요. (${e.error})`,
      );
    };
    rec.onend = () => {
      setInterim("");
      if (recRef.current !== rec) return;
      if (keepRef.current) {
        const next = create(false);
        if (next) {
          recRef.current = next;
          // 실패 뒤에는 마이크가 풀릴 틈을 조금 준다
          setTimeout(() => {
            if (recRef.current !== next) return;
            try {
              next.start();
            } catch {
              // 시작 자체가 거절되면 실패로 세고 다음 시도로 (3번 넘으면 onerror가 멈춘다)
              next.onerror?.({ error: "start-failed" });
              next.onend?.();
            }
          }, failsRef.current ? 400 : 0);
          return;
        }
      }
      recRef.current = null;
      setRecording(false);
    };
    return rec;
  }

  function start() {
    const rec = create(true);
    if (!rec) return;
    setError(null);
    failsRef.current = 0;
    keepRef.current = true;
    recRef.current = rec;
    rec.start();
    setRecording(true);
  }

  function stop() {
    keepRef.current = false;
    recRef.current?.stop();
    setRecording(false);
  }

  return { supported, recording, interim, error, start, stop };
}
