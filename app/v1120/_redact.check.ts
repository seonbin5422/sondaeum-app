// 실행: npx tsx app/v1120/_redact.check.ts (AI 호출 없이 개인정보 지우기와 AI 결과 거르기만 확인)
import assert from "node:assert/strict";
import { redactForAi, restoreNames, toRoleWords } from "./_redact";
import { checkAiRecord, fillGaps, notesLost } from "./_ai";
import { extractRecord } from "./_extract";

const people = { client: "홍길순", guardian: "김영희", caregiver: "이순자", phones: ["010-9876-5432"] };
const r = (s: string) => redactForAi(s, people);

assert.equal(r("홍길순 어르신 혈압 135/85였어요"), "[수급자] 어르신 혈압 135/85였어요");
assert.equal(r("길순 어르신이 따님 김영희 씨 찾으셨어요"), "[수급자] 어르신이 따님 [보호자] 씨 찾으셨어요");
assert.equal(r("이순자 요양보호사가 약 챙겨 드렸어요"), "[요양보호사] 요양보호사가 약 챙겨 드렸어요");
assert.equal(r("따님 번호 01098765432로 연락"), "따님 번호 [전화번호]로 연락");
assert.equal(r("010 1234 5678로 전화하래요"), "[전화번호]로 전화하래요");
assert.equal(r("집 전화 02-123-4567"), "집 전화 [전화번호]");
assert.equal(r("주민번호 450101-2345678"), "주민번호 [주민번호]");
assert.equal(r("카드 1234-5678-9012-3456"), "카드 [카드번호]");
assert.equal(r("계좌 110-234-567890"), "계좌 [번호]");
// 건강 숫자·날짜는 남는다
assert.equal(r("2026-10-13 혈압 140/90, 소변 실수 2번, 30분"), "2026-10-13 혈압 140/90, 소변 실수 2번, 30분");
assert.equal(restoreNames("[수급자] 어르신 [보호자] 씨", people), "홍길순 어르신 김영희 씨");
assert.equal(toRoleWords("[수급자]께서 [보호자]와 통화"), "어르신께서 보호자와 통화");

// AI 결과 거르기: 근거 문장이 입력에 없으면 그 칸은 비운다 (지어낸 기록 막기)
const input = "세수 도와드렸어요. 소변 실수 한 번 있었어요.";
const ai = {
  physical: { personalHygiene: true, bathing: false, mealAssist: true, repositioning: false, mobility: false, toileting: false, minutes: 9999 },
  physicalNote: "세수를 도와드렸어요.",
  cognitive: { stimulation: 30, dailyLiving: null, behaviorManagement: null, emotional: null },
  household: { mealPrepCleaningLaundry: null, personalActivity: null, minutes: null },
  change: { physical: "worse", meal: "bad", cognitive: null },
  bowel: { stoolAccidents: null, urineAccidents: 1, diaperChanges: -2 },
  notes: null,
  quotes: { physical: ["세수 도와드렸어요."], cognitive: ["사진 보며 30분 말벗"], household: [], change: ["식사량이 줄었어요"], bowel: ["소변 실수 한 번 있었어요."], notes: [] },
};
const { record, quotes } = checkAiRecord(ai, input);
assert.equal(record.physical.personalHygiene, true);
assert.equal(checkAiRecord({ ...ai, physical: { ...ai.physical, bathing: null } }, input).record.physical.bathing, false); // 한 게 있으면 나머지는 "안 함"
assert.equal(record.physical.minutes, null); // 범위 밖 숫자
assert.equal(record.cognitive.stimulation, null); // 근거가 입력에 없음
assert.deepEqual(record.change, { physical: null, meal: null, cognitive: null }); // 근거 없음
assert.equal(record.bowel.urineAccidents, 1);
assert.equal(record.bowel.diaperChanges, null);
assert.equal(quotes.physical, "세수 도와드렸어요.");
assert.equal(quotes.cognitive, null);
assert.equal(checkAiRecord(null, input).record.notes, null);
// AI가 비운 숫자 칸만 낱말 찾기로 메우고, 글 칸은 메우지 않는다
const said = "기저귀 세 번 갈아 드렸어요. 음 혈압이 어 130에 80.";
const gapped = fillGaps(checkAiRecord({ quotes: {} }, said), extractRecord(said));
assert.equal(gapped.record.bowel.diaperChanges, 3);
assert.equal(gapped.record.notes, null);
assert.ok(gapped.quotes.bowel?.includes("기저귀"));
const meal = "반찬 만들어 드리고 청소했어요.";
assert.equal(fillGaps(checkAiRecord({ quotes: {} }, meal), extractRecord(meal)).record.physical.mealAssist, null); // 체크는 안 메움
console.log("redact + ai check ok");

