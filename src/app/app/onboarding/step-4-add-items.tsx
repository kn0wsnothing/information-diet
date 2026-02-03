"use client";

import { useState } from "react";

interface Step4AddItemsProps {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  itemCount?: number;
}

export function Step4AddItems({ onNext, onBack, onSkip, itemCount = 0 }: Step4AddItemsProps) {
  const [localItemCount, setLocalItemCount] = useState(itemCount);
  const minItems = 3;
  const canContinue = localItemCount >= minItems;

  // Calculate distribution for visual
  const progress = Math.min(100, (localItemCount / minItems) * 100);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
          Build Your Queue
        </h2>
        <p className="mt-2 text-base text-zinc-600">
          Add at least 3 items across different time investments
        </p>
      </div>

      {/* Progress Tracker */}
      <div className="rounded-xl border-2 border-zinc-200 bg-white p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-zinc-900">
            {localItemCount}/{minItems} items added
          </span>
          {canContinue && (
            <span className="text-sm text-green-600 font-medium">✓ Ready to continue</span>
          )}
        </div>
        <div className="h-3 bg-zinc-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-sky-500 via-indigo-500 to-slate-700 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        {localItemCount > 0 && (
          <p className="mt-3 text-xs text-zinc-600">
            💡 Try to add items of different lengths for a balanced start!
          </p>
        )}
      </div>

      {/* Add Content Options */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-zinc-900">Add content:</h3>

        {/* Search Books */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">🗺️</span>
                <h4 className="text-sm font-semibold text-zinc-900">Search Books</h4>
              </div>
              <p className="text-xs text-zinc-600">Find books from OpenLibrary</p>
            </div>
            <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2 py-1 rounded">
              Journey
            </span>
          </div>
          <a
            href="/app/add#books"
            className="block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-600 hover:bg-zinc-100 text-center"
          >
            Search for a book →
          </a>
        </div>

        {/* Add Link */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">🎯</span>
                <h4 className="text-sm font-semibold text-zinc-900">Add Link</h4>
              </div>
              <p className="text-xs text-zinc-600">Paste an article or newsletter URL</p>
            </div>
            <span className="text-xs font-medium text-indigo-700 bg-indigo-100 px-2 py-1 rounded">
              Session/Sprint
            </span>
          </div>
          <a
            href="/app/add"
            className="block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-600 hover:bg-zinc-100 text-center"
          >
            Add a link →
          </a>
        </div>

        {/* Browse Synced */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">📚</span>
                <h4 className="text-sm font-semibold text-zinc-900">Browse Synced Items</h4>
              </div>
              <p className="text-xs text-zinc-600">If you connected Readwise or RSS feeds</p>
            </div>
          </div>
          <a
            href="/app/feed"
            className="block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-600 hover:bg-zinc-100 text-center"
          >
            View synced content →
          </a>
        </div>
      </div>

      {/* Tip */}
      {localItemCount === 0 && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
          <p className="text-sm text-blue-900">
            <strong>Tip:</strong> Add a mix of content types to see how the app categorizes them. A book, an article, and a quick read make a great starting point!
          </p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4">
        <button
          onClick={onBack}
          className="text-sm text-zinc-600 hover:text-zinc-900 transition-colors"
        >
          ← Back
        </button>
        
        <div className="flex items-center gap-4">
          <button
            onClick={onSkip}
            className="text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
          >
            Skip
          </button>
          <button
            onClick={onNext}
            disabled={!canContinue}
            className={`rounded-full px-6 py-2.5 text-sm font-medium transition-colors ${
              canContinue
                ? "bg-zinc-900 text-white hover:bg-zinc-800"
                : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
            }`}
          >
            {canContinue ? "Continue" : `Add ${minItems - localItemCount} more item${minItems - localItemCount === 1 ? '' : 's'}`}
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="text-center text-sm text-zinc-500">
        Step 4 of 5
      </div>
    </div>
  );
}
