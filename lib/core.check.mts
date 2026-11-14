// STB-7 핵심 로직 테스트: npx tsx --tsconfig tsconfig.json lib/core.check.mts
// 팀 DB를 건드리지 않게 임시 SQLite 파일에 마이그레이션을 깔고, 요양보호사 둘·옛 수급자 하나로 확인한다.
// 권한(남의 수급자·방문·보고서), 보호자 링크(보낸 기록만·기한·삭제 예약), 일정 매칭, 상태 전이(보낸 뒤 못 고침·중복 정리 막기), 만료 삭제.
import assert from "node:assert/strict";
import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import Module from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { createClient } from "@libsql/client";

const tmp = mkdtempSync(path.join(tmpdir(), "sondaeum-perm-"));
const dbFile = path.join(tmp, "test.db");
// "server-only"는 Next가 빌드 때만 풀어 주는 표시용 모듈이라, 테스트에서는 빈 파일로 대신한다
const stub = path.join(tmp, "server-only.js");
writeFileSync(stub, "");
const M = Module as unknown as { _resolveFilename: (req: string, ...rest: unknown[]) => string };
const resolve = M._resolveFilename;
// 서버 액션은 로그인 쿠키로 요양보호사를 찾는다. 테스트에서는 next/headers의 쿠키를 가짜로 바꿔 "지금 로그인한 사람"을 정한다
const fakeHeaders = path.join(tmp, "next-headers.cjs");
writeFileSync(fakeHeaders, `exports.cookies = async () => ({ get: () => (globalThis.__session ? { value: globalThis.__session } : undefined), set() {}, delete() {} });
exports.headers = async () => new Headers();`);
M._resolveFilename = function (req, ...rest) {
  if (req === "server-only") return stub;
  if (req === "next/headers") return fakeHeaders;
  return resolve.call(this, req, ...rest);
};
process.env.SESSION_SECRET ??= "test-session-secret-0123456789abcdef";
delete process.env.GROQ_API_KEY; // AI는 부르지 않는다
// lib/prisma가 읽기 전에 임시 DB로 돌린다 (.env.local의 팀 DB가 섞이지 않게)
delete process.env.TURSO_DATABASE_URL;
delete process.env.TURSO_AUTH_TOKEN;
process.env.DATABASE_URL = `file:${dbFile}`;
process.env.ENCRYPTION_KEY ??= Buffer.alloc(32, 7).toString("base64"); // 보낼 때 서명을 암호화해 저장하므로 진짜 모양(base64 32바이트)이어야 한다

const migrations = path.join(import.meta.dirname, "..", "prisma", "migrations");
const db = createClient({ url: `file:${dbFile}` });
for (const dir of readdirSync(migrations).filter((d) => /^\d/.test(d)).sort()) {
  await db.executeMultiple(readFileSync(path.join(migrations, dir, "migration.sql"), "utf8"));
}

const { prisma } = await import("./prisma");
const { ownsClient, ownsVisit, ownsReport } = await import("./apiAuth");
const { guardianBoard } = await import("../app/v1120/_data");

const a = await prisma.caregiver.create({ data: { name: "요양보호사가" } });
const b = await prisma.caregiver.create({ data: { name: "요양보호사나" } });
const clientA = await prisma.client.create({ data: { name: "김어르신", guardianName: "김보호", caregiverId: a.id } });
const legacy = await prisma.client.create({ data: { name: "옛수급자", guardianName: "옛보호" } }); // 옛 화면이 만든 담당 없는 수급자
const visitA = await prisma.visit.create({ data: { caregiverId: a.id, clientId: clientA.id, status: "SENT" } });
const sent = await prisma.report.create({ data: { visitId: visitA.id, meals: "", medication: "", notes: "", sentAt: new Date() } });
const draftVisit = await prisma.visit.create({ data: { caregiverId: a.id, clientId: clientA.id } });
const draft = await prisma.report.create({ data: { visitId: draftVisit.id, meals: "", medication: "", notes: "" } });

