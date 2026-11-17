-- 보호자 링크 확인(전화번호 끝 4자리) 틀린 횟수·잠금
ALTER TABLE "Client" ADD COLUMN "guardianCheckFails" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Client" ADD COLUMN "guardianLockedUntil" DATETIME;
