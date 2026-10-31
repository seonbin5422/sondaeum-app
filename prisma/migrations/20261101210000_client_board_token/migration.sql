-- AlterTable
ALTER TABLE "Client" ADD COLUMN "boardToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Client_boardToken_key" ON "Client"("boardToken");
