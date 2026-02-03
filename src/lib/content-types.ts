// Content type utilities for time investment framework

import { MacroType } from "@prisma/client";

export type ContentType = "SPRINT" | "SESSION" | "JOURNEY";

export interface ContentTypeInfo {
  type: ContentType;
  label: string;
  icon: string;
  timeRange: string;
  description: string;
  color: {
    bg: string;
    accent: string;
    text: string;
  };
}

export const CONTENT_TYPES: Record<ContentType, ContentTypeInfo> = {
  SPRINT: {
    type: "SPRINT",
    label: "Sprint",
    icon: "⚡",
    timeRange: "2-5 min",
    description: "Quick updates and news",
    color: {
      bg: "bg-sky-50",
      accent: "bg-sky-500",
      text: "text-sky-900",
    },
  },
  SESSION: {
    type: "SESSION",
    label: "Session",
    icon: "🎯",
    timeRange: "15-45 min",
    description: "Focused reads and essays",
    color: {
      bg: "bg-indigo-100",
      accent: "bg-indigo-500",
      text: "text-indigo-900",
    },
  },
  JOURNEY: {
    type: "JOURNEY",
    label: "Journey",
    icon: "🗺️",
    timeRange: "Hours/days",
    description: "Deep exploration and books",
    color: {
      bg: "bg-slate-800",
      accent: "bg-slate-600",
      text: "text-white",
    },
  },
};

/**
 * Get content type from item (handles backward compatibility)
 */
export function getContentType(item: {
  contentType?: string | null;
  macro?: string | null;
}): ContentType {
  if (item.contentType) {
    return item.contentType as ContentType;
  }
  // Fallback to macro for backward compatibility
  return mapMacroToContentType(item.macro as MacroType);
}

/**
 * Map old macro types to new content types
 */
export function mapMacroToContentType(macro: MacroType | string | null): ContentType {
  const map: Record<string, ContentType> = {
    SNACK: "SPRINT",
    MEAL: "SESSION",
    TIME_TESTED: "JOURNEY",
  };
  return map[macro || "MEAL"] || "SESSION";
}

/**
 * Get content type info
 */
export function getContentTypeInfo(type: ContentType): ContentTypeInfo {
  return CONTENT_TYPES[type];
}

/**
 * Categorize content by word count
 */
export function categorizeByWordCount(wordCount: number): ContentType {
  if (wordCount < 500) return "SPRINT"; // < 2-3 min
  if (wordCount < 3000) return "SESSION"; // 10-15 min
  return "JOURNEY"; // 15+ min (though rarely applicable to articles)
}

/**
 * Categorize content by URL patterns
 */
export function categorizeByUrl(url: string): ContentType {
  const urlLower = url.toLowerCase();

  // Twitter, social → SPRINT
  if (
    urlLower.includes("twitter.com") ||
    urlLower.includes("x.com") ||
    urlLower.includes("reddit.com")
  ) {
    return "SPRINT";
  }

  // Substack, Medium → SESSION
  if (urlLower.includes("substack.com") || urlLower.includes("medium.com")) {
    return "SESSION";
  }

  // Academic, research → JOURNEY
  if (
    urlLower.includes("arxiv.org") ||
    urlLower.includes(".pdf") ||
    urlLower.includes("scholar.google")
  ) {
    return "JOURNEY";
  }

  // Default: SESSION (safest middle ground)
  return "SESSION";
}

/**
 * Get label for UI display (replaces old macro labels)
 */
export function getContentTypeLabel(type: ContentType): string {
  return CONTENT_TYPES[type].label;
}

/**
 * Get icon for content type
 */
export function getContentTypeIcon(type: ContentType): string {
  return CONTENT_TYPES[type].icon;
}

/**
 * Get label with icon for UI display
 */
export function getContentTypeLabelWithIcon(type: ContentType): string {
  return `${CONTENT_TYPES[type].icon} ${CONTENT_TYPES[type].label}`;
}

/**
 * Map old macro type to new label (for backward compatibility)
 */
export function getMacroLabel(macro: string): string {
  const map: Record<string, string> = {
    SNACK: "⚡ Sprint",
    MEAL: "🎯 Session",
    TIME_TESTED: "🗺️ Journey",
  };
  return map[macro] || "🎯 Session";
}
