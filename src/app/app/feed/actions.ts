"use server";

import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function markItemDone(itemId: string, timeSpentMinutes: number, finished?: boolean) {
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

  revalidatePath("/app/feed");
  revalidatePath("/app");
}

export async function recategorizeItem(itemId: string, newContentType: string) {
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

  revalidatePath("/app/feed");
  revalidatePath("/app");
}

export async function removeItem(itemId: string) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  await prisma.item.delete({
    where: { id: itemId },
  });

  revalidatePath("/app/feed");
  revalidatePath("/app");
}