// 특이사항을 썼는데 근거가 없어 지워졌을 때만 다시 묻는다
const noQuote = { notes: "약은 잘 드셨어요.", quotes: { notes: [] } };
assert.equal(notesLost(noQuote, checkAiRecord(noQuote, "약 잘 드셨고")), true);
const withQuote = { notes: "약은 잘 드셨어요.", quotes: { notes: ["약 잘 드셨고"] } };
assert.equal(notesLost(withQuote, checkAiRecord(withQuote, "약 잘 드셨고")), false);
assert.equal(notesLost({ notes: null }, checkAiRecord({ notes: null }, "")), false);

// 인지 근거에 시간이 없으면 옮겨 온 시간이라 비운다 (식사도움 30분 → 말벗 30분 중복)
const moved = "떠 드렸고 삼십 분 걸렸어요 딸 얘기 들어드렸습니다";
const movedAi = { cognitive: { emotional: 30 }, quotes: { cognitive: ["딸 얘기 들어드렸습니다"] } };
assert.equal(checkAiRecord(movedAi, moved).record.cognitive.emotional, null);
assert.equal(checkAiRecord(movedAi, moved).quotes.cognitive, "딸 얘기 들어드렸습니다"); // 근거는 남아 "확인 필요"로 뜸
const timed = { cognitive: { emotional: 30 }, quotes: { cognitive: ["한 삼십 분 정도 옛날 사진 보면서 얘기 나눴어요"] } };
assert.equal(checkAiRecord(timed, "한 삼십 분 정도 옛날 사진 보면서 얘기 나눴어요").record.cognitive.emotional, 30);
assert.equal(extractRecord("이십 분 아니 삼십 분 옛날 사진 보면서 이야기 나눴어요").record.cognitive.emotional, 30);
const photo = "한 삼십 분 정도 옛날 사진 보면서 얘기 나눴어요";
const photoAi = checkAiRecord({ cognitive: { emotional: 30 }, quotes: { cognitive: [photo] } }, photo);
assert.equal(fillGaps(photoAi, extractRecord(photo)).record.cognitive.stimulation, null); // 같은 30분을 인지자극에 또 넣지 않음
assert.equal(checkAiRecord({ notes: "물도 안 드셨어요.-요 약은 드셨어요.-요", quotes: { notes: ["물"] } }, "물").record.notes, "물도 안 드셨어요. 약은 드셨어요.");

// 특이사항: 기록지용(기록체)과 보호자용('~요'체)을 따로 받고, 근거가 없으면 둘 다 비운다
const cough = "점심 반 공기 드시다 기침 두 번 하셔서 천천히 드시게 도와드렸어요";
const twoNotes = { notes: "점심 식사 1/2 공기 섭취. 식사 중 기침 2회 보여 천천히 드시도록 도움.", guardianNotes: "점심을 반 공기 드셨어요.", quotes: { notes: [cough] } };
assert.equal(checkAiRecord(twoNotes, cough).record.guardianNotes, "점심을 반 공기 드셨어요.");
assert.equal(checkAiRecord({ ...twoNotes, quotes: { notes: [] } }, cough).record.guardianNotes, null);
assert.equal(checkAiRecord({ ...twoNotes, notesNoAction: true }, cough).record.notesNoAction, true);
assert.equal(checkAiRecord({ ...twoNotes, notesNoAction: true, quotes: { notes: [] } }, cough).record.notesNoAction, false); // 특이사항이 비면 안내도 없음
assert.equal(checkAiRecord({ ...twoNotes, notesNoAction: true, notesAsk: "기침에 어떻게 도와드렸나요?" }, cough).record.notesAsk, "기침에 어떻게 도와드렸나요?");
assert.equal(checkAiRecord({ ...twoNotes, notesAsk: "기침에 어떻게 도와드렸나요?" }, cough).record.notesAsk, null); // 조치가 있으면 묻지 않음

// 녹음 중 미리 보기: "~습니다"로 이어 말해도 활동마다 자기 시간을 잡는다
const sung = extractRecord("세수했고요 세수 5분 모아 드렸습니다 함께 노래 부르는 시간을 10분 가졌습니다").record;
assert.equal(sung.cognitive.stimulation, 10);
assert.equal(sung.physical.minutes, 5);
assert.equal(extractRecord("세수 5분 하고 노래 10분 불렀어요").record.cognitive.stimulation, 10);
