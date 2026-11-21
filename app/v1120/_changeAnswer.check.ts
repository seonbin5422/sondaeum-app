// 되묻기 "지난번과 달라진 점"에 영역 없이 답하면 세 칸 모두 채운다 (DIF-1-12). 실행: npx tsx app/v1120/_changeAnswer.check.ts
import assert from "node:assert/strict";
import { extractRecord } from "./_extract";

const c = (t: string) => extractRecord(t).record.change;
assert.deepEqual(c("세수 도와드렸어요.\n(지난번과 달라진 점 질문에 대한 답) 비슷하셨습니다"), { physical: "same", meal: "same", cognitive: "same" });
assert.deepEqual(c("(지난번과 달라진 점 질문에 대한 답) 좀 나빠지셨어요"), { physical: "worse", meal: "worse", cognitive: "worse" });
// 영역을 말했으면 그 칸만
assert.deepEqual(c("(지난번과 달라진 점 질문에 대한 답) 식사는 줄었어요"), { physical: null, meal: "worse", cognitive: null });
// 다른 질문 답의 "비슷"은 변화가 아님
assert.deepEqual(c("(몸 돌봄 질문에 대한 답) 비슷하게 30분 했어요"), { physical: null, meal: null, cognitive: null });


// 시간만 답해도 그 칸 시간으로, 대소변은 "없었어요"만 답해도 둘 다 0
const r = extractRecord("세수 도와드렸어요. 거실 청소했어요.\n(몸 돌봄 질문에 대한 답) 그냥 30분 했습니다\n(집안일·외출 질문에 대한 답) 40분이요\n(대소변 질문에 대한 답) 없었어요").record;
assert.equal(r.physical.minutes, 30);
assert.equal(r.household.minutes, 40);
assert.deepEqual([r.bowel.stoolAccidents, r.bowel.urineAccidents], [0, 0]);
assert.equal(r.physical.personalHygiene, true);
console.log("ok 2");
