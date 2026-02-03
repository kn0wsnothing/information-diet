/*
  Warnings:

  - A unique constraint covering the columns `[userId,readwiseDocumentId]` on the table `Item` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Source" ADD COLUMN "lastSyncedAt" DATETIME;

-- CreateIndex
CREATE UNIQUE INDEX "Item_userId_readwiseDocumentId_key" ON "Item"("userId", "readwiseDocumentId");
