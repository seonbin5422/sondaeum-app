-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Report" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "visitId" TEXT NOT NULL,
    "meals" TEXT NOT NULL,
    "medication" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "medicationMorning" BOOLEAN NOT NULL DEFAULT false,
    "medicationLunch" BOOLEAN NOT NULL DEFAULT false,
    "medicationEvening" BOOLEAN NOT NULL DEFAULT false,
    "medicationBedtime" BOOLEAN NOT NULL DEFAULT false,
    "medicationNone" BOOLEAN NOT NULL DEFAULT false,
    "aiRawJson" TEXT,
    "wasEdited" BOOLEAN NOT NULL DEFAULT false,
    "shareToken" TEXT NOT NULL,
    "sentAt" DATETIME,
    "viewedAt" DATETIME,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Report_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Report" ("aiRawJson", "id", "meals", "medication", "notes", "sentAt", "shareToken", "viewCount", "viewedAt", "visitId", "wasEdited") SELECT "aiRawJson", "id", "meals", "medication", "notes", "sentAt", "shareToken", "viewCount", "viewedAt", "visitId", "wasEdited" FROM "Report";
DROP TABLE "Report";
ALTER TABLE "new_Report" RENAME TO "Report";
CREATE UNIQUE INDEX "Report_visitId_key" ON "Report"("visitId");
CREATE UNIQUE INDEX "Report_shareToken_key" ON "Report"("shareToken");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
