/**
 * Reading time estimation utilities
 */

export interface TimeEstimate {
  estimatedMinutes: number;
  range: {
    min: number;
    max: number;
  };
  confidence: "high" | "medium" | "low";
  method: string;
}

// Average reading speeds (words per minute)
const READING_SPEEDS = {
  SNACK: 400, // Fast skimming
  MEAL: 250,  // Casual reading
  TIME_TESTED: 200,  // Deep reading, note-taking
} as const;

// Average words per page
const WORDS_PER_PAGE = 250;

/**
 * Estimate reading time based on page count
 */
export function estimateReadingTimeByPages(
  pages: number,
  macro: "SNACK" | "MEAL" | "TIME_TESTED"
): TimeEstimate {
  const readingSpeed = READING_SPEEDS[macro];
  const totalWords = pages * WORDS_PER_PAGE;
  
  const baseMinutes = Math.ceil(totalWords / readingSpeed);
  
  // Add variation based on complexity
  const variation = macro === "TIME_TESTED" ? 0.5 : 0.3;
  const minMinutes = Math.ceil(baseMinutes * (1 - variation));
  const maxMinutes = Math.ceil(baseMinutes * (1 + variation));

  return {
    estimatedMinutes: baseMinutes,
    range: { min: minMinutes, max: maxMinutes },
    confidence: macro === "SNACK" ? "high" : "medium",
    method: "Page count (250 wpm)",
  };
}

/**
 * Estimate reading time based on word count
 */
export function estimateReadingTimeByWords(
  words: number,
  macro: "SNACK" | "MEAL" | "TIME_TESTED"
): TimeEstimate {
  const readingSpeed = READING_SPEEDS[macro];
  const baseMinutes = Math.ceil(words / readingSpeed);
  
  const variation = macro === "TIME_TESTED" ? 0.4 : 0.25;
  const minMinutes = Math.ceil(baseMinutes * (1 - variation));
  const maxMinutes = Math.ceil(baseMinutes * (1 + variation));

  return {
    estimatedMinutes: baseMinutes,
    range: { min: minMinutes, max: maxMinutes },
    confidence: "high",
    method: "Word count",
  };
}

/**
 * Get default time estimate based on macro type
 */
export function getDefaultTimeEstimate(
  macro: "SNACK" | "MEAL" | "TIME_TESTED"
): TimeEstimate {
  const defaults = {
    SNACK: {
      estimatedMinutes: 5,
      range: { min: 2, max: 10 },
      confidence: "medium" as const,
      method: "Default snack estimate",
    },
    MEAL: {
      estimatedMinutes: 30,
      range: { min: 15, max: 45 },
      confidence: "medium" as const,
      method: "Default meal estimate",
    },
    TIME_TESTED: {
      estimatedMinutes: 180, // 3 hours
      range: { min: 60, max: 360 },
      confidence: "low" as const,
      method: "Default time-tested estimate",
    },
  };

  return defaults[macro];
}

/**
 * Calculate total reading time per macro type for items
 */
export function calculateTotalReadingTime(
  items: Array<{
    macro: string;
    totalPages?: number | null;
    timeSpentMinutes?: number | null;
  }>
): Record<string, number> {
  const totals: Record<string, number> = {
    SNACK: 0,
    MEAL: 0,
    TIME_TESTED: 0,
  };

  for (const item of items) {
    // Use actual time spent if available
    if (item.timeSpentMinutes) {
      totals[item.macro] = (totals[item.macro] || 0) + item.timeSpentMinutes;
    }
    // Otherwise estimate from page count
    else if (item.totalPages && item.macro === "TIME_TESTED") {
      const estimate = estimateReadingTimeByPages(
        item.totalPages,
        item.macro as any
      );
      totals[item.macro] = (totals[item.macro] || 0) + estimate.range.min;
    }
  }

  return totals;
}

/**
 * Format time in a human-readable way
 */
export function formatTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (mins === 0) {
    return `${hours} hr${hours > 1 ? "s" : ""}`;
  }
  
  return `${hours} hr ${mins} min`;
}

/**
 * Get time estimation for an item based on available metadata
 */
export function getItemTimeEstimate(
  item: {
    macro: string;
    totalPages?: number | null;
    wordCount?: number | null;
    timeSpentMinutes?: number | null;
  }
): TimeEstimate {
  // Return actual time if already spent
  if (item.timeSpentMinutes) {
    return {
      estimatedMinutes: item.timeSpentMinutes,
      range: { min: item.timeSpentMinutes, max: item.timeSpentMinutes },
      confidence: "high",
      method: "Actual time logged",
    };
  }

  // Estimate from page count
  if (item.totalPages && item.totalPages > 0) {
    return estimateReadingTimeByPages(
      item.totalPages,
      item.macro as "SNACK" | "MEAL" | "TIME_TESTED"
    );
  }

  // Estimate from word count
  if (item.wordCount && item.wordCount > 0) {
    return estimateReadingTimeByWords(
      item.wordCount,
      item.macro as "SNACK" | "MEAL" | "TIME_TESTED"
    );
  }

  // Use default estimate
  return getDefaultTimeEstimate(
    item.macro as "SNACK" | "MEAL" | "TIME_TESTED"
  );
}
