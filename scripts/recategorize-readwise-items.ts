/**
 * Recategorize all Readwise items based on updated logic
 * Run with: npx tsx scripts/recategorize-readwise-items.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function parseReadingMinutes(readingTime: string | null): number | null {
  if (!readingTime) return null;
  
  // Try to parse hours first (e.g., "8 hours", "1.5 hours", "8h")
  const hoursMatch = readingTime.match(/(\d+(?:\.\d+)?)\s*(?:hour|hr|h)(?:s)?/i);
  if (hoursMatch) {
    const hours = Number(hoursMatch[1]);
    return Number.isFinite(hours) ? Math.round(hours * 60) : null;
  }
  
  // Parse minutes (e.g., "45 min", "45 minutes")
  const minMatch = readingTime.match(/(\d+)\s*(?:min|minute)(?:s)?/i);
  if (minMatch) {
    const mins = Number(minMatch[1]);
    return Number.isFinite(mins) ? mins : null;
  }
  
  // Try to parse "HH:MM" format (e.g., "8:30")
  const timeMatch = readingTime.match(/(\d+):(\d+)/);
  if (timeMatch) {
    const hours = Number(timeMatch[1]);
    const mins = Number(timeMatch[2]);
    return Number.isFinite(hours) && Number.isFinite(mins) ? (hours * 60 + mins) : null;
  }
  
  return null;
}

function inferMacro(estimatedMinutes: number | null, wordCount: number | null): "SNACK" | "MEAL" | "TIME_TESTED" {
  // Check duration first
  if (estimatedMinutes !== null) {
    if (estimatedMinutes <= 6) return "SNACK";
    if (estimatedMinutes >= 45) return "TIME_TESTED";
    return "MEAL";
  }

  // Word count fallback
  if (wordCount !== null) {
    if (wordCount <= 900) return "SNACK";
    if (wordCount >= 12000) return "TIME_TESTED";
    return "MEAL";
  }

  return "MEAL";
}

function mapMacroToContentType(macro: string): "SPRINT" | "SESSION" | "JOURNEY" {
  if (macro === "SNACK") return "SPRINT";
  if (macro === "TIME_TESTED") return "JOURNEY";
  return "SESSION";
}

async function main() {
  console.log("Starting recategorization of Readwise items...\n");

  // Find all items from Readwise
  const readwiseItems = await prisma.item.findMany({
    where: {
      readwiseDocumentId: { not: null },
    },
    select: {
      id: true,
      title: true,
      macro: true,
      contentType: true,
      estimatedMinutes: true,
      wordCount: true,
    },
  });

  console.log(`Found ${readwiseItems.length} Readwise items\n`);

  let updated = 0;
  let skipped = 0;

  for (const item of readwiseItems) {
    const newMacro = inferMacro(item.estimatedMinutes, item.wordCount);
    const newContentType = mapMacroToContentType(newMacro);

    if (item.macro !== newMacro || item.contentType !== newContentType) {
      console.log(`📝 Updating: "${item.title}"`);
      console.log(`   ${item.estimatedMinutes ? `${item.estimatedMinutes} min` : 'no duration'} | ${item.wordCount ? `${item.wordCount} words` : 'no word count'}`);
      console.log(`   ${item.macro} → ${newMacro}`);
      console.log(`   ${item.contentType} → ${newContentType}\n`);

      await prisma.item.update({
        where: { id: item.id },
        data: {
          macro: newMacro,
          contentType: newContentType,
        },
      });

      updated++;
    } else {
      skipped++;
    }
  }

  console.log(`\n✅ Complete!`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Total: ${readwiseItems.length}`);
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
