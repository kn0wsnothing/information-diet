import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { DashboardClient } from "./dashboard-client";
import { generateWhyReadThis, isSummaryCacheValid } from "@/lib/ai-summary";
import {
  syncReadwiseProgress,
  updateSourceLastSynced,
} from "@/lib/readwise-sync";

async function markItemDone(
  itemId: string,
  timeSpentMinutes: number,
  finished?: boolean,
) {
  "use server";

  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const dbUser = await prisma.user.upsert({
    where: { clerkId: user.id },
    update: {},
    create: { clerkId: user.id },
  });

  // Get the item to check book progress
  const item = await prisma.item.findFirst({
    where: { id: itemId, userId: dbUser.id },
  });

  if (!item) return;

  const updateData: any = {
    status: "DONE",
    completedAt: new Date(),
    timeSpentMinutes: { increment: Math.max(0, timeSpentMinutes) },
  };

  // If it's a book and user finished it, update to final page
  if (finished && item.totalPages && item.totalPages > 0) {
    updateData.currentPage = item.totalPages;
  }

  await prisma.item.update({
    where: { id: itemId },
    data: updateData,
  });

  const { revalidatePath } = await import("next/cache");
  revalidatePath("/app");
}

async function updateProgress(
  itemId: string,
  currentPage: number,
  timeSpentMinutes: number,
) {
  "use server";

  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const dbUser = await prisma.user.upsert({
    where: { clerkId: user.id },
    update: {},
    create: { clerkId: user.id },
  });

  await prisma.item.update({
    where: {
      id: itemId,
      userId: dbUser.id,
    },
    data: {
      currentPage,
      timeSpentMinutes: { increment: Math.max(0, timeSpentMinutes) },
      lastReadAt: new Date(),
    },
  });

  const { revalidatePath } = await import("next/cache");
  revalidatePath("/app");
}

async function recategorizeItem(itemId: string, newContentType: string) {
  "use server";

  const user = await currentUser();
  if (!user) redirect("/sign-in");

  if (!["SPRINT", "SESSION", "JOURNEY"].includes(newContentType)) {
    return;
  }

  await prisma.item.update({
    where: { id: itemId },
    data: {
      contentType: newContentType as "SPRINT" | "SESSION" | "JOURNEY",
    },
  });

  const { revalidatePath } = await import("next/cache");
  revalidatePath("/app");
}

async function removeItem(itemId: string) {
  "use server";

  const user = await currentUser();
  if (!user) redirect("/sign-in");

  await prisma.item.delete({
    where: { id: itemId },
  });

  const { revalidatePath } = await import("next/cache");
  revalidatePath("/app");
}

