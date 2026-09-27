-- CreateTable
CREATE TABLE "Caregiver" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "guardianName" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Visit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caregiverId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "startedAt" DATETIME,
    "endedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "transcript" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Visit_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "Caregiver" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Visit_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "visitId" TEXT NOT NULL,
    "meals" TEXT NOT NULL,
    "medication" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "aiRawJson" TEXT,
    "wasEdited" BOOLEAN NOT NULL DEFAULT false,
    "shareToken" TEXT NOT NULL,
    "sentAt" DATETIME,
    "viewedAt" DATETIME,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Report_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Report_visitId_key" ON "Report"("visitId");

-- CreateIndex
CREATE UNIQUE INDEX "Report_shareToken_key" ON "Report"("shareToken");
