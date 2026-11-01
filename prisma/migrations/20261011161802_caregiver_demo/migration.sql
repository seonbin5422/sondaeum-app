-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Caregiver" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "licenseNumber" TEXT,
    "kakaoId" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "demoExpiresAt" DATETIME
);
INSERT INTO "new_Caregiver" ("id", "kakaoId", "licenseNumber", "name") SELECT "id", "kakaoId", "licenseNumber", "name" FROM "Caregiver";
DROP TABLE "Caregiver";
ALTER TABLE "new_Caregiver" RENAME TO "Caregiver";
CREATE UNIQUE INDEX "Caregiver_kakaoId_key" ON "Caregiver"("kakaoId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
