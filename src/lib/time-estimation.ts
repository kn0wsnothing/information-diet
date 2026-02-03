// Time estimation utilities for reading content

/**
 * Average reading speed: 1 page = 2 minutes (conservative for dense content)
 */
export const MINUTES_PER_PAGE = 2;

/**
 * Average reading speed: 200-250 words per minute
 */
export const WORDS_PER_MINUTE = 225;

/**
 * Estimate reading time based on page count
 * @param pages Number of pages
 * @returns Estimated minutes to read
 */
export function estimateTimeFromPages(pages: number): number {
  if (!pages || pages <= 0) return 0;
  return Math.round(pages * MINUTES_PER_PAGE);
}

/**
 * Estimate reading time based on word count
 * @param wordCount Number of words
 * @returns Estimated minutes to read
 */
export function estimateTimeFromWords(wordCount: number): number {
  if (!wordCount || wordCount <= 0) return 0;
  return Math.round(wordCount / WORDS_PER_MINUTE);
}

/**
 * Estimate word count from HTML content
 * Strips HTML tags and counts words
 * @param html HTML content string
 * @returns Estimated word count
 */
export function estimateWordCountFromHtml(html: string): number {
  if (!html) return 0;
  
  // Strip HTML tags
  const text = html.replace(/<[^>]*>/g, ' ');
  
  // Count words (split by whitespace and filter empty strings)
  const words = text.trim().split(/\s+/).filter(w => w.length > 0);
  
  return words.length;
}

/**
 * Get default estimated time based on macro type
 * Used as fallback when no other data is available
 */
export function getDefaultTimeForMacro(macro: string): number {
  switch (macro) {
    case 'SNACK':
      return 3; // 3 minutes for bite-sized content
    case 'MEAL':
      return 25; // 25 minutes for thoughtful reads
    case 'TIME_TESTED':
      return 60; // 60 minutes as starting point for books
    default:
      return 15;
  }
}

/**
 * Format minutes into human-readable time string
 */
export function formatReadingTime(minutes: number): string {
  if (minutes < 1) return '< 1 min';
  if (minutes < 60) return `${minutes} min`;
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

/**
 * Calculate percentage progress
 */
export function calculateProgress(current: number, total: number): number {
  if (!total || total <= 0) return 0;
  return Math.min(100, Math.round((current / total) * 100));
}
