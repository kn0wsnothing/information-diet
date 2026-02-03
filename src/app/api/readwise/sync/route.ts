import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchReadwiseDocuments, inferContentTypeFromReadwise, inferMacroFromReadwise, parseReadingTime } from "@/lib/readwise";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

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

  try {
    // Fetch documents from both "Later" and "Shortlist"
    const locations = ["later", "shortlist"];
    let allDocuments: any[] = [];

    for (const location of locations) {
      console.log(`Readwise: Fetching from "${location}"...`);
      const docs = await fetchReadwiseDocuments({
        token: source.readwiseToken,
        location,
        maxResults: 50, // 50 per location
      });
      allDocuments = allDocuments.concat(docs);
    }

    console.log(`Readwise: Found ${allDocuments.length} total documents to sync`);

    let itemsAdded = 0;
    let itemsSkipped = 0;

    for (const doc of allDocuments) {
      // Check if item already exists
      const existing = await prisma.item.findFirst({
        where: {
          userId: dbUser.id,
          OR: [
            { readwiseDocumentId: doc.id },
            { url: doc.source_url || undefined },
          ],
        },
      });

      if (existing) {
        itemsSkipped++;
        continue;
      }

      // Infer category
      const macro = inferMacroFromReadwise(doc);
      const contentType = inferContentTypeFromReadwise(doc);

      // Create item
      await prisma.item.create({
        data: {
          userId: dbUser.id,
          sourceId: source.id,
          title: doc.title || doc.source_url || "Untitled",
          url: doc.source_url || null,
          author: doc.author || null,
          macro,
          contentType,
          status: "QUEUED",
          readwiseDocumentId: doc.id,
          readwiseLocation: doc.location || null,
          wordCount: doc.word_count || null,
          estimatedMinutes: parseReadingTime(doc.reading_time),
          publishedDate: doc.published_date ? new Date(doc.published_date) : null,
          coverUrl: null, // Readwise API doesn't provide cover images
        },
      });

      itemsAdded++;
    }

    console.log(`Readwise sync complete: ${itemsAdded} added, ${itemsSkipped} skipped`);

    return NextResponse.json({
      success: true,
      itemsAdded,
      itemsSkipped,
      totalDocuments: allDocuments.length,
    });
  } catch (error) {
    console.error("Readwise sync error:", error);
    return new NextResponse(
      error instanceof Error ? error.message : "Sync failed",
      { status: 500 }
    );
  }
}
