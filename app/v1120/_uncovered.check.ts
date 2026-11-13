// 실행: npx tsx --tsconfig tsconfig.json app/v1120/_uncovered.check.ts
import assert from "node:assert/strict";
import { uncovered } from "./_ai";
const none = { physical: null, cognitive: null, household: null, change: null, bowel: null, notes: null };
assert.deepEqual(uncovered("어제 저녁에 약주 한잔 하셨다고 하시네요.", none), ["어제 저녁에 약주 한잔 하셨다고 하시네요."]);
assert.deepEqual(uncovered("따님이 오셨다가 저녁 드시고 댁으로 돌아가셨어요. 점심 반 공기 드셨어요.", { ...none, notes: "점심 반 공기 드셨어요." }), ["따님이 오셨다가 저녁 드시고 댁으로 돌아가셨어요."]);
assert.deepEqual(uncovered("어르신이 모간지가 아프고 가심이 답답하다 카셔서 좀 쉬시게 해 드렸어요.", { ...none, notes: "모간지가 아프고 가심이" }), []);
assert.deepEqual(uncovered("네.", none), []);
console.log("ok");