export default async function AppHomePage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const dbUser = await prisma.user.upsert({
    where: { clerkId: user.id },
    update: {},
    create: {
      clerkId: user.id,
      onboardingCompleted: false,
      onboardingStep: 0,
      onboardingSkipped: false,
    },
  });

  const readwiseSource = await prisma.source.findFirst({
    where: { userId: dbUser.id, type: "READWISE" },
    select: { id: true, readwiseToken: true, lastSyncedAt: true },
  });

  // Sync Readwise progress if connected AND last sync was >1 hour ago
  // This prevents hitting rate limits on every page load with large libraries
  let lastReadwiseSyncAt: Date | null = readwiseSource?.lastSyncedAt || null;
  if (readwiseSource?.readwiseToken) {
    const now = new Date();
    const lastSyncMs = readwiseSource.lastSyncedAt
      ? now.getTime() - readwiseSource.lastSyncedAt.getTime()
      : Infinity;
    const oneHourMs = 60 * 60 * 1000;

    // Only sync if:
    // 1. Never synced before (initial setup), OR
    // 2. Last sync was >1 hour ago
    const shouldSync = lastSyncMs > oneHourMs;

    if (shouldSync) {
      try {
        console.log(
          `[Dashboard] Running Readwise sync (last sync: ${Math.round(lastSyncMs / 1000)}s ago)`,
        );
        const syncResult = await syncReadwiseProgress(
          dbUser.id,
          readwiseSource.readwiseToken,
          readwiseSource.lastSyncedAt || undefined,
        );
        await updateSourceLastSynced(
          readwiseSource.id,
          syncResult.lastSyncedAt,
        );
        lastReadwiseSyncAt = syncResult.lastSyncedAt;
        console.log(
          `[Dashboard] Readwise sync complete: ${syncResult.itemsUpdated} updated, ${syncResult.itemsCompleted} completed`,
        );
      } catch (error) {
        console.error("[Dashboard] Readwise sync failed:", error);
        // Continue with dashboard, sync failure is non-blocking
      }
    } else {
      console.log(
        `[Dashboard] Skipping Readwise sync (last sync: ${Math.round(lastSyncMs / 1000)}s ago, need 3600s)`,
      );
    }
  }

  // Get in-progress items
  const inProgressItems = await prisma.item.findMany({
    where: { userId: dbUser.id, status: "READING" },
    select: {
      id: true,
      title: true,
      url: true,
      contentType: true,
      createdAt: true,
      currentPage: true,
      totalPages: true,
      timeSpentMinutes: true,
      estimatedMinutes: true,
      coverUrl: true,
      readwiseDocumentId: true,
      lastReadAt: true,
    },
    orderBy: { lastReadAt: "desc" }, // Most recently read first
  });

  const allQueued = await prisma.item.findMany({
    where: { userId: dbUser.id, status: "QUEUED" },
    select: {
      id: true,
      title: true,
      url: true,
      contentType: true,
      createdAt: true,
      currentPage: true,
      totalPages: true,
      timeSpentMinutes: true,
      estimatedMinutes: true,
      coverUrl: true,
      readwiseDocumentId: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Get completed items in the last 7 days
  const completedLast7Days = await prisma.item.findMany({
    where: {
      userId: dbUser.id,
      status: "DONE",
      completedAt: {
        gte: sevenDaysAgo,
      },
    },
    select: {
      contentType: true,
      timeSpentMinutes: true,
    },
  });

  // Get in-progress items with time spent for diet calculation (to include ongoing book reading)
  const inProgressItemsForDiet = await prisma.item.findMany({
    where: {
      userId: dbUser.id,
      status: { in: ["READING", "QUEUED"] },
      timeSpentMinutes: { gt: 0 },
      // Only include items with recent activity in the last 7 days
      lastReadAt: {
        gte: sevenDaysAgo,
      },
    },
    select: {
      contentType: true,
      timeSpentMinutes: true,
    },
  });

  // Combine both completed and in-progress for diet calculation
  const allItemsForDiet = [...completedLast7Days, ...inProgressItemsForDiet];

  const sprintTime = allItemsForDiet
    .filter((i) => i.contentType === "SPRINT")
    .reduce((sum, i) => sum + (i.timeSpentMinutes || 0), 0);
  const sessionTime = allItemsForDiet
    .filter((i) => i.contentType === "SESSION")
    .reduce((sum, i) => sum + (i.timeSpentMinutes || 0), 0);
  const journeyTime = allItemsForDiet
    .filter((i) => i.contentType === "JOURNEY")
    .reduce((sum, i) => sum + (i.timeSpentMinutes || 0), 0);

  const totalTime = sprintTime + sessionTime + journeyTime;
  const sprintPercent = totalTime > 0 ? (sprintTime / totalTime) * 100 : 0;
  const sessionPercent = totalTime > 0 ? (sessionTime / totalTime) * 100 : 0;
  const journeyPercent = totalTime > 0 ? (journeyTime / totalTime) * 100 : 0;

  let suggestedContentType: "SPRINT" | "SESSION" | "JOURNEY" = "SESSION";
  let suggestion = "Try a focused Session next.";

  if (totalTime === 0) {
    suggestedContentType = "SPRINT";
    suggestion = "Start with a quick Sprint.";
  } else if (sprintPercent > 60) {
    // Too many Sprints - suggest Session or Journey
    suggestedContentType = journeyPercent < 30 ? "JOURNEY" : "SESSION";
    suggestion =
      journeyPercent < 30
        ? "You've been doing a lot of quick Sprints. Time for a deeper Journey."
        : "You've been doing a lot of quick Sprints. Try a focused Session.";
  } else if (sessionPercent > 60) {
    // Too many Sessions - suggest Sprint or Journey
    suggestedContentType = journeyPercent < 30 ? "JOURNEY" : "SPRINT";
    suggestion =
      journeyPercent < 30
        ? "You've had plenty of focused Sessions. Try a deep Journey."
        : "You've had plenty of focused Sessions. Grab a quick Sprint.";
  } else if (journeyPercent > 60) {
    // Too many Journeys - suggest Sprint or Session
    suggestedContentType = sprintPercent < 20 ? "SPRINT" : "SESSION";
    suggestion =
      sprintPercent < 20
        ? "You've been deep in Journeys. Grab a quick Sprint for variety."
        : "You've been deep in Journeys. Try a focused Session.";
  } else if (sprintPercent < 20) {
    // Need more Sprints
    suggestedContentType = "SPRINT";
    suggestion = "Add some variety with a quick Sprint.";
  } else if (sessionPercent < 20) {
    // Need more Sessions
    suggestedContentType = "SESSION";
    suggestion = "Balance your reading with a focused Session.";
  } else if (journeyPercent < 20) {
    // Need more Journeys
    suggestedContentType = "JOURNEY";
    suggestion = "Make room for a deep Journey.";
  }

  let suggestedItems = allQueued
    .filter((i) => i.contentType === suggestedContentType)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 3);

  // Generate AI summaries for suggested items
  const suggestedItemsWithSummaries = await Promise.all(
    suggestedItems.map(async (item) => {
      try {
        // Check if summary exists and is still fresh (< 7 days old)
        const dbItem = await prisma.item.findUnique({
          where: { id: item.id },
          select: {
            aiSummary: true,
            aiSummaryGeneratedAt: true,
          },
        });

        if (
          dbItem?.aiSummary &&
          isSummaryCacheValid(dbItem.aiSummaryGeneratedAt)
        ) {
          // Use cached summary
          return {
            ...item,
            aiSummary: dbItem.aiSummary,
          };
        }

        // Generate new summary
        const summary = await generateWhyReadThis(item, {
          sprintPercent,
          sessionPercent,
          journeyPercent,
          suggestion,
          suggestedContentType,
        });

        // Save summary to database
        await prisma.item.update({
          where: { id: item.id },
          data: {
            aiSummary: summary,
            aiSummaryGeneratedAt: new Date(),
          },
        });

        return {
          ...item,
          aiSummary: summary,
        };
      } catch (error) {
        console.error(`Failed to generate summary for item ${item.id}:`, error);
        return {
          ...item,
          aiSummary: null,
        };
      }
    }),
  );

  const dashboardData = {
    inProgressItems,
    allQueued,
    suggestedItems: suggestedItemsWithSummaries,
    suggestion,
    suggestedContentType,
    dietData: {
      sprintMinutes: sprintTime,
      sessionMinutes: sessionTime,
      journeyMinutes: journeyTime,
      totalMinutes: totalTime,
    },
    readwiseConnected: !!readwiseSource?.readwiseToken,
    lastReadwiseSyncAt,
    userEmail: user.emailAddresses?.[0]?.emailAddress || "",
    // Onboarding state
    showOnboarding: !dbUser.onboardingCompleted && !dbUser.onboardingSkipped,
    onboardingStep: dbUser.onboardingStep || 0,
  };

  return (
    <DashboardClient
      data={dashboardData}
      markItemDone={markItemDone}
      recategorizeItem={recategorizeItem}
      removeItem={removeItem}
    />
  );
}
