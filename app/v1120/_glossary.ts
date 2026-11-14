import assert from "node:assert/strict";
import dialects from "../../scripts/ai-eval/dialects.json";
import honorifics from "../../scripts/ai-eval/honorifics.json";

// AI가 모르는 사투리·높임말 때문에 말한 사실을 빼거나 다른 뜻으로 옮긴다(11/14: 물팍지→목, 소매→팔, 정심→음료).
// 녹음 글에 사전 낱말이 있으면 표준어 뜻을 함께 보낸다. 지시문에 낱말을 늘어놓지 않고 나온 것만 붙여서 토큰이 거의 늘지 않는다.
// shortcut: 사전은 평가 세트 폴더에 있고 Claude가 지은 것이라 지역 화자 검토가 필요하다. 활용형은 '-다'를 뗀 줄기(2글자 이상)만 찾는다
type Entry = { word: string; meaning: string; dialect?: true };
const ENTRIES: Entry[] = [
  ...dialects.map((e) => ({ word: e.dialect, meaning: e.standard, dialect: true as const })),
  ...honorifics.filter((e) => e.kind === "높임" || e.kind === "완곡").map((e) => ({ word: e.expression, meaning: e.record || e.plain })),
];
// 줄기: '쑤시다'→'쑤시'. 한 글자 줄기('얼다'→'얼')는 다른 말에 너무 많이 걸려서 뺀다
const stem = (w: string) => (w.endsWith("다") ? w.slice(0, -1) : w);
// 표준어 낱말에 그대로 걸리는 줄기는 뺀다: '다리다(체하다)'가 다리(몸)에, '어지(어제)'가 어지럽다에, '계시다'·'어르신'은 뜻풀이가 필요 없음
const STOP = new Set(["다리", "어지", "어르신", "계시", "누워"]);
const INDEX = ENTRIES.map((e) => ({ ...e, key: stem(e.word.split(/\s/)[0]) })).filter((e) => e.key.length >= 2 && !STOP.has(e.key));

export function glossary(input: string, max = 15): string {
  const found = new Map<string, Set<string>>();
  for (const e of INDEX) {
    if (!input.includes(e.key)) continue;
    const m = found.get(e.word) ?? new Set();
    m.add(e.meaning);
    found.set(e.word, m);
  }
  if (!found.size) return "";
  const lines = [...found].slice(0, max).map(([w, m]) => `${w} = ${[...m].join(" / ")}`);
  return `\n\n[참고 사전] 위 녹음 글에 나온 낱말 중 사투리·높임말일 수 있는 것의 뜻이에요. 앞뒤 말과 맞을 때만 이 뜻으로 옮기고, 이 목록은 근거 문장(quotes)으로 쓰지 않습니다.\n${lines.join("\n")}`;
}

// 사전에 뜻을 붙여 보내도 AI가 사투리를 notes에 그대로 옮긴다(11/15 평가: 숭낭·오마니) → 녹음 글과 notes 둘 다에 있는 사투리 줄기
// 높임말은 보호자 글에 그대로 써도 되므로 사투리만 본다
export function copiedDialect(input: string, notes: string): string[] {
  return [...new Set(INDEX.filter((e) => e.dialect && input.includes(e.key) && notes.includes(e.key)).map((e) => e.word))];
}

assert.deepEqual(copiedDialect("오마니 보고 싶다 하시고요", "어르신이 오마니 보고 싶다 하심."), ["오마니"]);
assert.deepEqual(copiedDialect("오마니 보고 싶다 하시고요", "어머니가 보고 싶다고 하심."), []);
assert.match(glossary("물팍지가 득신득신 쑤세다고"), /물팍지 = 무릎/);
assert.equal(glossary("점심 반 공기 드셨어요"), "");
assert.equal(glossary("다리가 아프고 어지럽다고 하셔서"), "");
