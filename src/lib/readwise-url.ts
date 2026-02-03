/**
 * Get the appropriate URL for opening an item
 * If it's from Readwise, open in Readwise Reader
 * Otherwise use the original URL
 */
export function getItemOpenUrl(item: {
  url: string | null;
  readwiseDocumentId?: string | null;
  readwiseLocation?: string | null;
}): string | null {
  // If item has a Readwise document ID, open in Readwise Reader
  if (item.readwiseDocumentId) {
    return `https://read.readwise.io/read/${item.readwiseDocumentId}`;
  }

  // Otherwise use the original URL
  return item.url;
}

/**
 * Check if an item is from Readwise
 */
export function isReadwiseItem(item: {
  readwiseDocumentId?: string | null;
}): boolean {
  return !!item.readwiseDocumentId;
}
