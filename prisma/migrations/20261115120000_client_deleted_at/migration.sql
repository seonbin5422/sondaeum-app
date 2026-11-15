-- AlterTable
ALTER TABLE "Client" ADD COLUMN "deletedAt" DATETIME;
-- 이미 삭제된 수급자는 적용한 날을 삭제일로 둔다 (그날부터 14일 뒤 Cron이 지움). Prisma가 쓰는 글자 모양과 같게
UPDATE "Client" SET "deletedAt" = strftime('%Y-%m-%dT%H:%M:%f+00:00', 'now') WHERE "isActive" = 0 AND "deletedAt" IS NULL;
