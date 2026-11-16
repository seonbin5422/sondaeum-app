// _ai.ts·_glossary.ts가 불러올 때 도는 자기 검사용. 브라우저에는 node:assert가 없어 같은 뜻만 흉내 내고, 틀리면 콘솔에 남긴다
const fail = (m: string) => console.warn("self-check:", m);
const s = JSON.stringify;
const known: Record<string, (...a: any[]) => void> = {
  ok: (v, m = "ok") => void (v || fail(m)),
  equal: (a, b) => void (a === b || fail(`${a} !== ${b}`)),
  deepEqual: (a, b) => void (s(a) === s(b) || fail(`${s(a)} != ${s(b)}`)),
  match: (t, re) => void (re.test(t) || fail(`${t} !~ ${re}`)),
  doesNotMatch: (t, re) => void (!re.test(t) || fail(`${t} =~ ${re}`)),
};
// 그 밖의 검사(notEqual 등)는 건너뛴다
const assert = new Proxy(known.ok, { get: (_t, k: string) => known[k] ?? (() => {}) });
export default assert;
