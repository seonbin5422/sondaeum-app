// 녹음 글(받아쓰기) 정확도: cases.json 녹음 글을 TTS 음성으로 만들고, 앱의 '음성 파일 올리기'와 같은 Groq whisper로 받아써 원문과 비교한다.
//   npx tsx --tsconfig tsconfig.json --env-file=.env.local scripts/ai-eval/stt.mts --only 23,26,27
//   ... stt.mts --voice ko-KR-InJoonNeural   목소리 바꾸기 (기본 ko-KR-SunHiNeural)
// shortcut: TTS는 표준어 억양으로 읽어서 실제 사투리 화자보다 쉽다. 실제 녹음 파일이 생기면 audio/에 같은 이름으로 넣어 돌린다.
// 크롬 실시간 받아쓰기(Web Speech, 녹음 화면 기본)는 여기서 못 잰다 — 브라우저에서 따로 확인.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { appendFileSync, createReadStream, existsSync, mkdirSync, readFileSync } from "node:fs";
import Groq from "groq-sdk";

type Case = { id: string; input: string };

// 띄어쓰기·문장부호는 빼고 글자만 비교한다
const chars = (t: string) => [...t.replace(/[\s.,!?~·'"“”‘’…()-]/g, "")];
export function cer(ref: string, hyp: string) {
  const a = chars(ref), b = chars(hyp);
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return a.length ? prev[b.length] / a.length : 0;
}
// 원문 낱말 중 받아쓴 글에 그대로 없는 것 (사투리 낱말이 바뀌었는지 보려고)
export const lost = (ref: string, hyp: string) => {
  const h = chars(hyp).join("");
  return ref.split(/\s+/).map((w) => chars(w).join("")).filter((w) => w && !h.includes(w));
};
assert.equal(cer("밥 다 드심", "밥다드심."), 0);
assert.equal(cer("지팽이", "지팡이"), 1 / 3);
assert.deepEqual(lost("지팽이 없이 나감", "지팡이 없이 나감"), ["지팽이"]);

const args = process.argv.slice(2);
const arg = (n: string) => (args.includes(n) ? args[args.indexOf(n) + 1] : undefined);
const voice = arg("--voice") ?? "ko-KR-SunHiNeural";
const all: Case[] = JSON.parse(readFileSync(new URL("./cases.json", import.meta.url), "utf8"));
const only = arg("--only")?.split(",").map((s) => s.padStart(2, "0"));
const cases = only ? all.filter((c) => only.some((o) => c.id.startsWith(o))) : all;

const AUDIO = new URL("./audio/", import.meta.url);
mkdirSync(AUDIO, { recursive: true });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY?.trim() });
const RESULTS = new URL("./stt-results.jsonl", import.meta.url);

const rows = [];
for (const c of cases) {
  const file = new URL(`${c.id}.${voice}.mp3`, AUDIO).pathname;
  if (!existsSync(file)) execFileSync("uvx", ["edge-tts", "--voice", voice, "--text", c.input, "--write-media", file], { stdio: "ignore" });
  const t = await groq.audio.transcriptions.create({ file: createReadStream(file), model: "whisper-large-v3-turbo", language: "ko", response_format: "json" });
  const row = { at: new Date().toISOString(), id: c.id, voice, model: "whisper-large-v3-turbo", cer: +cer(c.input, t.text).toFixed(3), lost: lost(c.input, t.text), input: c.input, text: t.text.trim() };
  appendFileSync(RESULTS, JSON.stringify(row) + "\n");
  rows.push(row);
  console.log(`${row.cer === 0 ? "✓" : "✗"} ${c.id} 글자 오류 ${Math.round(row.cer * 100)}%${row.lost.length ? `  바뀐 낱말: ${row.lost.join(", ")}\n    → ${row.text}` : ""}`);
}
const avg = rows.reduce((n, r) => n + r.cer, 0) / (rows.length || 1);
console.log(`\n${rows.length}개 · 평균 글자 오류율 ${(avg * 100).toFixed(1)}% · 그대로 받아쓴 사례 ${rows.filter((r) => r.cer === 0).length}개`);
