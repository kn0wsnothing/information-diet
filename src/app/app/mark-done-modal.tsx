"use client";

import { useState, useTransition } from "react";
import { estimateTimeFromPages, formatReadingTime } from "@/lib/time-estimation";

export function MarkDoneModal({
  itemId,
  itemTitle,
  macro,
  currentPage,
  totalPages,
  currentTimeSpent,
  estimatedMinutes,
  markAction,
  onClose,
}: {
  itemId: string;
  itemTitle: string;
  macro: string;
  currentPage?: number;
  totalPages?: number;
  currentTimeSpent?: number;
  estimatedMinutes?: number;
  markAction: (id: string, timeSpent: number, finished?: boolean) => Promise<void>;
  onClose: () => void;
}) {
  const isBook = macro === "TIME_TESTED" && totalPages && totalPages > 0;
  const hasProgress = currentPage && currentPage > 0;
  
  // For books with progress, default to "finished" option
  const [completionType, setCompletionType] = useState<"finished" | "done-reading">(
    "finished"
  );
  
  // Calculate default time based on item type and progress
  const getDefaultTime = () => {
    if (isBook && hasProgress) {
      const remainingPages = totalPages! - currentPage!;
      const remainingTime = estimateTimeFromPages(remainingPages);
      return remainingTime;
    }
    if (estimatedMinutes) return estimatedMinutes;
    if (macro === "SNACK") return 3;
    if (macro === "MEAL") return 25;
    return 60;
  };

  const [timeSpent, setTimeSpent] = useState<number>(getDefaultTime());
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    startTransition(async () => {
      const finished = !isBook || completionType === "finished";
      await markAction(itemId, timeSpent, finished);
      onClose();
    });
  };

  const progressPercent = hasProgress && totalPages 
    ? Math.round((currentPage! / totalPages) * 100) 
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-zinc-900">
          {isBook ? "Mark Book as Complete" : "Mark as Done"}
        </h2>
        <p className="mt-2 text-sm text-zinc-600">{itemTitle}</p>

        <div className="mt-6 space-y-4">
          {/* Book completion options */}
          {isBook && hasProgress && (
            <div className="space-y-3">
              <p className="text-sm text-zinc-700">
                You're on page {currentPage} / {totalPages} ({progressPercent}%)
              </p>
              
              <label className="flex items-start gap-3 cursor-pointer p-3 border border-zinc-200 rounded-lg hover:bg-zinc-50">
                <input
                  type="radio"
                  name="completionType"
                  checked={completionType === "finished"}
                  onChange={() => {
                    setCompletionType("finished");
                    const remainingPages = totalPages! - currentPage!;
                    setTimeSpent(estimateTimeFromPages(remainingPages));
                  }}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-zinc-900">I finished the book</div>
                  <div className="text-xs text-zinc-500 mt-1">
                    → Update to page {totalPages}
                    <br />→ Add remaining time: ~{formatReadingTime(estimateTimeFromPages(totalPages! - currentPage!))}
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer p-3 border border-zinc-200 rounded-lg hover:bg-zinc-50">
                <input
                  type="radio"
                  name="completionType"
                  checked={completionType === "done-reading"}
                  onChange={() => {
                    setCompletionType("done-reading");
                    setTimeSpent(0);
                  }}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-zinc-900">I'm done reading (won't finish)</div>
                  <div className="text-xs text-zinc-500 mt-1">
                    → Keep progress at {currentPage}/{totalPages}
                    <br />→ Time already logged: {formatReadingTime(currentTimeSpent || 0)}
                  </div>
                </div>
              </label>
            </div>
          )}

          {/* Time input */}
          {(!isBook || !hasProgress || completionType === "finished") && (
            <div>
              <label className="block text-sm font-medium text-zinc-900">
                {isBook && hasProgress ? "Additional time spent" : "Time spent"} (minutes)
              </label>
              <input
                type="number"
                min="0"
                value={timeSpent}
                onChange={(e) => setTimeSpent(Math.max(0, parseInt(e.target.value) || 0))}
                className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900"
              />
              <p className="mt-2 text-xs text-zinc-500">
                {!isBook && macro === "SNACK"
                  ? "Typical: 2-5 minutes"
                  : !isBook && macro === "MEAL"
                    ? "Typical: 15-45 minutes"
                    : estimatedMinutes
                      ? `Estimated: ${formatReadingTime(estimatedMinutes)}`
                      : "Enter actual time spent"}
              </p>
            </div>
          )}

          {/* Total time summary for books */}
          {isBook && hasProgress && (
            <div className="rounded-lg bg-zinc-50 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-zinc-600">Total time for this book</span>
                <span className="font-medium text-zinc-900">
                  {formatReadingTime((currentTimeSpent || 0) + (completionType === "finished" ? timeSpent : 0))}
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={isPending}
              className="flex-1 rounded-full border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isPending}
              className="flex-1 rounded-full bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {isPending ? "Saving..." : "Mark complete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
