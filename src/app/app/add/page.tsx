"use client";

import { useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addLink, addBook, addNewsletter } from "./actions";
import { BookSearch } from "../book-search";

export default function AddPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const resolvedSearchParams = use(searchParams);
  const [activeTab, setActiveTab] = useState<"link" | "book" | "newsletter">("link");
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const router = useRouter();

  const handleBookSelect = (book: any) => {
    setSelectedBook(book);
  };

  const errorMessages: Record<string, string> = {
    url: "Please enter a valid URL",
    title: "Please enter a title",
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-xl px-6 py-12">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-sm text-zinc-600 hover:text-zinc-900"
          >
            ← Back
          </button>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Add to your queue
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Add links, books, or newsletters to your reading queue.
        </p>

        {resolvedSearchParams.error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {errorMessages[resolvedSearchParams.error] || "Something went wrong"}
          </div>
        )}

        <div className="mt-8 flex gap-2 border-b border-zinc-200">
          {(["link", "book", "newsletter"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 ${
                activeTab === tab
                  ? "border-zinc-900 text-zinc-900"
                  : "border-transparent text-zinc-600 hover:text-zinc-900"
              }`}
            >
              {tab === "link" ? "Link" : tab === "book" ? "Book" : "Newsletter"}
            </button>
          ))}
        </div>

        {activeTab === "link" && (
          <form action={addLink} className="mt-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-900" htmlFor="url">
                URL
              </label>
              <input
                id="url"
                name="url"
                type="url"
                placeholder="https://example.com/article"
                className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-900" htmlFor="title">
                Title (optional)
              </label>
              <input
                id="title"
                name="title"
                type="text"
                placeholder="Leave blank to auto-detect from URL"
                className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm"
              />
            </div>

            <div className="rounded-lg bg-zinc-50 p-3">
              <p className="text-xs text-zinc-600">
                <span className="font-medium">Auto-categorization:</span> We'll automatically categorize this as 
                bite-sized, thoughtful, or time-tested based on the source and content type.
              </p>
            </div>

            <button
              type="submit"
              className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white"
            >
              Add to queue
            </button>
          </form>
        )}

        {activeTab === "book" && (
          <div className="mt-8 space-y-6">
            <div className="grid gap-4">
              <Link href="/app/connect/goodreads" className="rounded-xl border border-zinc-200 bg-white p-4 text-left hover:bg-zinc-50 block">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-zinc-900">Import from Goodreads</div>
                    <div className="mt-1 text-xs text-zinc-600">
                      Connect your Goodreads account to import your reading list
                    </div>
                  </div>
                  <span className="text-lg">📚</span>
                </div>
              </Link>

              <Link href="/app/connect/storygraph" className="rounded-xl border border-zinc-200 bg-white p-4 text-left hover:bg-zinc-50 block">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-zinc-900">Import from StoryGraph</div>
                    <div className="mt-1 text-xs text-zinc-600">
                      Connect your StoryGraph account to import your reading list
                    </div>
                  </div>
                  <span className="text-lg">📖</span>
                </div>
              </Link>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-zinc-50 px-2 text-zinc-500">Or search and add</span>
              </div>
            </div>

            <BookSearch onBookSelect={handleBookSelect} />

            {selectedBook && (
              <div className="rounded-xl border border-zinc-200 bg-white p-4">
                <div className="flex gap-4">
                  {selectedBook.coverUrl && (
                    <img
                      src={selectedBook.coverUrl}
                      alt={selectedBook.title}
                      className="w-16 h-20 object-cover rounded"
                    />
                  )}
                  
                  <div className="flex-1">
                    <div className="text-sm font-medium text-zinc-900">
                      {selectedBook.title}
                    </div>
                    {selectedBook.author && (
                      <div className="text-xs text-zinc-600 mt-1">
                        {selectedBook.author}
                      </div>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
                      {selectedBook.totalPages && (
                        <span>{selectedBook.totalPages} pages</span>
                      )}
                      {selectedBook.readingAvailable && (
                        <span className="text-green-600 font-medium">
                          ✓ Available to read
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <form action={addBook} className="mt-4">
                  <input type="hidden" name="title" value={selectedBook.title} />
                  <input type="hidden" name="author" value={selectedBook.author || ''} />
                  <input type="hidden" name="openLibraryId" value={selectedBook.openLibraryId} />
                  <input type="hidden" name="coverUrl" value={selectedBook.coverUrl || ''} />
                  <input type="hidden" name="totalPages" value={selectedBook.totalPages || ''} />
                  <input type="hidden" name="isbn" value={selectedBook.isbn || ''} />
                  <input type="hidden" name="publishedYear" value={selectedBook.publishedYear || ''} />
                  
                  <button
                    type="submit"
                    className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white"
                  >
                    Add this book to queue
                  </button>
                </form>
              </div>
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-zinc-50 px-2 text-zinc-500">Or add manually</span>
              </div>
            </div>

            <form action={addBook} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-900" htmlFor="book-title">
                  Book title
                </label>
                <input
                  id="book-title"
                  name="title"
                  type="text"
                  placeholder="e.g., Thinking, Fast and Slow"
                  className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-900" htmlFor="author">
                  Author (optional)
                </label>
                <input
                  id="author"
                  name="author"
                  type="text"
                  placeholder="e.g., Daniel Kahneman"
                  className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm"
                />
              </div>

              <button
                type="submit"
                className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white"
              >
                Add to queue
              </button>
            </form>
          </div>
        )}

        {activeTab === "newsletter" && (
          <form action={addNewsletter} className="mt-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-900" htmlFor="newsletter-title">
                Newsletter name
              </label>
              <input
                id="newsletter-title"
                name="title"
                type="text"
                placeholder="e.g., The Verge"
                className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-900" htmlFor="newsletter-url">
                URL (optional)
              </label>
              <input
                id="newsletter-url"
                name="url"
                type="url"
                placeholder="https://example.com/newsletter"
                className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm"
              />
            </div>

            <button
              type="submit"
              className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white"
            >
              Add to queue
            </button>
          </form>
        )}

        <div className="mt-12 rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="text-sm font-medium text-zinc-900">Content types</h2>
          <div className="mt-4 space-y-3 text-sm text-zinc-600">
            <div>
              <div className="font-medium text-zinc-900">⚡ Sprint</div>
              <p>Quick reads: tweets, short articles, news snippets (2-5 min)</p>
            </div>
            <div>
              <div className="font-medium text-zinc-900">🎯 Session</div>
              <p>Essays, newsletters, long-form articles (15-45 min)</p>
            </div>
            <div>
              <div className="font-medium text-zinc-900">🗺️ Journey</div>
              <p>Books, research papers, deep dives (hours or days)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
