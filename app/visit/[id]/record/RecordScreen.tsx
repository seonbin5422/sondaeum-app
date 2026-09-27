"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/Button";
import { Card } from "@/app/components/ui/Card";
import { PageHeader } from "@/app/components/ui/PageHeader";
import {
  MAX_AUDIO_UPLOAD_BYTES,
  AUDIO_TOO_LARGE_MESSAGE,
} from "@/lib/audioUpload";

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}
interface SpeechRecognitionErrorEventLike {
  error: string;
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

const FATAL_SPEECH_ERRORS = new Set([
  "not-allowed",
  "service-not-allowed",
  "audio-capture",
]);

const NOTE_GUIDE =
  "건강상태, 혈압, 배뇨, 배변, 식사, 복약, 특이사항 등 중요한 내용을 적거나 녹음해주세요.";
const NOTE_PLACEHOLDER =
  "예: 혈압 128/82, 소변 정상, 대변 없음, 점심 잘 드심, 혈압약 복용 확인, 특이사항 없음";

function buildTranscript(note: string, voiceTranscript: string): string {
  const sections = [];
  if (note.trim()) sections.push(note.trim());
  if (voiceTranscript.trim())
    sections.push(`[음성 녹음 전문]\n${voiceTranscript.trim()}`);
  return sections.join("\n\n");
}

function appendTranscript(prev: string, incoming: string): string {
  const trimmed = incoming.trim();
  if (!trimmed) return prev;
  return prev ? `${prev}\n\n${trimmed}` : trimmed;
}

export function RecordScreen({
  visitId,
  clientName,
}: {
  visitId: string;
  clientName: string;
}) {
  const router = useRouter();
  const [supported, setSupported] = useState<boolean | null>(null);
  const [recording, setRecording] = useState(false);
  const [note, setNote] = useState("");
  const [finalText, setFinalText] = useState("");
  const [interimText, setInterimText] = useState("");
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [classifying, setClassifying] = useState(false);
  const [classifyError, setClassifyError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const [transcribeError, setTranscribeError] = useState<string | null>(null);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const keepRecordingRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const w = window as unknown as {
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
      SpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time browser feature detection, unavailable during SSR
    setSupported(!!Ctor);
  }, []);

  function createRecognition(): SpeechRecognitionLike | null {
    const w = window as unknown as {
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
      SpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) return null;

    const recognition = new Ctor();
    recognition.lang = "ko-KR";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          setFinalText((prev) => (prev + " " + result[0].transcript).trim());
        } else {
          interim += result[0].transcript;
        }
      }
      setInterimText(interim);
    };
    recognition.onerror = (event) => {
      setInterimText("");
      if (event.error === "no-speech") return;
      keepRecordingRef.current = false;
      setSpeechError(
        FATAL_SPEECH_ERRORS.has(event.error)
          ? "마이크 권한이 꺼져 있어요. 브라우저(또는 기기) 설정에서 마이크 권한을 허용한 뒤 다시 시도해주세요."
          : "음성 인식에 문제가 생겼어요. 다시 시도하거나 음성 파일 업로드를 이용해주세요.",
      );
    };
    recognition.onend = () => {
      setInterimText("");
      if (recognitionRef.current !== recognition) return;
      if (keepRecordingRef.current) {
        const next = createRecognition();
        if (next) {
          recognitionRef.current = next;
          next.start();
          return;
        }
      }
      recognitionRef.current = null;
      setRecording(false);
    };

    return recognition;
  }

  function startRecording() {
    const recognition = createRecognition();
    if (!recognition) return;

    setSpeechError(null);
    keepRecordingRef.current = true;
    recognitionRef.current = recognition;
    recognition.start();
    setRecording(true);
  }

  function appendIfPresent(
    prev: string,
    incoming: string,
    missing: boolean,
  ): string {
    const trimmed = incoming.trim();
    if (missing || !trimmed || trimmed === "특이 언급 없음") return prev;
    return prev ? `${prev}\n${trimmed}` : trimmed;
  }

  async function stopRecording() {
    keepRecordingRef.current = false;
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setRecording(false);

    const voiceText = (finalText + " " + interimText).trim();
    setInterimText("");
    setFinalText("");
    if (!voiceText) return;

    setVoiceTranscript((prev) => appendTranscript(prev, voiceText));

    setClassifying(true);
    setClassifyError(null);
    try {
      const res = await fetch(`/api/visits/${visitId}/classify-preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: voiceText }),
      });
      if (!res.ok) throw new Error();
      const draft = await res.json();
      setNote((prev) => {
        let next = prev;
        next = appendIfPresent(next, draft.meals, draft.mealsMissing);
        next = appendIfPresent(next, draft.medication, draft.medicationMissing);
        next = appendIfPresent(next, draft.notes, draft.notesMissing);
        return next;
      });
    } catch {
      setClassifyError(
        "자동 분류에 실패했어요. 녹음 내용은 음성 녹음 전문에 그대로 저장되니, 필요하면 직접 입력해주세요.",
      );
    } finally {
      setClassifying(false);
    }
  }

  async function handleAudioFile(file: File) {
    setTranscribeError(null);
    if (file.size > MAX_AUDIO_UPLOAD_BYTES) {
      setTranscribeError(AUDIO_TOO_LARGE_MESSAGE);
      return;
    }

    setTranscribing(true);
    try {
      const formData = new FormData();
      formData.append("audio", file);
      const res = await fetch(`/api/visits/${visitId}/transcribe`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "업로드에 실패했습니다.");
      }
      const { text } = await res.json();
      setVoiceTranscript((prev) => appendTranscript(prev, text));
    } catch (e) {
      setTranscribeError(
        e instanceof Error ? e.message : "업로드에 실패했습니다.",
      );
    } finally {
      setTranscribing(false);
    }
  }

  function onFileInputChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) handleAudioFile(file);
  }

  async function finishVisit() {
    setSubmitting(true);
    setSubmitError(null);
    const transcript = buildTranscript(note, voiceTranscript);
    try {
      const res = await fetch(`/api/visits/${visitId}/stop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "저장에 실패했습니다.");
      }
      router.push(`/visit/${visitId}/processing`);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "저장에 실패했습니다.");
      setSubmitting(false);
    }
  }

  const hasContent =
    note.trim().length > 0 || voiceTranscript.trim().length > 0;

  return (
    <>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 p-6 pb-28">
        <PageHeader title={`기록(${clientName})`} backHref="/" />

        <div>
          <h1 className="text-xl font-semibold">요양 노트 작성</h1>
          <p className="mt-1 text-lg">{NOTE_GUIDE}</p>
        </div>

        {supported === false && (
          <Card className="bg-amber-50 border-amber-200 text-amber-800 text-base">
            이 브라우저는 음성 인식을 지원하지 않습니다. 음성 파일을
            업로드하거나 아래 항목에 직접 입력해주세요.
          </Card>
        )}

        <div className="relative flex flex-col gap-5">
          <label className="flex flex-col gap-2 text-lg text-muted">
            돌봄 기록
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={NOTE_PLACEHOLDER}
              className="min-h-40 resize-none rounded-[15px] border border-border bg-card px-4 py-3 text-lg text-foreground"
            />
          </label>

          {(recording || classifying) && (
            <div className="absolute inset-0 z-10 overflow-y-auto rounded-[15px] border border-accent bg-accent-soft p-4">
              {classifying ? (
                <p className="text-lg leading-relaxed text-accent-soft-foreground">
                  AI가 각 항목으로 정리하고 있어요...
                </p>
              ) : finalText || interimText ? (
                <p className="text-lg leading-relaxed">
                  {finalText} <span className="text-muted">{interimText}</span>
                </p>
              ) : (
                <p className="text-lg leading-relaxed text-muted">
                  말씀해주세요...
                </p>
              )}
            </div>
          )}
        </div>

        <details className="rounded-[15px] border border-border bg-card px-4 py-3 text-base">
          <summary className="cursor-pointer font-semibold text-muted">
            음성 녹음 전문 확인
          </summary>
          <p className="mt-2 whitespace-pre-wrap text-foreground">
            {voiceTranscript.trim() ||
              "아직 녹음되거나 업로드된 음성이 없어요."}
          </p>
        </details>

        {supported === true && (
          <div className="flex justify-center py-2">
            <button
              type="button"
              onClick={recording ? stopRecording : startRecording}
              aria-label={recording ? "녹음 중지" : "녹음 시작"}
              className="flex h-[100px] w-[100px] items-center justify-center rounded-full bg-white shadow-[0px_4px_15px_0px_rgba(0,0,0,0.15)] transition-transform active:scale-95"
            >
              {recording ? (
                <span className="h-12 w-12 rounded-[8px] bg-record" />
              ) : (
                <span className="h-20 w-20 rounded-full bg-record" />
              )}
            </button>
          </div>
        )}

        {speechError && (
          <p className="text-record text-center text-base font-semibold">
            {speechError}
          </p>
        )}

        <div className="flex flex-col items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,.m4a,.mp3,.wav,.aac,.flac,.ogg,.webm"
            className="hidden"
            onChange={onFileInputChange}
          />
          <Button
            type="button"
            variant="secondary"
            className="!h-8"
            onClick={() => fileInputRef.current?.click()}
            disabled={recording || classifying || transcribing || submitting}
          >
            {transcribing ? "음성 파일 인식 중..." : "음성 파일 업로드"}
          </Button>
          <p className="text-muted text-sm">
            휴대폰에 녹음해둔 음성메모 파일도 요약해줘요!
          </p>
        </div>

        {classifyError && (
          <p className="text-record text-base font-semibold">{classifyError}</p>
        )}
        {transcribeError && (
          <p className="text-record text-base font-semibold">
            {transcribeError}
          </p>
        )}
        {submitError && (
          <p className="text-record text-base font-semibold">{submitError}</p>
        )}
      </div>

      <div className="fixed bottom-0 left-0 z-10 w-full bg-background p-6 pt-3">
        <div className="mx-auto w-full max-w-md">
          <Button
            onClick={finishVisit}
            disabled={
              !hasContent ||
              submitting ||
              recording ||
              classifying ||
              transcribing
            }
          >
            {submitting ? "저장 중..." : "AI로 요약하기"}
          </Button>
        </div>
      </div>
    </>
  );
}
