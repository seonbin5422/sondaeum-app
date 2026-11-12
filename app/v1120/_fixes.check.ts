// npx tsx app/v1120/_fixes.check.ts — 받아쓰기 교정 목록 적용 확인
import assert from "node:assert/strict";
import { applyFixes } from "./_ai";

const t = "아척에 칩다고 하셔서 입을 덮어 드렸어요. [수급자] 혈압 130";
const r = applyFixes(t, [
  { from: "입을 덮어", to: "이불 덮어" },
  { from: "없는말", to: "아무거나" }, // 입력에 없음 → 버림
  { from: "130", to: "140" }, // 숫자 → 버림
  { from: "[수급자]", to: "어르신" }, // 대괄호 표시 → 버림
  { from: "칩다고", to: "칩다고" }, // 같음 → 버림
]);
assert.equal(r.text, "아척에 칩다고 하셔서 이불 덮어 드렸어요. [수급자] 혈압 130");
assert.deepEqual(r.fixes, [{ from: "입을 덮어", to: "이불 덮어" }]);
console.log("_fixes ok");
