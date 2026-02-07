/**
 * AI summary generation for reading items
 * Generates contextual "why you should read this" summaries based on user's diet
 */

import { generateCompletion } from "./openrouter";

export interface DietContext {
  sprintPercent: number;
  sessionPercent: number;
  journeyPercent: number;
  suggestion: string;
  suggestedContentType: "SPRINT" | "SESSION" | "JOURNEY";
}

export interface ItemForSummary {
  id: string;
  title: string;
  author?: string | null;
  contentType: string;
  estimatedMinutes?: number | null;
  wordCount?: number | null;
  url?: string | null;
}

/**
 * Generate a contextual "why you should read this" summary
 * Takes into account the user's reading diet balance
 */
export async function generateWhyReadThis(
  item: ItemForSummary,
  dietContext: DietContext
): Promise<string> {
  const contentTypeLabel = {
    SPRINT: "quick read (2-5 minutes)",
    SESSION: "focused read (15-45 minutes)",
    JOURNEY: "deep read (hours/days)",
  }[item.contentType] || item.contentType;

  const dietSummary = `You've been reading ${Math.round(dietContext.sprintPercent)}% quick reads, ${Math.round(dietContext.sessionPercent)}% focused reads, and ${Math.round(dietContext.journeyPercent)}% deep reads.`;

  const prompt = `You are a reading recommendation assistant for an app called "Information Diet" that helps users balance their reading consumption.

Given this reading item and the user's current reading patterns, write a brief 1-2 sentence explanation of why they should read this now. Be conversational and specific to their situation.

Item:
- Title: "${item.title}"
- Type: ${contentTypeLabel}
${item.author ? `- Author: ${item.author}` : ""}
${item.estimatedMinutes ? `- Reading time: ~${item.estimatedMinutes} minutes` : ""}

User's reading diet:
${dietSummary}

Reason for suggestion: ${dietContext.suggestion}

Write only the explanation, no preamble. Keep it to 1-2 sentences max. Be encouraging and friendly.`;

  try {
    const result = await generateCompletion(prompt, {
      temperature: 0.8,
      maxTokens: 150,
    });

    return result.content.trim();
  } catch (error) {
    console.error("Failed to generate AI summary:", error);
    throw error;
  }
}

/**
 * Check if a cached summary is still valid (not older than 7 days)
 */
export function isSummaryCacheValid(generatedAt: Date | null): boolean {
  if (!generatedAt) return false;

  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const ageMs = Date.now() - generatedAt.getTime();

  return ageMs < sevenDaysMs;
}
