// DIF-7 AI 정리 품질 평가: cases.json의 녹음 글을 실제 AI(fillRecord)에 넣고 정답과 비교해 채점한다.
//   npx tsx --tsconfig tsconfig.json --env-file=.env.local scripts/ai-eval/run.mts            사례마다 1번
//   ... run.mts --runs 3                 사례마다 3번 (AI 결과가 실행마다 달라서 발표 숫자는 3번 평균으로)
//   ... run.mts --only 17,18             몇 개만
//   ... run.mts --resume                 지금 지시문으로 아직 안 돌린 사례만 (하루 한도에 걸려 멈췄을 때 이어서)
//   ... run.mts --pairs                  AI 없이 입력 → 모범 특이사항 예시 쌍을 표로 출력
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import type { CareRecord } from "../../app/v1120/_types";

type Alt = string | string[]; // 배열이면 그중 하나만 있으면 됨
type Case = {
  id: string;
  about: string;
  input: string;
  expect?: Record<string, unknown>; // "household.minutes": 45, 배열이면 그중 하나
  notesMust?: Alt[];
  notesMustNot?: string[];
  guardianMust?: Alt[];
  example: string | null; // 모범 특이사항(기록지 말투). 예시 쌍으로 쓴다
};

// 모든 사례에 걸리는 금지 (LAW-1: 진단·판단 낱말, 특이사항은 '~함' 말투, 보호자 글에서 요양보호사를 높이지 않음)
const NOTES_BANNED = ["의심", "위험", "필요", "진단"];
const GUARDIAN_BANNED = ["확인하셨어요", "드리셨어요", "전달하셨어요", "알려드리셨", "도와주셨어요"];

const squash = (t: string) => t.replace(/\s+/g, "");
const has = (text: string, a: Alt) => (Array.isArray(a) ? a : [a]).some((w) => squash(text).includes(squash(w)));
const show = (a: Alt) => (Array.isArray(a) ? a.join("|") : a);
const get = (r: CareRecord, path: string) => path.split(".").reduce<unknown>((o, k) => (o as Record<string, unknown> | null)?.[k], r);

// 한 사례의 결과를 채점한다. fields = 맞은 칸/정답 칸, must = 들어간 사실/꼭 들어갈 사실, problems = 틀린 이유
export function score(c: Case, r: CareRecord) {
  const problems: string[] = [];
  const fieldKeys = Object.keys(c.expect ?? {});
  let fieldsOk = 0;
  for (const k of fieldKeys) {
    const want = c.expect![k];
    const got = get(r, k) ?? null;
    if ((Array.isArray(want) ? want : [want]).includes(got)) fieldsOk++;
    else problems.push(`${k}: ${JSON.stringify(got)} (정답 ${JSON.stringify(want)})`);
  }
  const notes = r.notes ?? "";
  const guardian = r.guardianNotes ?? "";
  const must = c.notesMust ?? [];
  let mustOk = 0;
  for (const a of must) {
    if (has(notes, a)) mustOk++;
    else problems.push(`특이사항에 빠짐: ${show(a)}`);
  }
  for (const w of [...NOTES_BANNED, ...(c.notesMustNot ?? [])]) if (has(notes, w)) problems.push(`특이사항에 들어가면 안 됨: ${w}`);
  if (/요\s*(\.|$)/m.test(notes)) problems.push("특이사항이 '~요'로 끝남");
  for (const a of c.guardianMust ?? []) if (guardian && !has(guardian, a)) problems.push(`보호자 글에 빠짐: ${show(a)}`);
  for (const w of GUARDIAN_BANNED) if (has(guardian, w)) problems.push(`보호자 글에서 요양보호사를 높임: ${w}`);
  return { fieldsOk, fields: fieldKeys.length, mustOk, must: must.length, problems };
}

// 채점 자체가 맞는지 먼저 확인
{
  const blank = { physical: {}, cognitive: {}, household: { minutes: 45 }, change: {}, bowel: {}, physicalNote: null, notes: "기침 2회 보임. 보호자에게 전달함.", guardianNotes: "요양보호사가 확인하셨어요." } as unknown as CareRecord;
  const s = score({ id: "t", about: "", input: "", example: null, expect: { "household.minutes": 45, "physical.bathing": [null, false] }, notesMust: [["두번", "2회"], "혈압"], notesMustNot: ["우측"] }, blank);
  assert.deepEqual([s.fieldsOk, s.fields, s.mustOk, s.must], [2, 2, 1, 2]);
  assert.deepEqual(s.problems, ["특이사항에 빠짐: 혈압", "보호자 글에서 요양보호사를 높임: 확인하셨어요"]);
}

const args = process.argv.slice(2);
const arg = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const all: Case[] = JSON.parse(readFileSync(new URL("./cases.json", import.meta.url), "utf8"));
const only = arg("--only")?.split(",").map((s) => s.padStart(2, "0"));
const cases = only ? all.filter((c) => only.some((o) => c.id.startsWith(o))) : all;

