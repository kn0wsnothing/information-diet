import Parser from 'rss-parser';
import { estimateWordCountFromHtml, estimateTimeFromWords } from './time-estimation';

export type RSSFeed = {
  title: string;
  description?: string;
  items: RSSFeedItem[];
};

export type RSSFeedItem = {
  title: string;
  link: string;
  pubDate?: string;
  content?: string;
  contentSnippet?: string;
  author?: string;
  guid?: string;
  wordCount?: number;
  estimatedMinutes?: number;
};

const parser = new Parser({
  timeout: 10000,
  customFields: {
    item: [
      ['content:encoded', 'content'],
      ['author', 'author'],
      ['guid', 'guid'],
    ],
  },
});

export async function parseRSSFeed(feedUrl: string): Promise<RSSFeed | null> {
  try {
    const feed = await parser.parseURL(feedUrl);
    
    return {
      title: feed.title || 'Untitled Feed',
      description: feed.description,
      items: feed.items.map((item) => {
        const content = item.content || item['content:encoded'] || '';
        const wordCount = content ? estimateWordCountFromHtml(content) : 0;
        const estimatedMinutes = wordCount > 0 ? estimateTimeFromWords(wordCount) : undefined;

        return {
          title: item.title || 'Untitled',
          link: item.link || '',
          pubDate: item.pubDate,
          content,
          contentSnippet: item.contentSnippet || item.summary,
          author: item.creator || item.author,
          guid: item.guid,
          wordCount,
          estimatedMinutes,
        };
      }),
    };
  } catch (error) {
    console.error(`Error parsing RSS feed ${feedUrl}:`, error);
    return null;
  }
}

export function inferMacroFromRSSItem(item: RSSFeedItem, feedTitle: string): "SNACK" | "MEAL" | "TIME_TESTED" {
  const content = item.content || item.contentSnippet || '';
  const contentLength = content.length;
  const wordCount = content.split(/\s+/).length;
  
  // Check for newsletter indicators in feed title
  const feedTitleLower = feedTitle.toLowerCase();
  if (feedTitleLower.includes('newsletter') || feedTitleLower.includes('digest')) {
    // Newsletters tend to be meals
    if (wordCount < 300) return "SNACK";
    if (wordCount > 2000) return "TIME_TESTED";
    return "MEAL";
  }
  
  // Check for long-form indicators in title
  const titleLower = (item.title || '').toLowerCase();
  if (titleLower.includes('deep dive') || titleLower.includes('exploration') || titleLower.includes('analysis')) {
    return "TIME_TESTED";
  }
  
  // Check for quick content indicators
  if (titleLower.includes('quick') || titleLower.includes('brief') || titleLower.includes('summary')) {
    return "SNACK";
  }
  
  // Check for essay/article indicators
  if (titleLower.includes('essay') || titleLower.includes('article')) {
    if (wordCount > 2000) return "TIME_TESTED";
    return "MEAL";
  }
  
  // Use content length to categorize
  if (contentLength < 500 || wordCount < 100) {
    return "SNACK";
  }
  if (contentLength > 5000 || wordCount > 1500) {
    return "TIME_TESTED";
  }
  
  return "MEAL";
}

export async function validateRSSFeed(feedUrl: string): Promise<{ valid: boolean; error?: string; feedTitle?: string }> {
  try {
    const feed = await parser.parseURL(feedUrl);
    return {
      valid: true,
      feedTitle: feed.title || 'RSS Feed',
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
        return { valid: false, error: 'Unable to connect to feed. Please check the URL.' };
      }
      if (error.message.includes('Invalid XML')) {
        return { valid: false, error: 'Invalid RSS feed format.' };
      }
    }
    return { valid: false, error: 'Unable to parse feed. Please check the URL.' };
  }
}

export function extractArticleMetadata(item: RSSFeedItem): {
  author?: string;
  publishedDate?: Date;
} {
  const author = item.author || undefined;
  const publishedDate = item.pubDate ? new Date(item.pubDate) : undefined;
  
  return { author, publishedDate };
}
