-- AlterTable
ALTER TABLE "Item" ADD COLUMN "coverUrl" TEXT;
ALTER TABLE "Item" ADD COLUMN "currentPage" INTEGER DEFAULT 0;
ALTER TABLE "Item" ADD COLUMN "dailySessions" INTEGER DEFAULT 0;
ALTER TABLE "Item" ADD COLUMN "isbn" TEXT;
ALTER TABLE "Item" ADD COLUMN "lastReadAt" DATETIME;
ALTER TABLE "Item" ADD COLUMN "openLibraryId" TEXT;
ALTER TABLE "Item" ADD COLUMN "readingStartedAt" DATETIME;
ALTER TABLE "Item" ADD COLUMN "readingStreak" INTEGER DEFAULT 0;
ALTER TABLE "Item" ADD COLUMN "totalPages" INTEGER;

-- CreateTable
CREATE TABLE "ReadingSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemId" TEXT NOT NULL,
    "minutesSpent" INTEGER NOT NULL DEFAULT 15,
    "pagesRead" INTEGER,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReadingSession_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ReadingSession_itemId_date_idx" ON "ReadingSession"("itemId", "date");
