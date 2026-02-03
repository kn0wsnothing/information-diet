"use client";

import { useState, useEffect } from "react";
import { searchBooks, getBookDetails, BookMetadata } from "@/lib/openlibrary";

interface BookSearchProps {
  onBookSelect: (book: BookMetadata) => void;
}

export function BookSearch({ onBookSelect }: BookSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BookMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setError("");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const searchResults = await searchBooks(searchQuery);
      
      // Get detailed information for each result
      const booksWithDetails = await Promise.all(
        searchResults.slice(0, 5).map(async (result) => {
          const details = await getBookDetails(result.key);
          return details;
        })
      );

      const validBooks = booksWithDetails.filter(Boolean) as BookMetadata[];
      setResults(validBooks);
    } catch (err) {
      setError("Unable to connect to book search service. Please try again later.");
      console.error("Search error:", err);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-zinc-900" htmlFor="book-search">
          Search for a book
        </label>
        <input
          id="book-search"
          type="text"
          placeholder="Enter book title or author..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm"
        />
      </div>

      {isLoading && (
        <div className="text-center text-sm text-zinc-600 py-4">
          Searching...
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
          <div className="text-sm text-amber-800">
            <div className="font-medium">Search temporarily unavailable</div>
            <div className="mt-1">
              You can still add books manually using the form below, or try searching again in a few minutes.
            </div>
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-3">
          <div className="text-sm font-medium text-zinc-900">
            Found {results.length} book{results.length !== 1 ? 's' : ''}
          </div>
          
          {results.map((book) => (
            <div
              key={book.openLibraryId}
              className="rounded-xl border border-zinc-200 bg-white p-4 hover:bg-zinc-50 cursor-pointer transition-colors"
              onClick={() => onBookSelect(book)}
            >
              <div className="flex gap-4">
                {book.coverUrl && (
                  <img
                    src={book.coverUrl}
                    alt={book.title}
                    className="w-12 h-16 object-cover rounded"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-zinc-900 truncate">
                    {book.title}
                  </div>
                  
                  {book.author && (
                    <div className="text-xs text-zinc-600 truncate mt-1">
                      {book.author}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
                    {book.totalPages && (
                      <span>{book.totalPages} pages</span>
                    )}
                    
                    {book.publishedYear && (
                      <span>{book.publishedYear}</span>
                    )}
                    
                    {book.readingAvailable && (
                      <span className="text-green-600 font-medium">
                        ✓ Available to read
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
