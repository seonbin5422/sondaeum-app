// 실행: npx tsx app/v1120/_redact.check.ts
import assert from "node:assert/strict";
import { redactForAi } from "./_redact";

const people = { client: "홍길순", guardian: "김영희", caregiver: "이순자", phones: ["010-9876-5432"] };
const r = (s: string) => redactForAi(s, people);

assert.equal(r("홍길순 어르신 혈압 135/85였어요"), "수급자 어르신 혈압 135/85였어요");
assert.equal(r("길순 어르신이 따님 김영희 씨 찾으셨어요"), "수급자 어르신이 따님 보호자 씨 찾으셨어요");
assert.equal(r("이순자 요양보호사가 약 챙겨 드렸어요"), "요양보호사 요양보호사가 약 챙겨 드렸어요");
assert.equal(r("따님 번호 01098765432로 연락"), "따님 번호 [전화번호]로 연락");
assert.equal(r("010 1234 5678로 전화하래요"), "[전화번호]로 전화하래요");
assert.equal(r("집 전화 02-123-4567"), "집 전화 [전화번호]");
assert.equal(r("주민번호 450101-2345678"), "주민번호 [주민번호]");
assert.equal(r("카드 1234-5678-9012-3456"), "카드 [카드번호]");
assert.equal(r("계좌 110-234-567890"), "계좌 [번호]");
// 건강 숫자·날짜는 남는다
assert.equal(r("2026-10-13 혈압 140/90, 소변 실수 2번, 30분"), "2026-10-13 혈압 140/90, 소변 실수 2번, 30분");
console.log("redact ok");
