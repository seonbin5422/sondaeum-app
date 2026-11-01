"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Screen, TopBar } from "../../../_components/ui";
import { useSpeech } from "../../../_components/useSpeech";
import { finishRecording, saveTranscript } from "../../../_actions";
import { sampleTranscript } from "../../../_mock";
import { extractRecord, keepFilled } from "../../../_extract";
import type { CareRecord, Change } from "../../../_types";
import { AUDIO_TOO_LARGE_MESSAGE, MAX_AUDIO_UPLOAD_BYTES } from "@/lib/audioUpload";

// 무엇을 말할지 모르는 분을 위해 기록지 순서대로 묻고, 말한 내용에서 찾은 값을 바로 보여 준다.
// 값은 낱말 찾기(extractRecord)로 미리 보는 것이고, 실제 정리는 "다 말했어요" 뒤에 AI가 한다.
const CHANGE_WORD: Record<Change, string> = { improved: "좋아짐", same: "비슷함", worse: "나빠짐" };
const on = (pairs: [boolean | null, string][]) => pairs.filter(([v]) => v).map(([, l]) => l);
const mins = (v: number | null) => (v === null ? "시간을 말해 주세요" : `${v}분`);

function guide(r: CareRecord): { title: string; ask: string; say: string; found: string[] }[] {
  const p = r.physical;
  const phys = on([[p.personalHygiene, "개인위생"], [p.bathing, "몸씻기"], [p.mealAssist, "식사도움"], [p.repositioning, "체위변경"], [p.mobility, "이동도움"], [p.toileting, "화장실"]]);
  const cog = ([["stimulation", "인지활동"], ["dailyLiving", "일상 함께하기"], ["behaviorManagement", "행동변화 관리"], ["emotional", "말벗·격려"]] as const)
    .filter(([k]) => r.cognitive[k] !== null)
    .map(([k, l]) => `${l} ${r.cognitive[k]}분`);
  const hh = on([[r.household.mealPrepCleaningLaundry, "식사준비·청소·세탁"], [r.household.personalActivity, "외출 동행"]]);
  const ch = ([["physical", "몸"], ["meal", "식사"], ["cognitive", "기억·인지"]] as const)
    .filter(([k]) => r.change[k])
    .map(([k, l]) => `${l} ${CHANGE_WORD[r.change[k]!]}`);
  const b = r.bowel;
  const bowel = [
    b.stoolAccidents !== null && `대변 실수 ${b.stoolAccidents}회`,
    b.urineAccidents !== null && `소변 실수 ${b.urineAccidents}회`,
    b.diaperChanges !== null && `기저귀 ${b.diaperChanges}회`,
  ].filter((x): x is string => !!x);
  return [
    { title: "몸 돌봄", ask: "세수·목욕·식사·이동·화장실 중 도와드린 것과 몇 분 했는지", say: "오늘 어르신 몸 돌봄은 무엇을 도와드렸고, 몇 분 정도 하셨나요?", found: phys.length ? [...phys, mins(p.minutes)] : [] },
    { title: "말벗·인지활동", ask: "이야기 나누기·노래·사진 보기 같은 것과 몇 분 했는지", say: "어르신과 이야기 나누기나 노래 같은 활동을 하셨나요? 몇 분 정도 하셨나요?", found: cog },
    { title: "집안일·외출", ask: "식사 준비·청소·빨래·외출 동행과 몇 분 했는지", say: "식사 준비나 청소, 빨래, 외출 동행을 하셨나요? 몇 분 정도 하셨나요?", found: hh.length ? [...hh, mins(r.household.minutes)] : [] },
    { title: "지난번과 달라진 점", ask: "몸·식사·기억이 지난번보다 좋아졌는지, 비슷한지, 나빠졌는지", say: "어르신 몸, 식사, 기억은 지난번보다 좋아지셨나요, 비슷하셨나요, 나빠지셨나요?", found: ch },
    { title: "대소변", ask: "대변·소변 실수가 몇 번 있었는지, 없었는지", say: "오늘 대변이나 소변 실수가 있었나요? 있었다면 몇 번이었나요?", found: bowel },
    { title: "특이사항", ask: "평소와 달랐던 점 → 어떻게 도와드렸는지 → 누구에게 알렸는지 (예: 점심 반 공기 드시다 기침 두 번 하셔서 천천히 드시게 도와드렸고, 따님께 전화로 알렸어요)", say: "평소와 다른 점이 있었나요? 있었다면 어떻게 도와드렸고 누구에게 알렸는지도 말씀해 주세요.", found: r.notes ? [r.notes] : [] },
  ];
}

