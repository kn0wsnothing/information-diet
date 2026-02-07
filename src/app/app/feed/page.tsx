import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { FeedClient } from "./feed-client";
import * as feedActions from "./actions";

export default async function FeedPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const dbUser = await prisma.user.upsert({
    where: { clerkId: user.id },
    update: {},
    create: { clerkId: user.id },
  });

  const allQueued = await prisma.item.findMany({
    where: { userId: dbUser.id, status: "QUEUED" },
    orderBy: { createdAt: "desc" },
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
      readwiseDocumentId: true,
    },
  });

  return (
    <FeedClient
      allQueued={allQueued}
      markItemDone={feedActions.markItemDone}
      recategorizeItem={feedActions.recategorizeItem}
      removeItem={feedActions.removeItem}
    />
  );
}
