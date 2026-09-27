-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "guardianName" TEXT NOT NULL,
    "guardianRelation" TEXT NOT NULL DEFAULT '기타',
    "isActive" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_Client" ("guardianName", "id", "name") SELECT "guardianName", "id", "name" FROM "Client";
DROP TABLE "Client";
ALTER TABLE "new_Client" RENAME TO "Client";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
