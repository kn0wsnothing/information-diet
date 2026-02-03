import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AnalyticsClient } from "./analytics-client";

export default async function AnalyticsPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const dbUser = await prisma.user.upsert({
    where: { clerkId: user.id },
    update: {},
    create: { clerkId: user.id },
  });

  // Helper function to get diet data for a time period
  async function getDietData(daysAgo: number) {
    const startDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

    // Get completed items in period
    const completedItems = await prisma.item.findMany({
      where: {
        userId: dbUser.id,
        status: "DONE",
        completedAt: {
          gte: startDate,
        },
      },
      select: {
        id: true,
        title: true,
        macro: true,
        timeSpentMinutes: true,
        completedAt: true,
      },
    });

    // Get in-progress items with activity in period
    const inProgressItems = await prisma.item.findMany({
      where: {
        userId: dbUser.id,
        status: { in: ["READING", "QUEUED"] },
        timeSpentMinutes: { gt: 0 },
        lastReadAt: {
          gte: startDate,
        },
      },
      select: {
        id: true,
        title: true,
        macro: true,
        timeSpentMinutes: true,
        lastReadAt: true,
      },
    });

    const allItems = [...completedItems, ...inProgressItems];

    const snackTime = allItems
      .filter((i) => i.macro === "SNACK")
      .reduce((sum, i) => sum + (i.timeSpentMinutes || 0), 0);
    const mealTime = allItems
      .filter((i) => i.macro === "MEAL")
      .reduce((sum, i) => sum + (i.timeSpentMinutes || 0), 0);
    const timeTestedTime = allItems
      .filter((i) => i.macro === "TIME_TESTED")
      .reduce((sum, i) => sum + (i.timeSpentMinutes || 0), 0);

    const totalMinutes = snackTime + mealTime + timeTestedTime;

    return {
      snackMinutes: snackTime,
      mealMinutes: mealTime,
      timeTestedMinutes: timeTestedTime,
      totalMinutes,
      snackPercent: totalMinutes > 0 ? Math.round((snackTime / totalMinutes) * 100) : 0,
      mealPercent: totalMinutes > 0 ? Math.round((mealTime / totalMinutes) * 100) : 0,
      timeTestedPercent: totalMinutes > 0 ? Math.round((timeTestedTime / totalMinutes) * 100) : 0,
      completedCount: completedItems.length,
      items: completedItems.map(item => ({
        id: item.id,
        title: item.title,
        macro: item.macro,
        timeSpent: item.timeSpentMinutes || 0,
        completedAt: item.completedAt,
      })),
    };
  }

  // Get data for all three time periods
  const [data7Days, data14Days, data21Days] = await Promise.all([
    getDietData(7),
    getDietData(14),
    getDietData(21),
  ]);

  // Get reading streak data
  const allItems = await prisma.item.findMany({
    where: {
      userId: dbUser.id,
      lastReadAt: { not: null },
    },
    select: {
      lastReadAt: true,
      readingStreak: true,
    },
    orderBy: {
      lastReadAt: "desc",
    },
    take: 1,
  });

  const currentStreak = allItems[0]?.readingStreak || 0;

  // Get currently reading items
  const currentlyReading = await prisma.item.findMany({
    where: {
      userId: dbUser.id,
      status: { in: ["READING", "QUEUED"] },
      OR: [
        { timeSpentMinutes: { gt: 0 } },
        { currentPage: { gt: 0 } },
      ],
    },
    select: {
      id: true,
      title: true,
      macro: true,
      currentPage: true,
      totalPages: true,
    },
  });

  const analyticsData = {
    periods: {
      "7": data7Days,
      "14": data14Days,
      "21": data21Days,
    },
    currentStreak,
    currentlyReading: {
      books: currentlyReading.filter(i => i.macro === "TIME_TESTED").length,
      articles: currentlyReading.filter(i => i.macro !== "TIME_TESTED").length,
    },
  };

  return <AnalyticsClient data={analyticsData} />;
}