if (args.includes("--pairs")) {
  console.log("| 번호 | 요양보호사가 한 말 | 특이사항 (기록지) |\n| --- | --- | --- |");
  for (const c of all.filter((c) => c.example)) console.log(`| ${c.id.slice(0, 2)} | ${c.input} | ${c.example} |`);
  process.exit(0);
}

const runs = Number(arg("--runs") ?? 1);

// 결과는 results.jsonl에 한 줄씩 쌓는다. 지시문(_ai.ts)과 사례 내용이 같으면 같은 결과로 본다.
// --resume: 지금 지시문으로 이미 채점한 사례·회차는 건너뛰고 남은 것만 돌린다 (무료 키 하루 한도 때문에 며칠에 나눠 돌림)
const RESULTS = new URL("./results.jsonl", import.meta.url);
const sha = (t: string) => createHash("sha1").update(t).digest("hex").slice(0, 8);
const version = sha(readFileSync(new URL("../../app/v1120/_ai.ts", import.meta.url), "utf8"));
type Row = { at: string; version: string; id: string; caseHash: string; run: number; passed: boolean; fieldsOk: number; fields: number; mustOk: number; must: number; problems: string[] };
const saved: Row[] = existsSync(RESULTS)
  ? readFileSync(RESULTS, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l))
  : [];
const key = (c: Case, run: number) => `${version}|${c.id}|${sha(JSON.stringify(c))}|${run}`;
const done = new Map(saved.map((r) => [`${r.version}|${r.id}|${r.caseHash}|${r.run}`, r]));
const resume = args.includes("--resume");
const todo = cases.flatMap((c) => Array.from({ length: runs }, (_, i) => ({ c, run: i + 1 }))).filter(({ c, run }) => !resume || !done.has(key(c, run)));
console.log(`지시문 버전 ${version} · 이번에 돌릴 것 ${todo.length}개${resume ? ` (이미 한 것 ${cases.length * runs - todo.length}개 건너뜀)` : ""}`);

const { fillRecord } = await import("../../app/v1120/_ai");

// 무료 키는 분당 토큰 한도가 있어서 막히면 기다렸다 다시 한다
async function fill(input: string) {
  for (let i = 0; ; i++) {
    try {
      return (await fillRecord(input)).record;
    } catch (e) {
      // 하루 한도(TPD)는 기다려도 안 풀리니 바로 멈춘다
      if (i >= 4 || /per day|TPD/.test((e as Error).message)) throw e;
      const wait = 20 * (i + 1);
      console.log(`  (AI 호출 실패: ${(e as Error).message.slice(0, 60)}… ${wait}초 뒤 다시)`);
      await new Promise((r) => setTimeout(r, wait * 1000));
    }
  }
}

let stopped = "";
for (const { c, run } of todo) {
  let r;
  try {
    r = await fill(c.input);
  } catch (e) {
    stopped = `${c.id}에서 멈춤 (다음에 --resume으로 여기부터): ${(e as Error).message.slice(0, 120)}`;
    break;
  }
  const s = score(c, r);
  if (s.problems.length) s.problems.push(`→ 특이사항: ${r.notes ?? "(없음)"}`);
  const row: Row = { at: new Date().toISOString(), version, id: c.id, caseHash: sha(JSON.stringify(c)), run, passed: !s.problems.length, fieldsOk: s.fieldsOk, fields: s.fields, mustOk: s.mustOk, must: s.must, problems: s.problems };
  appendFileSync(RESULTS, JSON.stringify(row) + "\n");
  done.set(key(c, run), row);
  console.log(`${row.passed ? "✓" : "✗"} ${c.id}${runs > 1 ? ` #${run}` : ""}${row.passed ? "" : `\n    ${s.problems.join("\n    ")}`}`);
}

// 점수는 고른 사례 전체를 지금 지시문 기준으로 낸다 (지난번에 돌린 것도 포함)
const rows = cases.flatMap((c) => Array.from({ length: runs }, (_, i) => done.get(key(c, i + 1)))).filter((r): r is Row => !!r);
const sum = (f: (r: Row) => number) => rows.reduce((n, r) => n + f(r), 0);
const banned = sum((r) => r.problems.filter((p) => p.includes("안 됨") || p.includes("높임") || p.includes("~요")).length);
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}% (${a}/${b})` : "-");
if (stopped) console.log(`\n${stopped}`);
console.log(`
채점된 것        ${rows.length}/${cases.length * runs}
사례 통과        ${pct(sum((r) => +r.passed), rows.length)}
칸 정확도        ${pct(sum((r) => r.fieldsOk), sum((r) => r.fields))}
특이사항 포함률  ${pct(sum((r) => r.mustOk), sum((r) => r.must))}
금지 표현        ${banned}번`);
