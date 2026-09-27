-- AlterTable
ALTER TABLE "Caregiver" ADD COLUMN "kakaoId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Caregiver_kakaoId_key" ON "Caregiver"("kakaoId");
