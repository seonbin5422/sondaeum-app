// npx tsx app/v1120/_validate.check.ts — 입력칸 형식 검사 확인
import assert from "node:assert/strict";
import { checkField } from "./_validate";

const ok = (rule: Parameters<typeof checkField>[0], v: string) => assert.equal(checkField(rule, v), null, `${rule} ${v}`);
const bad = (rule: Parameters<typeof checkField>[0], v: string) => assert.notEqual(checkField(rule, v), null, `${rule} ${v}`);

ok("name", "홍길순"); ok("name", "김○○"); ok("name", "Kim Minji"); ok("name", "");
bad("name", "ㄱㄱ"); bad("name", "홍"); bad("name", "홍길순1");
ok("license", "2019-서울-012345"); ok("license", "2010123456");
bad("license", "123"); bad("license", "asdfgh"); bad("license", "서울서울서울");
ok("careNo", "L1234567890"); ok("careNo", "l1234-567890"); bad("careNo", "1234567890"); bad("careNo", "L12345");
ok("mobile", "010-1234-5678"); ok("mobile", "01012345678"); bad("mobile", "02-123-4567"); bad("mobile", "010-12");
ok("phone", "053-123-4567"); ok("phone", "010 1234 5678"); bad("phone", "1234"); bad("phone", "전화없음");
ok("age", "82"); bad("age", "0"); bad("age", "팔십"); bad("age", "200");
console.log("_validate ok");
