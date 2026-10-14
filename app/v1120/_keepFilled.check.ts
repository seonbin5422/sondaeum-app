// npx tsx app/v1120/_keepFilled.check.ts — "더 말하기" 뒤 다시 정리할 때 고친 값이 지켜지는지
import assert from "node:assert/strict";
import { extractRecord, keepFilled } from "./_extract";

const empty = extractRecord("").record;
const old = structuredClone(empty);
old.physical.minutes = 25; // 직접 고친 값
old.physical.mealAssist = true;
old.notes = "직접 쓴 특이사항";
const next = extractRecord("세수 도와드림 40분. 소변 실수 한 번. 혈압 130에 80.").record;

const edited = keepFilled(old, next, true);
assert.equal(edited.physical.minutes, 25); // 고친 값 유지
assert.equal(edited.physical.mealAssist, true);
assert.equal(edited.physical.personalHygiene, true); // 빈 칸은 새로 채움
assert.equal(edited.bowel.urineAccidents, 1);
assert.equal(edited.notes, "직접 쓴 특이사항");

const untouched = keepFilled({ ...old, notes: "옛 정리" }, next, false);
assert.equal(untouched.notes, next.notes); // 안 고쳤으면 새 정리로
console.log("ok");
