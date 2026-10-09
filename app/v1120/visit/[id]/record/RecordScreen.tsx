"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Screen, TopBar } from "../../../_components/ui";
import { useSpeech } from "../../../_components/useSpeech";
import { loadDraft, saveDraft } from "../../../_store";
import { sampleTranscript } from "../../../_mock";

// 말한 내용에 이 낱말이 나오면 그 기록지 항목을 "말함"으로 본다. 화면 안내용이고, 실제 정리는 AI가 한다.
const ITEMS: { label: string; words: RegExp }[] = [
  { label: "신체활동", words: /세면|세수|옷|식사|밥|이동|산책|목욕|씻|체위|화장실/ },
  { label: "인지·정서", words: /말벗|이야기|대화|사진|인지|노래|격려/ },
  { label: "가사·일상", words: /청소|빨래|세탁|설거지|식사 ?준비|장보|정리/ },
  { label: "변화상태", words: /좋아|나빠|비슷|호전|악화|달라|지난번/ },
  { label: "배변 변화", words: /대변|소변|변을|기저귀|실수/ },
  { label: "특이사항", words: /혈압|약|아프|통증|넘어|열/ },
];

function formatTime(sec: number) {
  return `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
}

export function RecordScreen({ visitId, clientName }: { visitId: string; clientName: string }) {
  const router = useRouter();
  const [transcript, setTranscript] = useState("");
  const [typing, setTyping] = useState(false);
  const [seconds, setSeconds] = useState(0);

  const speech = useSpeech((text) => {
    setTranscript((prev) => {
      const next = (prev + " " + text).trim();
      saveDraft(visitId, { transcript: next }); // 문장마다 바로 저장 (D-27)
      return next;
    });
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- restore the saved transcript from sessionStorage on mount
    setTranscript(loadDraft(visitId).transcript);
  }, [visitId]);

  useEffect(() => {
    if (!speech.recording) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [speech.recording]);

  const shown = (transcript + " " + speech.interim).trim();
  const said = ITEMS.map((it) => ({ ...it, done: it.words.test(shown) }));
  const resumed = transcript.length > 0 && !speech.recording;

  function finish() {
    if (speech.recording) speech.stop();
    saveDraft(visitId, { transcript });
    router.push(`/v1120/visit/${visitId}/processing`);
  }

  return (
    <Screen
      bottom={
        !speech.recording &&
        transcript && <Button onClick={finish}>다 말했어요: AI로 정리하기</Button>
      }
    >
      <TopBar backHref="/v1120" title={`${clientName} 어르신 기록`} />

      <p className="text-xl font-bold">
        {speech.recording ? "듣고 있어요. 편하게 계속 말씀하세요." : "오늘 돌봄 내용을 편하게 말씀해 주세요."}
      </p>

      <div className="rounded-xl bg-(--neutral-soft) px-4 py-3">
        <p className="text-base font-bold text-muted">이렇게 말해 보세요</p>
        <p className="text-lg">한 일(세면·식사도움·이동), 걸린 시간(말벗 30분), 대소변 실수 횟수, 지난번과 달라진 점</p>
      </div>

      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={speech.recording ? speech.stop : speech.start}
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
      </div>

      <div className="flex flex-col gap-1 rounded-[15px] border border-border p-4">
        <p className="text-base font-bold text-muted">녹음 내용</p>
        {typing ? (
          <textarea
            className="min-h-32 w-full resize-y text-lg outline-none"
            value={transcript}
            placeholder="오늘 한 일을 적어 주세요."
            onChange={(e) => {
              setTranscript(e.target.value);
              saveDraft(visitId, { transcript: e.target.value });
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
            {/* 1120.ver 미리보기용: 마이크 없이 흐름을 보려고 예시 내용을 넣는다 */}
            <button
              type="button"
              className="mt-1 self-start text-base font-bold text-accent-soft-foreground underline underline-offset-4"
              onClick={() => {
                setTranscript(sampleTranscript);
                saveDraft(visitId, { transcript: sampleTranscript });
              }}
            >
              미리보기: 예시 내용 넣기
            </button>
          </>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-base font-bold">급여제공기록지 항목</p>
        <p className="text-base text-muted">말한 항목은 초록 ✓로 바뀌어요. 빠진 항목은 다음 화면에서 채워요.</p>
        <div className="flex flex-wrap gap-2">
          {said.map((it) => (
            <span
              key={it.label}
              className={`rounded-full px-3 py-1 text-base font-bold ${
                it.done ? "bg-(--success-soft) text-(--success) ring-1 ring-(--success)" : "border border-border"
              }`}
            >
              {it.done ? `✓ ${it.label}` : it.label}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" disabled={speech.recording} onClick={() => setTyping(true)}>
          글로 쓰기
        </Button>
        <Button variant="secondary" disabled>
          음성 파일 올리기
        </Button>
      </div>
      <p className="-mt-3 text-base text-muted">
        {speech.recording
          ? "녹음을 끝내면 글로 쓰기·음성 파일 올리기를 쓸 수 있어요."
          : "음성 파일 올리기는 1120.ver에서 아직 준비 중이에요."}
      </p>
    </Screen>
  );
}
