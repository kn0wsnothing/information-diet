/**
 * Readwise progress sync logic
 * Syncs reading progress from Readwise to the app
 */

import { prisma } from "./prisma";
import { fetchReadwiseDocuments, ReadwiseDocument } from "./readwise";

export interface SyncResult {
  itemsUpdated: number;
  itemsCompleted: number;
  itemsStarted: number;
  errors: string[];
  lastSyncedAt: Date;
}

/**
 * Infer item status from Readwise document location
 * Maps Readwise locations to app ItemStatus values
 */
export function inferStatusFromLocation(
  location: string | null | undefined,
): "QUEUED" | "DONE" {
  if (!location) return "QUEUED";

  const loc = location.toLowerCase().trim();
  if (loc === "archive") return "DONE";
  return "QUEUED";
}

/**
 * Estimate reading time progress based on Readwise document
 * Used to update timeSpentMinutes for in-progress items
 */
export function estimateProgressTime(
  doc: ReadwiseDocument,
  item: { estimatedMinutes: number | null; updatedAt: Date },
): number {
  if (!item.estimatedMinutes || item.estimatedMinutes <= 0) {
    return 0;
  }

  // If document was updated recently (<24h), estimate progress
  const now = new Date();
  const hoursSinceUpdate =
    (now.getTime() - item.updatedAt.getTime()) / (1000 * 60 * 60);

  if (hoursSinceUpdate > 24) {
    // Don't estimate for items not touched in 24+ hours
    return 0;
  }

  // Conservative estimate: 10 minutes per hour of recency
  const estimatedMinutes = Math.min(
    Math.round(hoursSinceUpdate * 10),
    item.estimatedMinutes,
  );

  return estimatedMinutes;
}

/**
 * Retry configuration for API calls
 */
const RETRY_CONFIG = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
};

/**
 * Calculate exponential backoff delay
 */
function getBackoffDelay(attempt: number): number {
  const delay = Math.min(
    RETRY_CONFIG.initialDelayMs *
      Math.pow(RETRY_CONFIG.backoffMultiplier, attempt),
    RETRY_CONFIG.maxDelayMs,
  );
  // Add jitter to prevent thundering herd
  return delay + Math.random() * delay * 0.1;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Sync Readwise progress with app database
 * Fetches documents from Readwise and updates item statuses/progress
 * Includes retry logic with exponential backoff for resilience
 */
export async function syncReadwiseProgress(
  userId: string,
  readwiseToken: string,
  lastSyncedAt?: Date,
): Promise<SyncResult> {
  const result: SyncResult = {
    itemsUpdated: 0,
    itemsCompleted: 0,
    itemsStarted: 0,
    errors: [],
    lastSyncedAt: new Date(),
  };

  try {
    console.log(`[Readwise Sync] Starting sync for user ${userId}`);

    // Fetch all documents from Readwise with retry logic
    let allDocuments: ReadwiseDocument[] = [];
    let lastFetchError: Error | null = null;

    for (let attempt = 0; attempt < RETRY_CONFIG.maxAttempts; attempt++) {
      try {
        allDocuments = await fetchReadwiseDocuments({
          token: readwiseToken,
          updatedAfter: lastSyncedAt?.toISOString(),
        });
        lastFetchError = null;
        break;
      } catch (error) {
        lastFetchError =
          error instanceof Error ? error : new Error(String(error));
        console.warn(
          `[Readwise Sync] Fetch attempt ${attempt + 1}/${RETRY_CONFIG.maxAttempts} failed:`,
          lastFetchError.message,
        );

        if (attempt < RETRY_CONFIG.maxAttempts - 1) {
          const delayMs = getBackoffDelay(attempt);
          console.log(
            `[Readwise Sync] Retrying in ${Math.round(delayMs)}ms...`,
          );
          await sleep(delayMs);
        }
      }
    }

    if (lastFetchError) {
      throw new Error(
        `Failed to fetch Readwise documents after ${RETRY_CONFIG.maxAttempts} attempts: ${lastFetchError.message}`,
      );
    }

    console.log(
      `[Readwise Sync] Fetched ${allDocuments.length} documents from Readwise`,
    );

    // Get all items for this user with Readwise IDs
    const itemsMap = new Map(
      (
        await prisma.item.findMany({
          where: {
            userId,
            readwiseDocumentId: { not: null },
          },
          select: {
            id: true,
            readwiseDocumentId: true,
            status: true,
            updatedAt: true,
            estimatedMinutes: true,
            completionMethod: true,
            completedAt: true,
          },
        })
      ).map((item) => [item.readwiseDocumentId!, item]),
    );

    // Process each Readwise document
    for (const doc of allDocuments) {
      const item = itemsMap.get(doc.id);

      if (!item) {
        // Item doesn't exist in app, skip it
        continue;
      }

      try {
        const newStatus = inferStatusFromLocation(doc.location);
        const needsUpdate =
          item.status !== newStatus || item.completionMethod !== "READWISE";

        if (!needsUpdate && item.status === "DONE") {
          // Already marked complete from Readwise, no action needed
          continue;
        }

        const updateData: {
          status?: "QUEUED" | "DONE";
          completedAt?: Date;
          completionMethod?: "READWISE";
          lastReadAt?: Date;
          timeSpentMinutes?: { increment: number };
        } = {};

        if (item.status !== newStatus) {
          updateData.status = newStatus;
          console.log(
            `[Readwise Sync] Item ${doc.id}: ${item.status} → ${newStatus} (location: ${doc.location})`,
          );
        }

        // Mark as completed from Readwise if now in archive
        if (newStatus === "DONE" && item.status !== "DONE") {
          updateData.completedAt = new Date(doc.updated_at || doc.created_at);
          updateData.completionMethod = "READWISE";
          result.itemsCompleted++;
          console.log(`[Readwise Sync] Item ${doc.id} marked as DONE`);
        }

        // Update progress for in-progress items
        if (
          item.status === "READING" ||
          (item.status === "QUEUED" && item.completedAt === null)
        ) {
          const estimatedTime = estimateProgressTime(doc, item);
          if (estimatedTime > 0) {
            updateData.lastReadAt = new Date(doc.updated_at || doc.created_at);
            // Only increment if there's new time to add
            if (estimatedTime > 0) {
              updateData.timeSpentMinutes = { increment: estimatedTime };
              console.log(
                `[Readwise Sync] Item ${doc.id}: estimated +${estimatedTime} minutes of reading`,
              );
            }
          }
        }

        if (Object.keys(updateData).length > 0) {
          await prisma.item.update({
            where: { id: item.id },
            data: updateData,
          });
          result.itemsUpdated++;
        }
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Unknown error";
        result.errors.push(`Failed to sync item ${doc.id}: ${errorMsg}`);
        console.error(`[Readwise Sync] Error syncing item ${doc.id}:`, error);
      }
    }

    console.log(
      `[Readwise Sync] Complete: ${result.itemsUpdated} updated, ${result.itemsCompleted} completed`,
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    result.errors.push(`Readwise sync failed: ${errorMsg}`);
    console.error("[Readwise Sync] Fatal error:", error);
  }

  return result;
}

/**
 * Update the lastSyncedAt timestamp for a Readwise source
 */
export async function updateSourceLastSynced(
  sourceId: string,
  syncTime: Date,
): Promise<void> {
  await prisma.source.update({
    where: { id: sourceId },
    data: { lastSyncedAt: syncTime },
  });
}
