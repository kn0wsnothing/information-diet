/**
 * POST /api/readwise/progress-sync
 * Manual trigger for syncing Readwise progress
 * Called from dashboard "Sync Now" button
 */

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  syncReadwiseProgress,
  updateSourceLastSynced,
} from "@/lib/readwise-sync";

/**
 * Debounce map to prevent duplicate simultaneous syncs
 * Key: userId, Value: timestamp of last sync start
 */
const syncInProgress = new Map<string, Date>();
const SYNC_COOLDOWN_MS = 5000; // Prevent syncs within 5 seconds

export async function POST() {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  try {
    // Check if sync is already in progress for this user
    const lastSyncStart = syncInProgress.get(userId);
    if (
      lastSyncStart &&
      Date.now() - lastSyncStart.getTime() < SYNC_COOLDOWN_MS
    ) {
      return NextResponse.json(
        { error: "Sync already in progress. Please wait before trying again." },
        { status: 429 },
      );
    }

    syncInProgress.set(userId, new Date());

    try {
      const dbUser = await prisma.user.upsert({
        where: { clerkId: userId },
        update: {},
        create: { clerkId: userId },
      });

      // Find Readwise source
      const source = await prisma.source.findFirst({
        where: {
          userId: dbUser.id,
          type: "READWISE",
        },
      });

      if (!source || !source.readwiseToken) {
        return new NextResponse("Readwise not connected", { status: 400 });
      }

      // Run sync with lastSyncedAt as starting point
      const syncResult = await syncReadwiseProgress(
        dbUser.id,
        source.readwiseToken,
        source.lastSyncedAt || undefined,
      );

      // Update source's lastSyncedAt timestamp
      await updateSourceLastSynced(source.id, syncResult.lastSyncedAt);

      // Return results, including any errors that occurred during sync
      return NextResponse.json({
        success: syncResult.errors.length === 0,
        itemsUpdated: syncResult.itemsUpdated,
        itemsCompleted: syncResult.itemsCompleted,
        itemsStarted: syncResult.itemsStarted,
        errors: syncResult.errors,
        lastSyncedAt: syncResult.lastSyncedAt,
      });
    } finally {
      // Clear the sync in progress marker after cooldown
      setTimeout(() => {
        syncInProgress.delete(userId);
      }, SYNC_COOLDOWN_MS);
    }
  } catch (error) {
    console.error("Progress sync error:", error);
    const errorMsg = error instanceof Error ? error.message : "Sync failed";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