// API 권한 (SEC-1): 내 것만, 남의 것·없는 것은 false
assert.equal(await ownsClient(clientA.id, a.id), true);
assert.equal(await ownsClient(clientA.id, b.id), false, "남의 수급자");
assert.equal(await ownsClient("no-such-id", a.id), false);
assert.equal(await ownsClient(legacy.id, b.id), true, "담당 없는 옛 수급자는 아직 누구나 (apiAuth shortcut, SEC-2)");
assert.equal(await ownsVisit(visitA.id, a.id), true);
assert.equal(await ownsVisit(visitA.id, b.id), false, "남의 방문");
assert.equal(await ownsReport(sent.id, a.id), true);
assert.equal(await ownsReport(sent.id, b.id), false, "남의 보고서");

// 보호자 링크: 보낸 보고서 링크로만 게시판이 열리고, 안 보낸 초안 링크·없는 링크로는 안 열린다
const board = await guardianBoard(sent.shareToken);
assert.ok(board && board !== "expired" && board.clientId === clientA.id);
assert.equal(await guardianBoard(draft.shareToken), null, "안 보낸 보고서 링크");
assert.equal(await guardianBoard("no-such-token"), null);
// 링크 기한(STB-5 (가)): 지나면 "expired", 다시 보내 기한이 늘면 열린다
await prisma.client.update({ where: { id: clientA.id }, data: { boardExpiresAt: new Date(Date.now() - 1000) } });
assert.equal(await guardianBoard(sent.shareToken), "expired", "기한 지난 링크");
await prisma.client.update({ where: { id: clientA.id }, data: { boardExpiresAt: new Date(Date.now() + 86_400_000) } });
assert.notEqual(await guardianBoard(sent.shareToken), "expired");
// 삭제(삭제 예약) 수급자는 링크가 있어도 안 보인다
await prisma.client.update({ where: { id: clientA.id }, data: { purgeAt: new Date(Date.now() + 86_400_000) } });
assert.equal(await guardianBoard(sent.shareToken), null, "삭제 예약된 수급자");

// 만료 수급자 지우기 (STB-6): 기한 지난 수급자와 그 방문·보고서가 지워진다
const { purgeExpiredClients } = await import("./purgeExpiredClients");
await prisma.client.update({ where: { id: clientA.id }, data: { purgeAt: new Date(Date.now() - 1000) } });
assert.equal(await purgeExpiredClients(), 1);
assert.equal(await prisma.report.count({ where: { visitId: visitA.id } }), 0);
assert.equal(await prisma.client.count({ where: { id: legacy.id } }), 1, "기한 없는 수급자는 남는다");

// 일정 매칭: "월,수,금 09:00-11:00" 꼴만 요일로 읽고, 일정이 없으면 어느 날이든 보인다
const { parseScheduleDays, matchesScheduleDay, isVisibleOn, getScheduleEndMinutes } = await import("./schedule");
const wed = new Date(2026, 10, 4); // 2026-11-04 수요일
assert.deepEqual(parseScheduleDays("월,수,금 09:00-11:00"), ["월", "수", "금"]);
assert.deepEqual(parseScheduleDays("아무 때나"), []);
assert.equal(matchesScheduleDay("월,수,금 09:00-11:00", wed), true);
assert.equal(matchesScheduleDay("화,목 09:00-11:00", wed), false);
assert.equal(isVisibleOn(null, wed), true, "일정 미입력은 항상 보임");
assert.equal(isVisibleOn("화,목 09:00-11:00", wed), false);
assert.equal(getScheduleEndMinutes("월 09:00-11:30"), 690);