// 질문을 소리로 읽는다. 브라우저에 없으면 글로만 보여 준다. 아이폰은 누른 순간에 불러야 소리가 나서 클릭 처리 안에서만 부른다
// 아이폰은 무음 스위치가 켜져 있으면 읽기 소리가 안 난다. iOS 17+ Safari는 audioSession을 "playback"으로 바꾸면 소리가 난다
type AudioSessionLike = { type: string };
function setAudioSession(type: "playback" | "auto") {
  const as = (navigator as Navigator & { audioSession?: AudioSessionLike }).audioSession;
  if (as) as.type = type;
}
// status: 읽기가 시작됐는지·끝났는지·실패했는지 화면에 보여 준다 (소리가 안 날 때 원인을 가르려고)
function speak(text: string, status: (s: string) => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return status("이 브라우저는 소리로 읽기를 지원하지 않아요.");
  const tts = window.speechSynthesis;
  setAudioSession("playback");
  // 아이폰 Safari는 cancel() 바로 뒤의 speak()를 버린다. 읽고 있을 때만 멈춘다
  if (tts.speaking || tts.pending) tts.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "ko-KR";
  const ko = tts.getVoices().find((v) => v.lang.replace("_", "-").startsWith("ko"));
  if (ko) u.voice = ko;
  u.volume = 1;
  u.onstart = () => status("읽는 중…");
  u.onend = () => status("다 읽었어요.");
  u.onerror = (e) => status(`소리를 내지 못했어요 (${e.error})`);
  status(`읽기 준비 중… (한국어 목소리 ${ko ? "있음" : "없음"})`);
  tts.speak(u);
}
function hush() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  if (typeof window !== "undefined") setAudioSession("auto"); // 마이크를 쓰려면 원래대로
}

