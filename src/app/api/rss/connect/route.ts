import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { validateRSSFeed, parseRSSFeed, inferMacroFromRSSItem, extractArticleMetadata } from "@/lib/rss";

const BodySchema = z.object({
  feedUrl: z.string().url(),
  name: z.string().min(1).optional(),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) return new NextResponse("Bad Request", { status: 400 });

  const { feedUrl, name: providedName } = parsed.data;

  // Validate the RSS feed
  const validation = await validateRSSFeed(feedUrl);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  // Check if feed already exists for this user
  const dbUser = await prisma.user.upsert({
    where: { clerkId: userId },
    update: {},
    create: { clerkId: userId },
  });

  const existingSource = await prisma.source.findFirst({
    where: {
      userId: dbUser.id,
      type: "RSS",
      feedUrl: feedUrl,
    },
  });

  if (existingSource) {
    return NextResponse.json({ error: "RSS feed already connected" }, { status: 409 });
  }

  // Create the RSS source
  const source = await prisma.source.create({
    data: {
      userId: dbUser.id,
      type: "RSS",
      name: providedName || validation.feedTitle,
      feedUrl: feedUrl,
      lastSyncedAt: null,
    },
  });

  // Perform initial sync
  const feedData = await parseRSSFeed(feedUrl);
  if (feedData) {
    const items = await Promise.all(
      feedData.items.slice(0, 10).map(async (item) => {
        const metadata = extractArticleMetadata(item);
        const macro = inferMacroFromRSSItem(item, feedData.title);

        // Check if item already exists (by URL)
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
          status: "QUEUED" as const,
          readwiseDocumentId: null,
          readwiseLocation: null,
          completedAt: null,
          timeSpentMinutes: 0,
        };
      })
    );

    const validItems = items.filter(Boolean);
    
    if (validItems.length > 0) {
      await prisma.item.createMany({
        data: validItems as any[],
      });
    }

    // Update last synced time
    await prisma.source.update({
      where: { id: source.id },
      data: { lastSyncedAt: new Date() },
    });
  }

  return NextResponse.json({ 
    ok: true,
    feedId: source.id,
    feedName: source.name,
    itemsImported: feedData?.items.length || 0,
  });
}
