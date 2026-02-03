// Open Library API integration for book metadata and reading availability

export interface OpenLibraryBook {
  key: string;           // Open Library ID (e.g., "/works/OL123456W")
  title: string;
  authors?: Array<{
    name: string;
    key: string;
  }>;
  cover_i?: number;      // Cover image ID
  first_publish_year?: number;
  number_of_pages?: number;
  isbn?: string[];
  publisher?: string[];
  language?: string[];
  description?: string | { value: string };
  subject?: string[];
  has_fulltext?: boolean; // Whether book is available to read
}

export interface OpenLibrarySearchResult {
  key: string;
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
  edition_count?: number;
  has_fulltext?: boolean;
  public_scan_b?: boolean; // Whether available for borrowing
}

export interface BookMetadata {
  title: string;
  author: string;
  coverUrl?: string;
  totalPages?: number;
  openLibraryId: string;
  isbn?: string;
  publishedYear?: number;
  description?: string;
  readingAvailable: boolean;
}

// Search for books by title
export async function searchBooks(query: string): Promise<OpenLibrarySearchResult[]> {
  if (!query.trim()) return [];

  try {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&fields=key,title,author_name,first_publish_year,cover_i,edition_count,has_fulltext,public_scan_b&limit=10`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'InformationDiet/1.0',
        },
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Open Library search failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.docs || [];
  } catch (error) {
    console.error('Error searching Open Library:', error);
    
    // Return empty array for now - could add mock data for testing
    return [];
  }
}

// Get detailed book information
export async function getBookDetails(openLibraryId: string): Promise<BookMetadata | null> {
  try {
    // Remove "/works/" prefix if present
    const workId = openLibraryId.replace('/works/', '');
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(
      `https://openlibrary.org/works/${workId}.json`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'InformationDiet/1.0',
        },
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch book details: ${response.status} ${response.statusText}`);
    }

    const book: OpenLibraryBook = await response.json();
    
    // Get author names
    const authorNames = book.authors?.map(author => author.name).join(', ') || '';
    
    // Build cover URL if cover image exists
    const coverUrl = book.cover_i 
      ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
      : undefined;

    // Check if book is available for reading
    const readingAvailable = book.has_fulltext || false;

    // Get first ISBN if available
    const isbn = book.isbn?.[0];

    // Try to get page count from editions if not in works
    let totalPages = book.number_of_pages;
    if (!totalPages) {
      try {
        // Fetch editions to get page count
        const editionsController = new AbortController();
        const editionsTimeoutId = setTimeout(() => editionsController.abort(), 5000);
        
        const editionsResponse = await fetch(
          `https://openlibrary.org/works/${workId}/editions.json?limit=10`,
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'InformationDiet/1.0',
            },
            signal: editionsController.signal,
          }
        );
        
        clearTimeout(editionsTimeoutId);
        
        if (editionsResponse.ok) {
          const editionsData = await editionsResponse.json();
          // Find first edition with page count
          const editionWithPages = editionsData.entries?.find((e: any) => e.number_of_pages);
          if (editionWithPages) {
            totalPages = editionWithPages.number_of_pages;
          }
        }
      } catch (err) {
        console.log('Could not fetch edition page count:', err);
      }
    }

    return {
      title: book.title,
      author: authorNames,
      coverUrl,
      totalPages,
      openLibraryId: book.key,
      isbn,
      publishedYear: book.first_publish_year,
      description: typeof book.description === 'string' 
        ? book.description 
        : book.description?.value,
      readingAvailable
    };
  } catch (error) {
    console.error('Error fetching book details:', error);
    return null;
  }
}

// Get reading URL for a book
export function getReadingUrl(openLibraryId: string): string | null {
  // Remove "/works/" prefix if present
  const workId = openLibraryId.replace('/works/', '');
  
  // Try different patterns for reading URLs
  const possibleUrls = [
    `https://openlibrary.org/books/${workId}/read`,
    `https://openlibrary.org/works/${workId}/read`,
    `https://archive.org/details/${workId}`
  ];

  // Return the first possible URL (actual availability would need to be checked)
  return possibleUrls[0];
}

// Search and get book details in one call
export async function searchAndGetBookDetails(query: string): Promise<BookMetadata[]> {
  const searchResults = await searchBooks(query);
  
  const booksWithDetails = await Promise.all(
    searchResults
      .slice(0, 5) // Limit to top 5 results
      .map(async (result) => {
        const details = await getBookDetails(result.key);
        return details;
      })
  );

  return booksWithDetails.filter(Boolean) as BookMetadata[];
}