function formatTime(sec: number) {
  return `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
}

export function RecordScreen({
  visitId,
  clientName,
  initialTranscript,
  saved,
  edited,
  showSample,
}: {
  visitId: string;
  clientName: string;
  initialTranscript: string;
  saved: CareRecord | null; // "더 말하기"로 돌아왔을 때 이미 정리·확인한 기록
  edited: boolean;
  showSample: boolean; // 체험 계정만 "예시 내용 넣기"를 보여 준다
}) {
  const router = useRouter();
  const [transcript, setTranscript] = useState(initialTranscript);
  const [saveError, setSaveError] = useState("");
  const [finishing, setFinishing] = useState(false);
  const typingTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // DB에 저장. 실패해도 화면의 글은 남기고 알려 준다
  function persist(text: string) {
    saveTranscript(visitId, text).then(
      () => setSaveError(""),
      () => setSaveError("저장하지 못했어요. 인터넷 연결을 확인해 주세요. 적은 내용은 화면에 남아 있어요."),
    );
  }
  const [typing, setTyping] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // 녹음 앱으로 미리 녹음한 파일을 글로 바꿔 녹음 내용 뒤에 붙인다 (옛 화면과 같은 /transcribe, 4MB까지. 더 긴 파일은 STB-4)
  async function uploadAudio(file: File) {
    setUploadError("");
    if (file.size > MAX_AUDIO_UPLOAD_BYTES) {
      setUploadError(AUDIO_TOO_LARGE_MESSAGE);
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("audio", file);
      const res = await fetch(`/api/visits/${visitId}/transcribe`, { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.text) throw new Error(data.error || "음성 파일을 글로 바꾸지 못했어요. 다시 시도해 주세요.");
      const next = (transcript + " " + data.text).trim();
      setTranscript(next);
      persist(next);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "음성 파일을 글로 바꾸지 못했어요. 다시 시도해 주세요.");
    } finally {
      setUploading(false);
    }
  }

  const speech = useSpeech((text) => {
    setTranscript((prev) => {
      const next = (prev + " " + text).trim();
      persist(next); // 문장마다 바로 저장 (D-27)
      return next;
    });
  });

  useEffect(() => {
    if (!speech.recording) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [speech.recording]);

  const shown = (transcript + " " + speech.interim).trim();
  // 인식 중인 글자까지 넣으면 칸이 흔들려서, 인식이 끝난 문장으로만 채운다
  // 더 말하기로 돌아왔으면 기록 확인에서 고친 값도 보여 준다. 다시 정리할 때(summarizeVisit)와 같은 규칙으로 합친다
  const live = extractRecord(transcript).record;
  const sections = guide(saved ? keepFilled(saved, live, edited) : live);
  const resumed = transcript.length > 0 && !speech.recording;
  // D-51 "다 말했어요" 뒤 빠진 칸을 하나씩 소리로 묻는다. 답은 녹음 내용 끝에 붙어 AI 정리에 그대로 들어간다
  // shortcut: 빠진 칸은 낱말 찾기 기준이라 AI라면 찾았을 칸도 물을 수 있다, 질문이 헛돌면 AI 정리 뒤에 묻도록 옮긴다
  const [questions, setQuestions] = useState<{ title: string; say: string }[] | null>(null);
  const [qi, setQi] = useState(0);
  const [ttsStatus, setTtsStatus] = useState("");
  useEffect(() => hush, []); // 화면을 떠나면 읽던 질문을 멈춘다

  function askAt(list: { title: string; say: string }[], i: number) {
    if (speech.recording) speech.stop();
    if (i >= list.length) {
      hush();
      setQuestions(null);
      finish();
      return;
    }
    setQuestions(list);
    setQi(i);
    speak(list[i].say, setTtsStatus);
  }

  function onDone() {
    const left = sections.filter((s) => !s.found.length || s.found.includes(mins(null)));
    if (questions === null && left.length) askAt(left, 0);
    else finish();
  }

  async function finish() {
    if (speech.recording) speech.stop();
    // 글로 쓴 뒤 0.8초 안에 누르면 늦게 저장된 글이 상태를 다시 "녹음 중"으로 돌린다. finishRecording이 같은 글을 저장한다
    clearTimeout(typingTimer.current);
    setFinishing(true);
    try {
      await finishRecording(visitId, transcript);
      router.push(`/v1120/visit/${visitId}/processing`);
    } catch {
      setSaveError("저장하지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요.");
      setFinishing(false);
    }
  }

  return (
    <Screen
      bottom={
        !speech.recording &&
        transcript && (
          (questions ? (
            <div className="flex flex-col gap-2">
              <Button onClick={() => askAt(questions, qi + 1)} disabled={finishing}>
                {qi + 1 < questions.length ? "다음 질문" : "다 답했어요: AI로 정리하기"}
              </Button>
              <Button variant="secondary" onClick={() => askAt(questions, questions.length)} disabled={finishing}>
                그만 묻고 정리하기
              </Button>
            </div>
          ) : (
            <Button onClick={onDone} disabled={finishing}>
              다 말했어요: AI로 정리하기
            </Button>
          ))
        )
      }
    >
      <TopBar backHref="/v1120" title={`${clientName} 기록`} />

      {questions ? (
        <div className="flex flex-col gap-2 rounded-[15px] border-2 border-accent p-4" aria-live="polite">
          <p className="text-base font-bold text-muted">
            빠진 내용을 여쭤볼게요 ({qi + 1}/{questions.length}) · {questions[qi].title}
          </p>
          <p className="text-xl font-bold">{questions[qi].say}</p>
          <button type="button" className="self-start text-base font-bold underline underline-offset-4" onClick={() => speak(questions[qi].say, setTtsStatus)}>
            🔊 다시 듣기
          </button>
          {ttsStatus && <p className="text-base text-muted">{ttsStatus}</p>}
          <p className="text-base text-muted">아래 녹음을 눌러 답해 주세요. 없으면 &quot;다음 질문&quot;을 눌러요.</p>
        </div>
      ) : (
        <>
          <p className="text-xl font-bold">
            {speech.recording ? "듣고 있어요. 편하게 계속 말씀하세요." : "오늘 돌봄 내용을 편하게 말씀해 주세요."}
          </p>

          <p className="-mt-3 text-lg text-muted">아래 순서대로 하나씩 말하면 칸이 채워져요. 순서는 바뀌어도 괜찮아요.</p>
        </>
      )}

      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={speech.recording ? speech.stop : () => (hush(), speech.start())}
          disabled={speech.supported === false}
          className={`flex h-40 w-40 items-center justify-center rounded-full bg-record text-2xl font-bold text-white disabled:opacity-40 ${
            speech.recording ? "ring-[14px] ring-record/25" : ""
          }`}
        >
          {speech.recording ? "끝내기" : "녹음"}
        </button>
        {speech.recording ? (
          <>
            <p className="flex items-center gap-2 text-xl font-bold">
              <span className="h-4 w-4 animate-pulse rounded-full bg-record" />
              녹음 중 {formatTime(seconds)}
            </p>
            <p className="text-lg font-bold">눌러서 끝내기</p>
          </>
        ) : (
          <>
            <p className="text-xl font-bold">{resumed ? "눌러서 이어서 녹음" : "눌러서 녹음"}</p>
            <p className="text-base text-muted">말을 다 하면 한 번 더 눌러 끝내요</p>
          </>
        )}
        {speech.supported === false && (
          <p className="text-base text-muted">이 브라우저는 음성 인식이 안 돼요. 아래 &quot;글로 쓰기&quot;를 눌러 주세요.</p>
        )}
        {speech.error && <p className="text-base font-bold text-(--danger)">{speech.error}</p>}
        {saveError && <p className="text-base font-bold text-(--danger)">{saveError}</p>}
      </div>

      <div className="flex flex-col gap-1 rounded-[15px] border border-border p-4">
        <p className="text-base font-bold text-muted">녹음 내용</p>
        {typing ? (
          <textarea
            className="min-h-32 w-full resize-y text-lg outline-none"
            value={transcript}
            placeholder="오늘 한 일을 적어 주세요."
            onChange={(e) => {
              const text = e.target.value;
              setTranscript(text);
              // 글자마다 저장하지 않고 잠깐 멈췄을 때 저장
              clearTimeout(typingTimer.current);
              typingTimer.current = setTimeout(() => persist(text), 800);
            }}
          />
        ) : shown ? (
          <p className="text-lg">
            {transcript} <span className="text-muted">{speech.interim}</span>
            {speech.recording && <span className="text-base text-muted"> 듣는 중…</span>}
          </p>
        ) : (
          <>
            <p className="text-lg text-muted">녹음을 시작하면 여기에 글자로 적혀요.</p>
            {/* 체험 계정용: 마이크 없이 흐름을 보려고 예시 내용을 넣는다 */}
            {showSample && (
              <button
                type="button"
                className="mt-1 self-start text-base font-bold text-accent-soft-foreground underline underline-offset-4"
                onClick={() => {
                  setTranscript(sampleTranscript);
                  persist(sampleTranscript);
                }}
              >
                미리보기: 예시 내용 넣기
              </button>
            )}
          </>
        )}
      </div>

      <ol className="flex flex-col gap-2">
        {sections.map((sec, i) => {
          const done = sec.found.length > 0;
          return (
            <li key={sec.title} className={`rounded-xl border p-3 ${done ? "border-(--success) bg-(--success-soft)" : "border-border"}`}>
              <p className="flex items-center gap-2 text-lg font-bold">
                <span className={done ? "text-(--text-success)" : "text-muted"}>{done ? "✓" : `${i + 1}`}</span>
                {sec.title}
              </p>
              {done ? (
                <p className="text-lg">{sec.found.join(" · ")}</p>
              ) : (
                <p className="text-base text-muted">{sec.ask}</p>
              )}
            </li>
          );
        })}
      </ol>
      <p className="-mt-3 text-base text-muted">
        {saved
          ? "기록 확인에서 고친 내용도 위 칸에 함께 보여요. 녹음 내용에는 말한 것만 있어요."
          : "빠진 칸은 다음 화면에서 직접 채울 수 있어요."}
      </p>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" disabled={speech.recording} onClick={() => setTyping(true)}>
          글로 쓰기
        </Button>
        <Button variant="secondary" disabled={speech.recording || uploading} onClick={() => fileInput.current?.click()}>
          {uploading ? "글로 바꾸는 중…" : "음성 파일 올리기"}
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) uploadAudio(file);
          }}
        />
      </div>
      <p className={`-mt-3 text-base ${uploadError ? "text-(--text-danger)" : "text-muted"}`} role={uploadError ? "alert" : undefined}>
        {speech.recording
          ? "녹음을 끝내면 글로 쓰기·음성 파일 올리기를 쓸 수 있어요."
          : uploadError || "휴대폰 녹음 앱으로 녹음한 파일을 올리면 글로 바꿔 드려요."}
      </p>
    </Screen>
  );
}
