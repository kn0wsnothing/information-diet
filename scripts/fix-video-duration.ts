/**
 * Fix the video item with correct duration
 * Run with: npx tsx scripts/fix-video-duration.ts
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
    console.log("❌ Item not found");
    return;
  }

  console.log("\n📺 Current State:");
  console.log(`Title: ${item.title}`);
  console.log(`Category: ${item.macro} (${item.contentType})`);
  console.log(`Duration: ${item.estimatedMinutes || 'not set'} minutes\n`);

  // Update with 8 hours = 480 minutes
  const durationMinutes = 480; // 8 hours
  
  await prisma.item.update({
    where: { id: item.id },
    data: {
      estimatedMinutes: durationMinutes,
      macro: "TIME_TESTED", // 480 min >= 45 min threshold
      contentType: "JOURNEY",
    },
  });

  console.log("✅ Updated to:");
  console.log(`Duration: ${durationMinutes} minutes (8 hours)`);
  console.log(`Category: TIME_TESTED (JOURNEY)`);
  console.log("\nThe video is now correctly categorized as a Journey! 🗺️\n");
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
