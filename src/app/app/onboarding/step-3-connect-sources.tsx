"use client";

import { useState } from "react";

interface Step3ConnectSourcesProps {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

export function Step3ConnectSources({ onNext, onBack, onSkip }: Step3ConnectSourcesProps) {
  const [canContinue, setCanContinue] = useState(false);
  const [showManualOption, setShowManualOption] = useState(false);

  const handleManualClick = () => {
    setShowManualOption(true);
    setCanContinue(true);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
          Connect Your Reading Sources
        </h2>
        <p className="mt-2 text-base text-zinc-600">
          We'll automatically import and categorize by time investment
        </p>
      </div>

      {/* Source Options */}
      <div className="grid gap-4">
        {/* Readwise */}
        <div className="rounded-xl border-2 border-zinc-200 bg-white p-6 hover:border-zinc-300 transition-colors">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="text-2xl">📚</div>
                <div>
                  <h3 className="text-base font-semibold text-zinc-900">Readwise Reader</h3>
                  <span className="text-xs text-zinc-500">Recommended</span>
                </div>
              </div>
              <p className="text-sm text-zinc-600 mb-2">
                Sync highlights and reading list
              </p>
              <p className="text-xs text-zinc-500">
                We'll analyze and categorize by reading time
              </p>
            </div>
            <div className="ml-4">
              <a
                href="/app/connect/readwise"
                className="inline-block rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
                onClick={() => setCanContinue(true)}
              >
                Connect
              </a>
            </div>
          </div>
        </div>

        {/* RSS Feeds */}
        <div className="rounded-xl border-2 border-zinc-200 bg-white p-6 hover:border-zinc-300 transition-colors">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="text-2xl">📰</div>
                <h3 className="text-base font-semibold text-zinc-900">RSS Feeds</h3>
              </div>
              <p className="text-sm text-zinc-600 mb-2">
                Add newsletters and blogs
              </p>
              <p className="text-xs text-zinc-500">
                Articles categorized by word count
              </p>
            </div>
            <div className="ml-4">
              <a
                href="/app/add"
                className="inline-block rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
                onClick={() => setCanContinue(true)}
              >
                Add Feed
              </a>
            </div>
          </div>
        </div>

        {/* CSV Import */}
        <div className="rounded-xl border-2 border-zinc-200 bg-white p-6 hover:border-zinc-300 transition-colors">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="text-2xl">📥</div>
                <h3 className="text-base font-semibold text-zinc-900">Import from CSV</h3>
              </div>
              <p className="text-sm text-zinc-600 mb-2">
                Upload Goodreads or StoryGraph library
              </p>
              <p className="text-xs text-zinc-500">
                Books automatically categorized as Journeys
              </p>
            </div>
            <div className="ml-4">
              <a
                href="/app/connect/goodreads"
                className="inline-block rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
                onClick={() => setCanContinue(true)}
              >
                Import
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Option */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-zinc-50 px-4 text-zinc-500">Or start manually</span>
        </div>
      </div>

      {!showManualOption ? (
        <div className="text-center">
          <button
            onClick={handleManualClick}
            className="text-sm text-zinc-600 hover:text-zinc-900 underline"
          >
            I'll add content myself →
          </button>
        </div>
      ) : (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-center">
          <p className="text-sm text-green-800">
            ✓ Great! You can add books and links manually in the next step.
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
            Continue
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="text-center text-sm text-zinc-500">
        Step 3 of 5
      </div>
    </div>
  );
}
