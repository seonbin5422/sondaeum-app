-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "age" INTEGER,
    "gender" TEXT,
    "allergies" TEXT,
    "medicalHistory" TEXT,
    "medicationNotes" TEXT,
    "personalNotes" TEXT,
    "guardianName" TEXT NOT NULL,
    "guardianRelation" TEXT NOT NULL DEFAULT '기타',
    "guardianPhone" TEXT,
    "careRegistrationNumber" TEXT,
    "careGrade" TEXT,
    "phone" TEXT,
    "scheduleLabel" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "purgeAt" DATETIME,
    "caregiverId" TEXT,
    CONSTRAINT "Client_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "Caregiver" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Client" ("age", "allergies", "careRegistrationNumber", "gender", "guardianName", "guardianRelation", "id", "isActive", "medicalHistory", "medicationNotes", "name", "personalNotes", "phone", "purgeAt", "scheduleLabel") SELECT "age", "allergies", "careRegistrationNumber", "gender", "guardianName", "guardianRelation", "id", "isActive", "medicalHistory", "medicationNotes", "name", "personalNotes", "phone", "purgeAt", "scheduleLabel" FROM "Client";
DROP TABLE "Client";
ALTER TABLE "new_Client" RENAME TO "Client";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
