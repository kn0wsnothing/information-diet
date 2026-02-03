"use client";

import { useState, useTransition } from "react";
import { estimateTimeFromPages, formatReadingTime, calculateProgress } from "@/lib/time-estimation";

interface UpdateProgressModalProps {
  itemId: string;
  itemTitle: string;
  currentPage: number;
  totalPages: number;
  currentTimeSpent: number;
  updateAction: (formData: FormData) => Promise<{ success: boolean }>;
  onClose: () => void;
}

export function UpdateProgressModal({
  itemId,
  itemTitle,
  currentPage,
  totalPages,
  currentTimeSpent,
  updateAction,
  onClose,
}: UpdateProgressModalProps) {
  // If user hasn't started (page 0), default to absolute mode so they can set starting page
  const [progressMode, setProgressMode] = useState<"absolute" | "incremental">(
    currentPage === 0 ? "absolute" : "incremental"
  );
  const [absolutePage, setAbsolutePage] = useState(currentPage === 0 ? 1 : currentPage);
  const [pagesRead, setPagesRead] = useState(10);
  const [minutesSpent, setMinutesSpent] = useState(0); // Default to 0, user can add time if they want
  const [showTimeCorrection, setShowTimeCorrection] = useState(false);
  const [correctedTotalTime, setCorrectedTotalTime] = useState(currentTimeSpent);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    const formData = new FormData();
    formData.append("itemId", itemId);
    
    // If correcting total time, calculate the difference from current
    if (showTimeCorrection) {
      const timeDifference = correctedTotalTime - currentTimeSpent;
      formData.append("minutesSpent", String(timeDifference));
    } else {
      formData.append("minutesSpent", String(minutesSpent));
    }
    
    if (progressMode === "absolute") {
      const pagesChange = absolutePage - currentPage;
      formData.append("pagesRead", String(pagesChange));
      formData.append("newCurrentPage", String(absolutePage));
    } else {
      formData.append("pagesRead", String(pagesRead));
    }

    startTransition(async () => {
      const result = await updateAction(formData);
      if (result.success) {
        onClose();
      }
    });
  };

  const estimatedNewPage = progressMode === "absolute" ? absolutePage : currentPage + pagesRead;
  const estimatedTotalTime = showTimeCorrection ? correctedTotalTime : currentTimeSpent + minutesSpent;
  const progress = calculateProgress(estimatedNewPage, totalPages);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-zinc-900">Update Progress</h2>
        <p className="mt-1 text-sm text-zinc-600">{itemTitle}</p>

        <div className="mt-6 space-y-5">
          {/* Progress Mode Selection */}
          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="progressMode"
                checked={progressMode === "absolute"}
                onChange={() => setProgressMode("absolute")}
                className="mt-0.5"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-zinc-900">
                  {currentPage === 0 ? "I'm starting on page" : "Set current page to"}
                </div>
                <input
                  type="number"
                  min={0}
                  max={totalPages}
                  value={absolutePage}
                  onChange={(e) => setAbsolutePage(Math.min(totalPages, Math.max(0, parseInt(e.target.value) || 0)))}
                  disabled={progressMode !== "absolute"}
                  className="mt-1 w-32 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 disabled:bg-zinc-50 disabled:text-zinc-400"
                />
                <span className="ml-2 text-sm text-zinc-500">/ {totalPages}</span>
                {currentPage === 0 && progressMode === "absolute" && (
                  <p className="mt-1 text-xs text-zinc-500">
                    Already read some pages? Set your starting point here
                  </p>
                )}
                {currentPage > 0 && progressMode === "absolute" && absolutePage < currentPage && (
                  <p className="mt-1 text-xs text-amber-600">
                    ⚠️ You're moving backwards (currently on page {currentPage})
                  </p>
                )}
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="progressMode"
                checked={progressMode === "incremental"}
                onChange={() => setProgressMode("incremental")}
                className="mt-0.5"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-zinc-900">
                  {currentPage === 0 ? "I read" : "I read"}
                </div>
                <input
                  type="number"
                  min={1}
                  max={totalPages - currentPage}
                  value={pagesRead}
                  onChange={(e) => setPagesRead(Math.max(1, parseInt(e.target.value) || 1))}
                  disabled={progressMode !== "incremental"}
                  className="mt-1 w-32 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 disabled:bg-zinc-50 disabled:text-zinc-400"
                />
                <span className="ml-2 text-sm text-zinc-500">
                  {currentPage === 0 ? "pages" : "pages today"}
                </span>
                {currentPage === 0 && progressMode === "incremental" && (
                  <p className="mt-1 text-xs text-zinc-500">
                    Track pages read from the beginning
                  </p>
                )}
              </div>
            </label>
          </div>

          {/* Time Spent */}
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-zinc-900">
                Time spent reading (optional)
              </label>
              {currentTimeSpent > 0 && (
                <button
                  type="button"
                  onClick={() => setShowTimeCorrection(!showTimeCorrection)}
                  className="text-xs text-zinc-600 hover:text-zinc-900 underline"
                >
                  {showTimeCorrection ? "Add time instead" : "Correct total time"}
                </button>
              )}
            </div>
            
            {showTimeCorrection ? (
              <>
                <p className="mt-1 text-xs text-zinc-500">
                  Current total: {formatReadingTime(currentTimeSpent)}. Set the correct total below.
                </p>
                <input
                  type="number"
                  min="0"
                  max="10000"
                  value={correctedTotalTime}
                  onChange={(e) => setCorrectedTotalTime(Math.max(0, parseInt(e.target.value) || 0))}
                  className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
                />
                <p className="mt-1 text-xs text-zinc-500">
                  This will {correctedTotalTime > currentTimeSpent ? 'add' : 'subtract'} {' '}
                  {Math.abs(correctedTotalTime - currentTimeSpent)} minutes
                </p>
              </>
            ) : (
              <>
                <p className="mt-1 text-xs text-zinc-500">
                  Only add time if you actually read. Leave at 0 if just updating position.
                </p>
                <input
                  type="number"
                  min="0"
                  max="480"
                  value={minutesSpent}
                  onChange={(e) => setMinutesSpent(Math.max(0, parseInt(e.target.value) || 0))}
                  className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
                />
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMinutesSpent(0)}
                    className={`px-3 py-1 text-xs rounded-lg ${
                      minutesSpent === 0
                        ? "bg-zinc-900 text-white"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                    }`}
                  >
                    None
                  </button>
                  {[15, 30, 60, 90].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setMinutesSpent(mins)}
                      className={`px-3 py-1 text-xs rounded-lg ${
                        minutesSpent === mins
                          ? "bg-zinc-900 text-white"
                          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Progress Summary */}
          <div className="rounded-lg bg-zinc-50 p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-600">
                {progressMode === "absolute" && absolutePage < currentPage 
                  ? "Corrected position" 
                  : "New position"}
              </span>
              <span className="font-medium text-zinc-900">
                {estimatedNewPage} / {totalPages} ({progress}%)
              </span>
            </div>
            {progressMode === "absolute" && absolutePage !== currentPage && (
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>Change</span>
                <span>
                  {currentPage} → {absolutePage} 
                  ({absolutePage > currentPage ? '+' : ''}{absolutePage - currentPage} pages)
                </span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-600">Total time</span>
              <span className="font-medium text-zinc-900">
                {formatReadingTime(estimatedTotalTime)}
              </span>
            </div>
            <div className="mt-2 h-2 bg-zinc-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-zinc-900 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Action Buttons */}
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
              {isPending ? "Updating..." : "Update Progress"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
