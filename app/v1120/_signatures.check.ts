// npx tsx app/v1120/_signatures.check.ts — 화면에서 온 서명 값을 저장 전에 거르는지
import assert from "node:assert/strict";
import { cleanSignatures, isEmptySignatures } from "./_signatures";

const ok = cleanSignatures({ recipient: [[[10.123, 20], [500, -5]]], caregiver: [], reason: "  손 떨림  " });
assert.deepEqual(ok.recipient, [[[10.1, 20], [400, 0]]]); // 칸 밖 점은 끝에 붙임
assert.equal(ok.reason, "손 떨림");
assert.ok(isEmptySignatures(cleanSignatures({})));
assert.throws(() => cleanSignatures({ recipient: [[["a", 1]]] }));
assert.throws(() => cleanSignatures({ recipient: [[]] }));
assert.throws(() => cleanSignatures({ recipient: Array.from({ length: 101 }, () => [[1, 1]]) }));
assert.throws(() => cleanSignatures({ caregiver: [Array.from({ length: 4001 }, () => [1, 1])] }));
assert.throws(() => cleanSignatures("x"));
assert.equal(cleanSignatures({ reason: "가".repeat(300) }).reason.length, 200);
console.log("ok");
