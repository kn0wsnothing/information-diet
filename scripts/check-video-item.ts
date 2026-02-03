/**
 * Check the video item to see what data we have
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const item = await prisma.item.findFirst({
    where: {
      title: {
        contains: "Vibe Code Camp",
      },
    },
  });

  if (!item) {
    console.log("Item not found");
    return;
  }

  console.log("\n📺 Video Item Details:");
  console.log("=".repeat(50));
  console.log(`Title: ${item.title}`);
  console.log(`URL: ${item.url}`);
  console.log(`Readwise ID: ${item.readwiseDocumentId}`);
  console.log(`Current Category: ${item.macro} (${item.contentType})`);
  console.log(`Estimated Minutes: ${item.estimatedMinutes}`);
  console.log(`Word Count: ${item.wordCount}`);
  console.log("=".repeat(50));
  
  // Check if we can get the reading_time from Readwise API
  const source = await prisma.source.findFirst({
    where: {
      userId: item.userId,
      type: "READWISE",
    },
  });

  if (source?.readwiseToken && item.readwiseDocumentId) {
    console.log("\n🔍 Fetching from Readwise API...");
    
    const res = await fetch(`https://readwise.io/api/v3/list/?id=${item.readwiseDocumentId}`, {
      headers: {
        Authorization: `Token ${source.readwiseToken}`,
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const doc = data.results[0];
        console.log("\n📊 Readwise Data:");
        console.log(`Category: ${doc.category}`);
        console.log(`Reading Time: ${doc.reading_time}`);
        console.log(`Word Count: ${doc.word_count}`);
      }
    }
  }
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
