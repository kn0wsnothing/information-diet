import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { DashboardClient } from "./dashboard-client";

async function markItemDone(itemId: string, timeSpentMinutes: number, finished?: boolean) {
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

async function recategorizeItem(itemId: string, newMacro: string) {
  "use server";

  const user = await currentUser();
  if (!user) redirect("/sign-in");

  if (!["SNACK", "MEAL", "TIME_TESTED"].includes(newMacro)) {
    return;
  }

  await prisma.item.update({
    where: { id: itemId },
    data: {
      macro: newMacro as "SNACK" | "MEAL" | "TIME_TESTED",
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
    create: { clerkId: user.id },
  });

  const readwiseSource = await prisma.source.findFirst({
    where: { userId: dbUser.id, type: "READWISE" },
    select: { id: true, readwiseToken: true, lastSyncedAt: true },
  });

  const allQueued = await prisma.item.findMany({
    where: { userId: dbUser.id, status: "QUEUED" },
    select: {
      id: true,
      title: true,
      url: true,
      macro: true,
      createdAt: true,
      currentPage: true,
      totalPages: true,
      timeSpentMinutes: true,
      estimatedMinutes: true,
      coverUrl: true,
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
      macro: true,
      timeSpentMinutes: true,
    },
  });

  // Get in-progress items with time spent (to include ongoing book reading)
  const inProgressItems = await prisma.item.findMany({
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
      macro: true,
      timeSpentMinutes: true,
    },
  });

  // Combine both completed and in-progress for diet calculation
  const allItemsForDiet = [...completedLast7Days, ...inProgressItems];

  const snackTime = allItemsForDiet
    .filter((i) => i.macro === "SNACK")
    .reduce((sum, i) => sum + (i.timeSpentMinutes || 0), 0);
  const mealTime = allItemsForDiet
    .filter((i) => i.macro === "MEAL")
    .reduce((sum, i) => sum + (i.timeSpentMinutes || 0), 0);
  const timeTestedTime = allItemsForDiet
    .filter((i) => i.macro === "TIME_TESTED")
    .reduce((sum, i) => sum + (i.timeSpentMinutes || 0), 0);

  const totalTime = snackTime + mealTime + timeTestedTime;
  const snackPercent = totalTime > 0 ? (snackTime / totalTime) * 100 : 0;
  const mealPercent = totalTime > 0 ? (mealTime / totalTime) * 100 : 0;
  const timeTestedPercent = totalTime > 0 ? (timeTestedTime / totalTime) * 100 : 0;

  let suggestedMacro: "SNACK" | "MEAL" | "TIME_TESTED" = "MEAL";
  let suggestion = "Try a thoughtful read next.";

  if (totalTime === 0) {
    suggestedMacro = "SNACK";
    suggestion = "Start with a quick bite-sized read.";
  } else if (snackPercent > 60) {
    // Too many snacks - suggest thoughtful or time-tested
    suggestedMacro = timeTestedPercent < 30 ? "TIME_TESTED" : "MEAL";
    suggestion = timeTestedPercent < 30 
      ? "You've been snacking a lot. Time for something deeper."
      : "You've been snacking a lot. Try a thoughtful read.";
  } else if (mealPercent > 60) {
    // Too many meals - suggest bite-sized or time-tested
    suggestedMacro = timeTestedPercent < 30 ? "TIME_TESTED" : "SNACK";
    suggestion = timeTestedPercent < 30
      ? "You've had plenty of thoughtful reads. Try something time-tested."
      : "You've had plenty of thoughtful reads. Grab something quick.";
  } else if (timeTestedPercent > 60) {
    // Too many time-tested - suggest bite-sized or thoughtful
    suggestedMacro = snackPercent < 20 ? "SNACK" : "MEAL";
    suggestion = snackPercent < 20
      ? "You've been deep in books. Grab a quick read for variety."
      : "You've been deep in books. Try a thoughtful read.";
  } else if (snackPercent < 20) {
    // Need more snacks
    suggestedMacro = "SNACK";
    suggestion = "Add some variety with a quick bite-sized read.";
  } else if (mealPercent < 20) {
    // Need more meals
    suggestedMacro = "MEAL";
    suggestion = "Balance your diet with a thoughtful read.";
  } else if (timeTestedPercent < 20) {
    // Need more time-tested
    suggestedMacro = "TIME_TESTED";
    suggestion = "Make room for something time-tested.";
  }

  const suggestedItems = allQueued
    .filter((i) => i.macro === suggestedMacro)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  const dashboardData = {
    allQueued,
    suggestedItems,
    suggestion,
    suggestedMacro,
    dietData: {
      snackMinutes: snackTime,
      mealMinutes: mealTime,
      timeTestedMinutes: timeTestedTime,
      totalMinutes: totalTime,
    },
    readwiseConnected: !!readwiseSource?.readwiseToken,
    userEmail: user.emailAddresses?.[0]?.emailAddress || "",
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
