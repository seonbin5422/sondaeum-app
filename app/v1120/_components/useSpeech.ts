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

  useEffect(() => {
    onFinalRef.current = onFinal;
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time browser feature detection, unavailable during SSR
    setSupported(!!getCtor());
  }, []);

  function create(): RecognitionLike | null {
    const C = getCtor();
    if (!C) return null;
    const rec = new C();
    rec.lang = "ko-KR";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let text = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) onFinalRef.current(r[0].transcript.trim());
        else text += r[0].transcript;
      }
      setInterim(text);
    };
    rec.onerror = (e) => {
      setInterim("");
      if (e.error === "no-speech") return;
      keepRef.current = false;
      setError(
        e.error === "not-allowed" || e.error === "service-not-allowed"
          ? "마이크 권한이 꺼져 있어요. 설정에서 마이크를 허용해 주세요."
          : "음성 인식에 문제가 생겼어요. 다시 눌러 주세요.",
      );
    };
    rec.onend = () => {
      setInterim("");
      if (recRef.current !== rec) return;
      if (keepRef.current) {
        const next = create();
        if (next) {
          recRef.current = next;
          next.start();
          return;
        }
      }
      recRef.current = null;
      setRecording(false);
    };
    return rec;
  }

  function start() {
    const rec = create();
    if (!rec) return;
    setError(null);
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
