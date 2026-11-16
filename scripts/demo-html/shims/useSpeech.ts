"use client";
// 시연 HTML용 useSpeech: file://에서는 크롬 받아쓰기(Web Speech) 마이크 권한이 켜지지 않는다(11/17 사용자 확인).
// 그래서 녹음(MediaRecorder)을 말이 멈출 때마다 끊어 Groq Whisper로 보낸다 → 한 마디씩 바로 글이 붙는다(배포 앱처럼 말하는 중에 확인).
// 화면이 쓰는 모양(supported·recording·interim·error·start·stop)은 원래와 같다.
// shortcut: 소리 크기로만 말·쉼을 가른다(RMS 문턱 고정), 시끄러운 곳에서는 MAX_MS마다 끊긴다. 현장 소음이 크면 문턱을 올린다
import { useEffect, useRef, useState } from "react";
import { whisper } from "./whisper";

const SPEECH_RMS = 0.015; // 이보다 크면 말하는 중
const PAUSE_MS = 700; // 말한 뒤 이만큼 조용하면 한 마디로 끊는다
const MAX_MS = 12000; // 쉬지 않고 말해도 이만큼마다 끊는다

const extOf = (mime: string) => (mime.includes("mp4") ? "mp4" : mime.includes("ogg") ? "ogg" : "webm"); // 사파리는 mp4로 녹음한다

type Session = { stream: MediaStream; ctx: AudioContext; timer: ReturnType<typeof setInterval>; rec: MediaRecorder | null; live: boolean };

export function useSpeech(onFinal: (text: string) => void) {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [recording, setRecording] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const sess = useRef<Session | null>(null);
  const queue = useRef<Promise<void>>(Promise.resolve()); // 받아쓰기 결과를 말한 순서대로 붙인다
  const pending = useRef(0);
  const onFinalRef = useRef(onFinal);
  useEffect(() => {
    onFinalRef.current = onFinal;
  });
  useEffect(() => setSupported(!!navigator.mediaDevices?.getUserMedia && !!process.env.GROQ_API_KEY && typeof MediaRecorder !== "undefined"), []);

  function send(blob: Blob) {
    pending.current++;
    setInterim("받아쓰는 중…");
    const job = whisper(blob, `audio.${extOf(blob.type)}`).catch((e) => {
      setError(`받아쓰지 못했어요. 다시 눌러 말해 주세요. (${e instanceof Error ? e.message : e})`);
      return "";
    });
    queue.current = queue.current.then(async () => {
      const text = await job;
      if (text) onFinalRef.current(text);
      if (--pending.current === 0) setInterim(sess.current?.live ? "듣는 중…" : "");
    });
  }

  // 한 마디 녹음 시작. 끝나면(stop) 말소리가 있었던 마디만 보낸다
  function startSegment(s: Session) {
    const rec = new MediaRecorder(s.stream);
    const chunks: Blob[] = [];
    let spoke = false;
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.onstop = () => spoke && chunks.length && send(new Blob(chunks, { type: rec.mimeType }));
    (rec as MediaRecorder & { markSpoke?: () => void }).markSpoke = () => (spoke = true);
    rec.start();
    s.rec = rec;
    return rec;
  }

  function close(s: Session, keepLast: boolean) {
    s.live = false;
    clearInterval(s.timer);
    const r = s.rec;
    if (r && r.state !== "inactive") {
      if (!keepLast) r.onstop = null;
      r.stop();
    }
    s.stream.getTracks().forEach((t) => t.stop());
    s.ctx.close().catch(() => {});
  }

  // LAW-5: 화면을 떠나면 마이크를 끈다(말하던 마디는 버린다)
  useEffect(() => {
    const off = () => {
      if (sess.current) close(sess.current, false);
      sess.current = null;
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
    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    ctx.createMediaStreamSource(stream).connect(analyser);
    const buf = new Float32Array(analyser.fftSize);
    let segStart = Date.now();
    let lastVoice = 0;
    const s: Session = { stream, ctx, rec: null, live: true, timer: 0 as unknown as ReturnType<typeof setInterval> };
    startSegment(s);
    s.timer = setInterval(() => {
      analyser.getFloatTimeDomainData(buf);
      const rms = Math.sqrt(buf.reduce((a, v) => a + v * v, 0) / buf.length);
      const now = Date.now();
      if (rms > SPEECH_RMS) {
        lastVoice = now;
        (s.rec as MediaRecorder & { markSpoke?: () => void })?.markSpoke?.();
      }
      const paused = lastVoice > segStart && now - lastVoice > PAUSE_MS;
      if (paused || now - segStart > MAX_MS) {
        s.rec?.stop();
        startSegment(s);
        segStart = now;
        lastVoice = 0;
      }
    }, 100);
    sess.current = s;
    setInterim("듣는 중…");
    setRecording(true);
  }

  function stop() {
    const s = sess.current;
    sess.current = null;
    const last = s?.rec;
    // 마지막 마디의 onstop(보내기)이 끝난 뒤를 기다린다
    const stopped = last && last.state !== "inactive" ? new Promise<void>((ok) => last.addEventListener("stop", () => setTimeout(ok, 0), { once: true })) : Promise.resolve();
    if (s) close(s, true);
    // 녹음 끝내기 뒤 마지막 마디가 받아써질 때까지 녹음 중으로 둔다: 그 전에 "다 말했어요"를 누르면 마지막 말이 빠진다
    stopped.then(() => queue.current).then(() => (setRecording(false), setInterim("")));
  }

  return { supported, recording, interim, error, start, stop };
}
