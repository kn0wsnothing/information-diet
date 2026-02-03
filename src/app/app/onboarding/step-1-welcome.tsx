"use client";

interface Step1WelcomeProps {
  onNext: () => void;
  onSkip: () => void;
}

export function Step1Welcome({ onNext, onSkip }: Step1WelcomeProps) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
          Welcome to Information Diet
        </h1>
        <p className="mt-3 text-lg text-zinc-600">
          Balance your reading with awareness of time investment
        </p>
      </div>

      {/* Value Props */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-center">
          <div className="text-4xl mb-3">⏱️</div>
          <h3 className="text-sm font-semibold text-zinc-900 mb-2">
            Track Your Time
          </h3>
          <p className="text-sm text-zinc-600">
            Track your reading time across all sources
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-center">
          <div className="text-4xl mb-3">⚖️</div>
          <h3 className="text-sm font-semibold text-zinc-900 mb-2">
            Balance Your Investment
          </h3>
          <p className="text-sm text-zinc-600">
            Balance sprints, sessions, and journeys
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-center">
          <div className="text-4xl mb-3">📈</div>
          <h3 className="text-sm font-semibold text-zinc-900 mb-2">
            See Your Patterns
          </h3>
          <p className="text-sm text-zinc-600">
            See patterns in your content consumption
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="flex flex-col items-center gap-4">
        <button
          onClick={onNext}
          className="rounded-full bg-zinc-900 px-8 py-3 text-base font-medium text-white hover:bg-zinc-800 transition-colors"
        >
          Let's get started
        </button>
        <button
          onClick={onSkip}
          className="text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
        >
          Skip and explore on my own
        </button>
      </div>
    </div>
  );
}
