"use server";

import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function logReadingSession(formData: FormData) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const itemId = String(formData.get("itemId") ?? "").trim();
  const minutesSpent = formData.get("minutesSpent") ? parseInt(String(formData.get("minutesSpent"))) : 15;
  const pagesRead = formData.get("pagesRead") ? parseInt(String(formData.get("pagesRead"))) : null;
  const newCurrentPage = formData.get("newCurrentPage") ? parseInt(String(formData.get("newCurrentPage"))) : null;

  if (!itemId) {
    return { success: false, error: "Item ID required" };
  }

  const dbUser = await prisma.user.upsert({
    where: { clerkId: user.id },
    update: {},
    create: { clerkId: user.id },
  });

  // Get the item to check if it exists
  const item = await prisma.item.findFirst({
    where: { id: itemId, userId: dbUser.id },
  });

  if (!item) {
    return { success: false, error: "Item not found" };
  }

  // Create reading session
  await prisma.readingSession.create({
    data: {
      itemId,
      minutesSpent,
      pagesRead: pagesRead && pagesRead > 0 ? pagesRead : null,
    },
  });

  // Update item's time spent and reading metadata
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Check if last read was yesterday to maintain streak
  const lastReadAt = item.lastReadAt;
  let readingStreak = item.readingStreak || 0;

  if (lastReadAt) {
    const lastReadDay = new Date(lastReadAt);
    lastReadDay.setHours(0, 0, 0, 0);
    
    // If last read was today, streak continues
    // If last read was yesterday, increment streak
    // If last read was earlier, streak resets to 1
    const diffDays = Math.floor((today.getTime() - lastReadDay.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      readingStreak = item.readingStreak || 1;
    } else if (diffDays === 1) {
      readingStreak = (item.readingStreak || 0) + 1;
    } else {
      readingStreak = 1;
    }
  } else {
    readingStreak = 1;
  }

  // Update item
  const updateData: any = {
    status: "READING", // Mark as in-progress when logging any session
    timeSpentMinutes: { increment: minutesSpent },
    lastReadAt: now,
    readingStreak: readingStreak,
    dailySessions: { increment: 1 },
  };

  // Update page progress
  if (newCurrentPage !== null) {
    // Absolute page update
    updateData.currentPage = newCurrentPage;
  } else if (pagesRead && pagesRead > 0 && item.totalPages) {
    // Incremental page update
    updateData.currentPage = { increment: pagesRead };
  }

  await prisma.item.update({
    where: { id: itemId },
    data: updateData,
  });

  revalidatePath("/app");
  revalidatePath("/app/feed");
  
  return { success: true, minutesSpent, pagesRead };
}

export async function startReading(itemId: string) {
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
      status: "READING",
      readingStartedAt: new Date(),
    },
  });

  revalidatePath("/app");
  return { success: true };
}

export async function pauseReading(itemId: string) {
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
      status: "QUEUED",
    },
  });

  revalidatePath("/app");
  return { success: true };
}

export async function getReadingProgress(itemId: string) {
  const user = await currentUser();
  if (!user) return null;

  const dbUser = await prisma.user.upsert({
    where: { clerkId: user.id },
    update: {},
    create: { clerkId: user.id },
  });

  const item = await prisma.item.findUnique({
    where: { id: itemId, userId: dbUser.id },
    include: {
      sessions: {
        orderBy: { date: 'desc' },
        take: 5,
      },
    },
  });

  return item;
}
