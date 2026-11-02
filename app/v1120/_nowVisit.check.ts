// npx tsx app/v1120/_nowVisit.check.ts — 홈 "지금 방문 시간" 표시 기준
import assert from "node:assert/strict";
import { isNowInSchedule } from "../../lib/schedule";

const at = (h: number, m = 0) => h * 60 + m;
assert.equal(isNowInSchedule("월·수·금 09:00–11:00", at(9)), true); // 시작 시각 포함
assert.equal(isNowInSchedule("월,수,금 09:00-11:00", at(10, 59)), true); // DB 원래 모양
assert.equal(isNowInSchedule("월·수·금 09:00–11:00", at(11)), false); // 끝 시각은 다음 수급자 차례
assert.equal(isNowInSchedule("월·수·금 09:00–11:00", at(8, 59)), false);
assert.equal(isNowInSchedule("일정 미입력", at(10)), false);
assert.equal(isNowInSchedule(null, at(10)), false);
console.log("ok");
