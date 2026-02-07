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

export async function POST() {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

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

    return NextResponse.json({
      success: true,
      itemsUpdated: syncResult.itemsUpdated,
      itemsCompleted: syncResult.itemsCompleted,
      itemsStarted: syncResult.itemsStarted,
      errors: syncResult.errors,
      lastSyncedAt: syncResult.lastSyncedAt,
    });
  } catch (error) {
    console.error("Progress sync error:", error);
    return new NextResponse(
      error instanceof Error ? error.message : "Sync failed",
      { status: 500 },
    );
  }
}
