"use client";
// 시연 HTML용 useSpeech: file://에서는 크롬 받아쓰기(Web Speech) 마이크 권한이 켜지지 않는다(11/17 사용자 확인).
// 그래서 녹음(MediaRecorder)을 끝낼 때 한 번에 Groq Whisper로 글로 바꾼다. 화면이 쓰는 모양(supported·recording·interim·error·start·stop)은 원래와 같다.
// shortcut: 말하는 동안 글자가 바로 안 나오고 끝낸 뒤 1~3초 뒤에 나온다, 실시간이 필요하면 몇 초씩 잘라 보낸다
import { useEffect, useRef, useState } from "react";
import { whisper } from "./whisper";

declare global {
  // 기록 확인(ReviewScreen)의 "다 말했어요"가 받아쓰기 끝을 기다리게 한다 (build.mjs가 1초 기다림을 이것으로 바꾼다)
  var __speechDone: Promise<void> | undefined;
}

export function useSpeech(onFinal: (text: string) => void) {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [recording, setRecording] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const onFinalRef = useRef(onFinal);
  useEffect(() => {
    onFinalRef.current = onFinal;
  });
  useEffect(() => setSupported(!!navigator.mediaDevices?.getUserMedia && !!process.env.GROQ_API_KEY && typeof MediaRecorder !== "undefined"), []);

  // LAW-5: 화면을 떠나면 마이크를 끈다(녹음한 것은 버린다)
  useEffect(() => {
    const off = () => {
      const r = recRef.current;
      recRef.current = null;
      if (r && r.state !== "inactive") {
        r.ondataavailable = null;
        r.onstop = null;
        r.stop();
        r.stream.getTracks().forEach((t) => t.stop());
      }
      setRecording(false);
    };
    const onHide = () => document.visibilityState === "hidden" && off();
    document.addEventListener("visibilitychange", onHide);
    return () => (document.removeEventListener("visibilitychange", onHide), off());
  }, []);

  async function start() {
    setError(null);
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError("마이크 권한이 꺼져 있어요. 주소창 왼쪽에서 마이크를 허용해 주세요.");
      return;
    }
    const rec = new MediaRecorder(stream);
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    let done!: () => void;
    globalThis.__speechDone = new Promise<void>((ok) => (done = ok));
    rec.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      setInterim("받아쓰는 중…");
      try {
        // 사파리는 webm이 아니라 mp4로 녹음한다: 파일 이름 확장자를 맞춰야 Whisper가 읽는다
        const ext = rec.mimeType.includes("mp4") ? "mp4" : rec.mimeType.includes("ogg") ? "ogg" : "webm";
        const text = await whisper(new Blob(chunks, { type: rec.mimeType }), `audio.${ext}`);
        if (text) onFinalRef.current(text);
      } catch (e) {
        setError(`받아쓰지 못했어요. 다시 눌러 말해 주세요. (${e instanceof Error ? e.message : e})`);
      }
      setInterim("");
      setRecording(false);
      done();
    };
    recRef.current = rec;
    rec.start();
    setRecording(true);
  }

  function stop() {
    const r = recRef.current;
    recRef.current = null;
    // recording은 받아쓰기가 끝날 때(onstop) 내린다: 그 전에 "다 말했어요"를 누르면 마지막 말이 빠진다
    if (r && r.state !== "inactive") r.stop();
    else setRecording(false);
  }

  return { supported, recording, interim, error, start, stop };
}
