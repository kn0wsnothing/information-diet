"use client";

import { useState } from "react";

interface LogSessionButtonProps {
  itemId: string;
  macro: string;
  totalPages?: number | null;
  currentPage?: number | null;
  onSessionLogged?: () => void;
}

export function LogSessionButton({ 
  itemId, 
  macro, 
  totalPages, 
  currentPage,
  onSessionLogged 
}: LogSessionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [minutesSpent, setMinutesSpent] = useState(15);
  const [pagesRead, setPagesRead] = useState(currentPage ? 1 : 0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("itemId", itemId);
    formData.append("minutesSpent", String(minutesSpent));
    formData.append("pagesRead", totalPages ? String(pagesRead) : "");

    try {
      const { logReadingSession } = await import("./reading-actions");
      const result = await logReadingSession(formData);
      
      if (result.success) {
        setIsOpen(false);
        if (onSessionLogged) onSessionLogged();
      }
    } catch (error) {
      console.error("Failed to log session:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSuggestedMinutes = () => {
    if (macro === "SNACK") return 5;
    if (macro === "MEAL") return 30;
    return 60;
  };

  const progressPercentage = totalPages 
    ? Math.round(((currentPage || 0) / totalPages) * 100)
    : null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
      >
        {isOpen ? "Cancel" : "+ Log session"}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/20 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-zinc-200 bg-white p-4 shadow-lg z-20">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-900">
                  Minutes spent
                </label>
                <input
                  type="number"
                  min="1"
                  max="480"
                  value={minutesSpent}
                  onChange={(e) => setMinutesSpent(parseInt(e.target.value) || 1)}
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
                />
                <div className="mt-1 flex gap-1">
                  {[5, 15, 30, 60].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setMinutesSpent(mins)}
                      className={`px-2 py-1 text-xs rounded ${
                        minutesSpent === mins
                          ? "bg-zinc-900 text-white"
                          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>

              {totalPages && (
                <div>
                  <label className="block text-sm font-medium text-zinc-900">
                    Pages read (current: {currentPage || 0}/{totalPages})
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={totalPages - (currentPage || 0)}
                    value={pagesRead}
                    onChange={(e) => setPagesRead(parseInt(e.target.value) || 0)}
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
                  />
                </div>
              )}

              {progressPercentage !== null && (
                <div className="rounded-lg bg-zinc-50 p-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-zinc-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-zinc-900 transition-all"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-zinc-600">{progressPercentage}%</span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
              >
                {isSubmitting ? "Logging..." : "Log session"}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
