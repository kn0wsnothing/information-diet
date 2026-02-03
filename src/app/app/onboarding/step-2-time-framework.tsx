"use client";

interface Step2TimeFrameworkProps {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

export function Step2TimeFramework({ onNext, onBack, onSkip }: Step2TimeFrameworkProps) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
          How Much Time Will You Invest?
        </h2>
        <p className="mt-2 text-base text-zinc-600">
          We categorize content by the depth of engagement required
        </p>
      </div>

      {/* Three Cards - Gradient from Light to Dark */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Sprints - Light */}
        <div className="rounded-xl bg-sky-50 border border-sky-100 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">⚡</span>
            <div>
              <h3 className="text-lg font-bold text-sky-900">Sprints</h3>
              <p className="text-sm text-sky-700">2-5 minutes</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-sky-900 mb-1">Best For</p>
              <p className="text-sm text-sky-800">Quick updates, news, tweets, short tips</p>
            </div>
            
            <div>
              <p className="text-xs font-semibold text-sky-900 mb-1">When</p>
              <p className="text-sm text-sky-800">Morning catch-up, between meetings, quick breaks</p>
            </div>
            
            <div>
              <p className="text-xs font-semibold text-sky-900 mb-1">Examples</p>
              <ul className="text-sm text-sky-800 space-y-1">
                <li>• Twitter threads</li>
                <li>• News headlines</li>
                <li>• Quick blog posts</li>
              </ul>
            </div>
            
            <div className="pt-2 border-t border-sky-200">
              <p className="text-xs font-semibold text-sky-900">Goal</p>
              <p className="text-sm text-sky-800">Stay informed on current topics</p>
            </div>
          </div>
        </div>

        {/* Sessions - Medium */}
        <div className="rounded-xl bg-indigo-100 border border-indigo-200 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🎯</span>
            <div>
              <h3 className="text-lg font-bold text-indigo-900">Sessions</h3>
              <p className="text-sm text-indigo-700">15-45 minutes</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-indigo-900 mb-1">Best For</p>
              <p className="text-sm text-indigo-800">Essays, newsletters, in-depth articles</p>
            </div>
            
            <div>
              <p className="text-xs font-semibold text-indigo-900 mb-1">When</p>
              <p className="text-sm text-indigo-800">Dedicated reading time, evening wind-down</p>
            </div>
            
            <div>
              <p className="text-xs font-semibold text-indigo-900 mb-1">Examples</p>
              <ul className="text-sm text-indigo-800 space-y-1">
                <li>• Substack essays</li>
                <li>• Long-form journalism</li>
                <li>• Technical deep-dives</li>
              </ul>
            </div>
            
            <div className="pt-2 border-t border-indigo-200">
              <p className="text-xs font-semibold text-indigo-900">Goal</p>
              <p className="text-sm text-indigo-800">Build deeper understanding</p>
            </div>
          </div>
        </div>

        {/* Journeys - Dark */}
        <div className="rounded-xl bg-slate-800 border border-slate-700 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🗺️</span>
            <div>
              <h3 className="text-lg font-bold text-white">Journeys</h3>
              <p className="text-sm text-slate-300">Hours to days</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-white mb-1">Best For</p>
              <p className="text-sm text-slate-300">Books, research papers, courses</p>
            </div>
            
            <div>
              <p className="text-xs font-semibold text-white mb-1">When</p>
              <p className="text-sm text-slate-300">Extended reading sessions, weekends</p>
            </div>
            
            <div>
              <p className="text-xs font-semibold text-white mb-1">Examples</p>
              <ul className="text-sm text-slate-300 space-y-1">
                <li>• Non-fiction books</li>
                <li>• Academic papers</li>
                <li>• Online courses</li>
              </ul>
            </div>
            
            <div className="pt-2 border-t border-slate-600">
              <p className="text-xs font-semibold text-white">Goal</p>
              <p className="text-sm text-slate-300">Master subjects over time</p>
            </div>
          </div>
        </div>
      </div>

      {/* Balance Callout */}
      <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
        <p className="text-sm text-amber-900 flex items-start gap-2">
          <span className="text-lg">💡</span>
          <span>
            <strong>The goal is balance over time, not perfection each day.</strong> A typical balance might be 20% sprints, 30% sessions, and 50% journeys - but it depends on your goals.
          </span>
        </p>
      </div>

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
            className="rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
          >
            Next: Connect your sources
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="text-center text-sm text-zinc-500">
        Step 2 of 5
      </div>
    </div>
  );
}
