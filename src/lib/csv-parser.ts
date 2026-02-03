export type GoodreadsBook = {
  title: string;
  author: string;
  isbn?: string;
  isbn13?: string;
  average_rating?: string;
  publisher?: string;
  binding?: string;
  number_of_pages?: string;
  published_year?: string;
  original_publication_year?: string;
  date_read?: string;
  date_added?: string;
  bookshelves?: string;
  bookshelves_with_positions?: string;
  exclusive_shelf?: string;
  review?: string;
  spoiler?: string;
  private_notes?: string;
  read_count?: string;
  owned?: string;
};

export type StoryGraphBook = {
  title: string;
  author: string;
  isbn?: string;
  publication_year?: string;
  edition_number?: string;
  edition_page_count?: string;
  edition_publication_date?: string;
  edition_additional_information?: string;
  date_read?: string;
  date_started?: string;
  date_added?: string;
  rating?: string;
  star_rating?: string;
  review?: string;
  owned?: string;
  page_count?: string;
  owned_editions?: string;
};

export function parseGoodreadsCSV(csvContent: string): GoodreadsBook[] {
  const lines = csvContent.split('\n');
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9_]/g, '_'));
  const books: GoodreadsBook[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0 || values[0] === '') continue;

    const book: any = {};
    headers.forEach((header, index) => {
      book[header] = values[index] || '';
    });
    
    books.push(book as GoodreadsBook);
  }

  return books;
}

export function parseStoryGraphCSV(csvContent: string): StoryGraphBook[] {
  const lines = csvContent.split('\n');
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9_]/g, '_'));
  const books: StoryGraphBook[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0 || values[0] === '') continue;

    const book: any = {};
    headers.forEach((header, index) => {
      book[header] = values[index] || '';
    });
    
    books.push(book as StoryGraphBook);
  }

  return books;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
}

export function normalizeGoodreadsBook(book: GoodreadsBook) {
  return {
    title: book.title || 'Untitled',
    author: book.author || 'Unknown',
    isbn: book.isbn || book.isbn13 || undefined,
    totalPages: book.number_of_pages ? parseInt(book.number_of_pages) : undefined,
    publishedYear: book.original_publication_year || book.published_year 
      ? parseInt(book.original_publication_year || book.published_year || '0')
      : undefined,
    // Goodreads exclusive_shelf options: to-read, currently-reading, read
    status: book.exclusive_shelf === 'currently-reading' ? 'READING' 
           : book.date_added && !book.date_read ? 'QUEUED'
           : 'QUEUED',
  };
}

export function normalizeStoryGraphBook(book: StoryGraphBook) {
  return {
    title: book.title || 'Untitled',
    author: book.author || 'Unknown',
    isbn: book.isbn || undefined,
    totalPages: book.page_count || book.edition_page_count 
      ? parseInt(book.page_count || book.edition_page_count || '0')
      : undefined,
    publishedYear: book.publication_year 
      ? parseInt(book.publication_year || '0')
      : undefined,
    status: book.date_started && !book.date_read ? 'READING'
           : book.date_added && !book.date_read ? 'QUEUED'
           : 'QUEUED',
  };
}

export function filterBooksByStatus<T extends { status: string }>(
  books: T[], 
  status: 'QUEUED' | 'READING' | 'DONE'
): T[] {
  return books.filter(book => book.status === status);
}
