-- AlterTable
ALTER TABLE "Caregiver" ADD COLUMN "consentItems" TEXT;
ALTER TABLE "Caregiver" ADD COLUMN "consentedAt" DATETIME;

-- CreateTable
CREATE TABLE "AiUsage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caregiverId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AiUsage_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "Caregiver" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "AiUsage_caregiverId_createdAt_idx" ON "AiUsage"("caregiverId", "createdAt");