// 상태 전이 (서버 액션): 남의 방문은 못 건드리고, 보낸 기록은 못 고치며, 정리는 한 번만
const { signPayload } = await import("./jwt");
const as = async (id: string) => { (globalThis as { __session?: string }).__session = await signPayload({ caregiverId: id }, "1h"); };
const actions = await import("../app/v1120/_actions");
const clientC = await prisma.client.create({ data: { name: "박어르신", guardianName: "박보호", caregiverId: a.id } });
const v1 = await prisma.visit.create({ data: { caregiverId: a.id, clientId: clientC.id, status: "DRAFT_READY" } });
await prisma.report.create({ data: { visitId: v1.id, meals: "", medication: "", notes: "", careRecord: null } });
const isRedirect = (e: unknown) => String((e as { digest?: string })?.digest ?? e).includes("NEXT_REDIRECT");

await as(b.id);
await assert.rejects(actions.saveTranscript(v1.id, "남의 기록"), /찾을 수 없어요/, "남의 방문은 못 고침");
await as(a.id);
await actions.summarizeVisit(v1.id); // DRAFT_READY면 다시 정리하지 않고 끝난다 (STB-2, AI 키 없이도 통과)
assert.equal((await prisma.visit.findUnique({ where: { id: v1.id } }))?.status, "DRAFT_READY");
const sigForm = (caregiver: number[][][]) => {
  const f = new FormData();
  f.set("signatures", JSON.stringify({ recipient: [], caregiver, reason: "" }));
  return f;
};
await assert.rejects(actions.sendReport(v1.id, sigForm([])), /요양보호사 서명/, "서명 없이 보내기 막음 (D-48 261114.ver)");
await actions.sendReport(v1.id, sigForm([[[10, 10], [50, 40]]])).catch((e) => assert.ok(isRedirect(e), String(e))); // 보내면 보낸 화면으로 이동
assert.equal((await prisma.visit.findUnique({ where: { id: v1.id } }))?.status, "SENT");
// 보호자 확인 서명: 보낸 보고서 링크로 서명하면 요양보호사 서명은 그대로 두고 보호자 칸만 들어간다 (D-48 261114.ver)
const sent1 = await prisma.report.findUnique({ where: { visitId: v1.id } });
await assert.rejects(actions.signAsGuardian(sent1!.shareToken, []), /서명을 해 주세요/, "빈 보호자 서명 막음");
await assert.rejects(actions.signAsGuardian("없는토큰", [[[1, 1]]]), /찾을 수 없어요/, "없는 링크");
await actions.signAsGuardian(sent1!.shareToken, [[[5, 5], [9, 9]]]);
const { decryptText } = await import("./crypto");
const both = JSON.parse(decryptText((await prisma.report.findUnique({ where: { visitId: v1.id } }))!.signatures!));
assert.equal(both.recipient.length, 1, "보호자 서명 저장");
assert.equal(both.caregiver.length, 1, "요양보호사 서명 유지");
// 요양보호사는 수급자·보호자 칸에 대신 서명하지 못한다: 보낸 값이 무시되고 보호자 서명이 남는다
await actions.saveSignatures(v1.id, { recipient: [[[100, 100], [200, 50]], [[1, 1]]], caregiver: [[[3, 3]]], reason: "" });
const after = JSON.parse(decryptText((await prisma.report.findUnique({ where: { visitId: v1.id } }))!.signatures!));
assert.deepEqual(after.recipient, both.recipient, "요양보호사가 보호자 칸을 못 바꿈");
const expires = (await prisma.client.findUnique({ where: { id: clientC.id } }))?.boardExpiresAt;
assert.ok(expires && expires.getTime() > Date.now() + 89 * 86_400_000, "보내면 게시판 링크가 90일 열림");
await assert.rejects(actions.saveTranscript(v1.id, "고친 말"), /이미 보낸 기록은 고칠 수 없어요/, "보낸 뒤 고치기 (STB-1)");
await assert.rejects(actions.sendReport(v1.id, sigForm([[[1, 1]]])), /이미 보낸 기록은 고칠 수 없어요/, "두 번 보내기");

console.log("core ok");
