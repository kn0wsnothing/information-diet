"use client";

import { useState } from "react";

interface RSSFeedInputProps {
  onFeedValidated: (feedUrl: string, feedTitle: string) => void;
}

export function RSSFeedInput({ onFeedValidated }: RSSFeedInputProps) {
  const [feedUrl, setFeedUrl] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    feedTitle?: string;
    error?: string;
  } | null>(null);

  const validateFeed = async () => {
    if (!feedUrl.trim()) {
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      const response = await fetch('/api/rss/feeds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: feedUrl }),
      });

      const result = await response.json();
      setValidationResult(result);

      if (result.valid) {
        onFeedValidated(feedUrl, result.feedTitle || 'RSS Feed');
      }
    } catch (error) {
      setValidationResult({
        valid: false,
        error: 'Unable to validate feed. Please check the URL.',
      });
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-zinc-900" htmlFor="rss-url">
          RSS Feed URL
        </label>
        <input
          id="rss-url"
          type="url"
          placeholder="https://example.com/feed.xml"
          value={feedUrl}
          onChange={(e) => setFeedUrl(e.target.value)}
          className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm"
        />
      </div>

      <button
        type="button"
        onClick={validateFeed}
        disabled={isValidating || !feedUrl.trim()}
        className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isValidating ? 'Validating...' : 'Validate & Add'}
      </button>

      {validationResult && (
        <div className={`rounded-lg p-4 ${
          validationResult.valid
            ? 'bg-green-50 border border-green-200'
            : 'bg-red-50 border border-red-200'
        }`}>
          {validationResult.valid ? (
            <div className="text-sm text-green-800">
              <div className="font-medium">Valid RSS feed</div>
              <div className="mt-1">
                Found: {validationResult.feedTitle}
              </div>
              <button
                onClick={() => onFeedValidated(feedUrl, validationResult.feedTitle || 'RSS Feed')}
                className="mt-2 rounded-full bg-green-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-green-700"
              >
                Add to queue
              </button>
            </div>
          ) : (
            <div className="text-sm text-red-800">
              <div className="font-medium">Invalid feed</div>
              <div className="mt-1">{validationResult.error}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
