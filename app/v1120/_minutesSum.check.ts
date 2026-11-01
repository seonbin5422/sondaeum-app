// npx tsx app/v1120/_minutesSum.check.ts — 묶음 칸 시간은 활동마다 더하는지
import assert from "node:assert/strict";
import { extractRecord } from "./_extract";

const hh = (t: string) => extractRecord(t).record.household;
assert.deepEqual(hh("식사준비 30분 도와드리고 외출동행 15분 했습니다."), { mealPrepCleaningLaundry: true, personalActivity: true, minutes: 45 });
assert.equal(hh("청소 20분 했어요. 장보기 30분 같이 다녀왔어요.").minutes, 50);
assert.equal(hh("빨래 개고 청소 30분 했어요.").minutes, 30);
assert.equal(hh("청소 이십 분 아니 삼십 분 했어요.").minutes, 30);
assert.equal(extractRecord("세수 10분 도와드렸어요. 산책 20분 부축했어요.").record.physical.minutes, 30);
console.log("ok");
