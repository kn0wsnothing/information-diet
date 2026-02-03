import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { parseRSSFeed, inferMacroFromRSSItem, extractArticleMetadata } from "@/lib/rss";
import { mapMacroToContentType } from "@/lib/content-types";

const BodySchema = z.object({
  feedId: z.string().optional(),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json || {});
  
  const dbUser = await prisma.user.upsert({
    where: { clerkId: userId },
    update: {},
    create: { clerkId: userId },
  });

  let sources;

  if (parsed.success && parsed.data.feedId) {
    // Sync specific feed
    sources = await prisma.source.findMany({
      where: {
        userId: dbUser.id,
        id: parsed.data.feedId,
        type: "RSS",
        feedUrl: { not: null },
      },
    });
  } else {
    // Sync all RSS feeds
    sources = await prisma.source.findMany({
      where: {
        userId: dbUser.id,
        type: "RSS",
        feedUrl: { not: null },
      },
    });
  }

  let totalItemsAdded = 0;

  for (const source of sources) {
    if (!source.feedUrl) continue;

    try {
      const feedData = await parseRSSFeed(source.feedUrl);
      if (!feedData) continue;

      // Only sync items from the last 7 days to avoid flooding
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const newItems = await Promise.all(
        feedData.items.map(async (item) => {
          const metadata = extractArticleMetadata(item);
          const macro = inferMacroFromRSSItem(item, feedData.title);
          const contentType = mapMacroToContentType(macro);

          // Check if item already exists
          const existing = await prisma.item.findFirst({
            where: {
              userId: dbUser.id,
              url: item.link,
            },
          });

          if (existing) {
            return null;
          }

          return {
            userId: dbUser.id,
            sourceId: source.id,
            title: item.title,
            url: item.link,
            author: metadata.author,
            publishedDate: metadata.publishedDate,
            macro: macro,
            contentType: contentType,
            status: "QUEUED" as const,
            readwiseDocumentId: null,
            readwiseLocation: null,
            completedAt: null,
            timeSpentMinutes: 0,
            wordCount: item.wordCount || null,
            estimatedMinutes: item.estimatedMinutes || null,
          };
        })
      );

      const validItems = newItems.filter(Boolean);
      
      if (validItems.length > 0) {
        await prisma.item.createMany({
          data: validItems as any[],
        });
        totalItemsAdded += validItems.length;
      }

      // Update last synced time
      await prisma.source.update({
        where: { id: source.id },
        data: { lastSyncedAt: new Date() },
      });
    } catch (error) {
      console.error(`Error syncing RSS feed ${source.name}:`, error);
    }
  }

  return NextResponse.json({ 
    ok: true,
    itemsAdded: totalItemsAdded,
  });
}

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const dbUser = await prisma.user.upsert({
    where: { clerkId: userId },
    update: {},
    create: { clerkId: userId },
  });

  const sources = await prisma.source.findMany({
    where: {
      userId: dbUser.id,
      type: "RSS",
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      feedUrl: true,
      lastSyncedAt: true,
      createdAt: true,
      _count: {
        select: {
          items: true,
        },
      },
    },
  });

  return NextResponse.json({ sources });
}
