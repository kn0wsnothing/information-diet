"use client";

interface Step5TutorialProps {
  onComplete: () => void;
  onBack: () => void;
}

export function Step5Tutorial({ onComplete, onBack }: Step5TutorialProps) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
          You're All Set! Here's How It Works
        </h2>
        <p className="mt-2 text-base text-zinc-600">
          Three simple ways to track your reading time
        </p>
      </div>

      {/* Three Tutorials */}
      <div className="grid gap-6">
        {/* 1. Log Progress */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-2xl">
                📖
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-zinc-900 mb-2">
                Log Progress (for Journeys)
              </h3>
              <p className="text-sm text-zinc-600 mb-3">
                Track where you are in a book and time spent
              </p>
              <div className="rounded-lg bg-zinc-50 border border-zinc-200 p-3 text-xs text-zinc-700">
                <span className="font-medium">Example:</span> "Read 20 pages in 40 minutes"
              </div>
              <p className="mt-2 text-xs text-zinc-500">
                💡 Journeys are tracked over multiple sessions
              </p>
            </div>
          </div>
        </div>

        {/* 2. Mark as Done */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-2xl">
                ✅
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-zinc-900 mb-2">
                Mark as Done
              </h3>
              <p className="text-sm text-zinc-600 mb-3">
                Complete an item and log total time invested
              </p>
              <div className="flex gap-2">
                <div className="flex-1 rounded-lg bg-sky-50 border border-sky-200 p-2 text-xs text-sky-900">
                  <span className="font-medium">Sprint:</span> 3 min
                </div>
                <div className="flex-1 rounded-lg bg-indigo-50 border border-indigo-200 p-2 text-xs text-indigo-900">
                  <span className="font-medium">Session:</span> 25 min
                </div>
                <div className="flex-1 rounded-lg bg-slate-100 border border-slate-300 p-2 text-xs text-slate-900">
                  <span className="font-medium">Journey:</span> 5 hrs
                </div>
              </div>
              <p className="mt-2 text-xs text-zinc-500">
                💡 Your balance is calculated by time, not item count
              </p>
            </div>
          </div>
        </div>

        {/* 3. View Analytics */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-2xl">
                📊
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-zinc-900 mb-2">
                View Your Investment Pattern
              </h3>
              <p className="text-sm text-zinc-600 mb-3">
                See how you're investing your reading time
              </p>
              <div className="rounded-lg bg-zinc-50 border border-zinc-200 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 h-2 bg-gradient-to-r from-sky-500 via-indigo-500 to-slate-700 rounded-full"></div>
                </div>
                <p className="text-xs text-zinc-600">Compare 7, 14, or 21 day patterns</p>
              </div>
              <a
                href="/app/analytics"
                className="mt-2 inline-block text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Go to Analytics →
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Understanding Balance */}
      <div className="rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 p-6">
        <h3 className="text-base font-semibold text-amber-900 mb-3">
          What Does "Balanced" Mean?
        </h3>
        <p className="text-sm text-amber-800 mb-4">
          There's no perfect ratio - it depends on your goals:
        </p>
        <div className="space-y-2 text-sm text-amber-900">
          <div className="flex items-start gap-2">
            <span>📚</span>
            <div>
              <strong>Learning phase:</strong> More Sessions + Journeys (deep exploration)
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span>⚡</span>
            <div>
              <strong>Stay current:</strong> More Sprints (quick updates)
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span>⚖️</span>
            <div>
              <strong>General balance:</strong> Roughly 20-30-50 (Sprint-Session-Journey)
            </div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-amber-200">
          <p className="text-sm text-amber-900 flex items-start gap-2">
            <span className="text-lg flex-shrink-0">💡</span>
            <span>
              <strong>The app shows patterns, you decide what balance works for you.</strong> Check your analytics after a few days to see your natural rhythm.
            </span>
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4">
        <button
          onClick={onBack}
          className="text-sm text-zinc-600 hover:text-zinc-900 transition-colors"
        >
          ← Back
        </button>
        
        <button
          onClick={onComplete}
          className="rounded-full bg-zinc-900 px-8 py-3 text-base font-medium text-white hover:bg-zinc-800 transition-colors"
        >
          Start Tracking My Time
        </button>
      </div>

      {/* Progress */}
      <div className="text-center">
        <div className="text-sm font-medium text-green-600 mb-1">✓ Step 5 of 5</div>
        <p className="text-xs text-zinc-500">
          You can revisit this tutorial anytime from Settings
        </p>
      </div>
    </div>
  );
}
