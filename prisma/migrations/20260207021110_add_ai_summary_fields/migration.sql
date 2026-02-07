-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Item" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "sourceId" TEXT,
    "title" TEXT NOT NULL,
    "url" TEXT,
    "author" TEXT,
    "publishedDate" DATETIME,
    "macro" TEXT,
    "contentType" TEXT NOT NULL DEFAULT 'SESSION',
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "readwiseDocumentId" TEXT,
    "readwiseLocation" TEXT,
    "completedAt" DATETIME,
    "completionMethod" TEXT,
    "timeSpentMinutes" INTEGER DEFAULT 0,
    "currentPage" INTEGER DEFAULT 0,
    "totalPages" INTEGER,
    "readingStartedAt" DATETIME,
    "lastReadAt" DATETIME,
    "readingStreak" INTEGER DEFAULT 0,
    "dailySessions" INTEGER DEFAULT 0,
    "coverUrl" TEXT,
    "openLibraryId" TEXT,
    "isbn" TEXT,
    "estimatedMinutes" INTEGER,
    "progressMode" TEXT DEFAULT 'pages',
    "wordCount" INTEGER,
    "aiSummary" TEXT,
    "aiSummaryGeneratedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Item_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Item_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Item" ("author", "completedAt", "completionMethod", "contentType", "coverUrl", "createdAt", "currentPage", "dailySessions", "id", "isbn", "lastReadAt", "macro", "openLibraryId", "publishedDate", "readingStartedAt", "readingStreak", "readwiseDocumentId", "readwiseLocation", "sourceId", "status", "timeSpentMinutes", "title", "totalPages", "updatedAt", "url", "userId") SELECT "author", "completedAt", "completionMethod", coalesce("contentType", 'SESSION') AS "contentType", "coverUrl", "createdAt", "currentPage", "dailySessions", "id", "isbn", "lastReadAt", "macro", "openLibraryId", "publishedDate", "readingStartedAt", "readingStreak", "readwiseDocumentId", "readwiseLocation", "sourceId", "status", "timeSpentMinutes", "title", "totalPages", "updatedAt", "url", "userId" FROM "Item";
DROP TABLE "Item";
ALTER TABLE "new_Item" RENAME TO "Item";
CREATE INDEX "Item_userId_status_idx" ON "Item"("userId", "status");
CREATE INDEX "Item_userId_macro_idx" ON "Item"("userId", "macro");
CREATE INDEX "Item_readwiseDocumentId_idx" ON "Item"("readwiseDocumentId");
CREATE UNIQUE INDEX "Item_userId_readwiseDocumentId_key" ON "Item"("userId", "readwiseDocumentId");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clerkId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "onboardingStep" INTEGER DEFAULT 0,
    "onboardingSkipped" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_User" ("clerkId", "createdAt", "id", "updatedAt") SELECT "clerkId", "createdAt", "id", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
