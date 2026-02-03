"use client";

import { useState } from "react";
import Link from "next/link";
import { MarkDoneButton } from "./mark-done-button";
import { UpdateProgressButton } from "./update-progress-button";
import { RecategorizeButton } from "./recategorize-button";
import { RemoveButton } from "./remove-button";
import { Sidebar } from "./sidebar";

interface Item {
  id: string;
  title: string;
  url: string | null;
  macro: string;
  createdAt: Date;
  currentPage: number | null;
  totalPages: number | null;
  timeSpentMinutes: number | null;
  estimatedMinutes: number | null;
  coverUrl: string | null;
}

interface DashboardData {
  allQueued: Item[];
  suggestedItems: Item[];
  suggestion: string;
  suggestedMacro: string;
  dietData: {
    snackMinutes: number;
    mealMinutes: number;
    timeTestedMinutes: number;
    totalMinutes: number;
  };
  readwiseConnected: boolean;
  userEmail: string;
}

export function DashboardClient({ 
  data, 
  markItemDone, 
  recategorizeItem,
  removeItem
}: { 
  data: DashboardData;
  markItemDone: (id: string, timeSpent: number, finished?: boolean) => Promise<void>;
  recategorizeItem: (id: string, newMacro: string) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
}) {
  const [activeView, setActiveView] = useState("suggestions");
  const { allQueued, suggestedItems, suggestion, dietData, readwiseConnected, userEmail } = data;

  const getProgressPercent = (item: Item) => {
    if (!item.totalPages || !item.currentPage) return 0;
    return Math.min(100, Math.round((item.currentPage / item.totalPages) * 100));
  };

  const isBook = (item: Item) => item.macro === "TIME_TESTED" && item.totalPages && item.totalPages > 0;

  const renderSuggestionView = () => (
    <div className="space-y-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <div className="text-sm font-medium text-zinc-900">Smart suggestion</div>
        <div className="mt-2 text-zinc-700">
          {suggestion}
        </div>
        {suggestedItems.length > 0 ? (
          <div className="mt-4 space-y-2">
            {suggestedItems.map((item) => (
              <div key={item.id} className="rounded-lg border border-zinc-100 bg-zinc-50 p-3">
                <div className="text-sm font-medium text-zinc-900">{item.title}</div>
                <div className="mt-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-600">
                      {item.macro === "SNACK"
                        ? "Bite-sized"
                        : item.macro === "MEAL"
                          ? "Thoughtful"
                          : "Time-tested"}
                    </span>
                    {isBook(item) && item.totalPages && (
                      <span className="text-xs text-zinc-500">
                        • {item.currentPage || 0}/{item.totalPages} pages
                      </span>
                    )}
                  </div>
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-zinc-600 hover:text-zinc-900 underline"
                    >
                      Open
                    </a>
                  )}
                </div>
                {isBook(item) && item.totalPages && (
                  <div className="mt-2 h-1 bg-zinc-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-zinc-400 transition-all"
                      style={{ width: `${getProgressPercent(item)}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 text-sm text-zinc-600">
            No suggested items in your queue. Add some content to get started!
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-zinc-900">Your queue</div>
          <div className="text-xs text-zinc-500">Showing {allQueued.length} items</div>
        </div>
        <div className="mt-4 grid gap-2">
          {allQueued.length === 0 ? (
            <div className="text-sm text-zinc-600">
              Your queue is empty. Try adding some content.
            </div>
          ) : (
            allQueued.map((item) => (
              <div key={item.id} className="rounded-xl border border-zinc-100 px-4 py-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-zinc-900">{item.title}</div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs text-zinc-600">
                        {item.macro === "SNACK"
                          ? "Bite-sized"
                          : item.macro === "MEAL"
                            ? "Thoughtful"
                            : "Time-tested"}
                      </span>
                      {isBook(item) && item.totalPages && (
                        <span className="text-xs text-zinc-500">
                          • {item.currentPage || 0}/{item.totalPages} pages ({getProgressPercent(item)}%)
                        </span>
                      )}
                      {!isBook(item) && item.estimatedMinutes && (
                        <span className="text-xs text-zinc-500">
                          • ~{item.estimatedMinutes} min
                        </span>
                      )}
                      <RecategorizeButton
                        itemId={item.id}
                        currentMacro={item.macro}
                        recategorizeAction={recategorizeItem}
                      />
                      <RemoveButton
                        itemId={item.id}
                        removeAction={removeItem}
                      />
                    </div>
                    {isBook(item) && item.totalPages && (
                      <div className="mt-2 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-zinc-900 transition-all"
                          style={{ width: `${getProgressPercent(item)}%` }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {isBook(item) && item.totalPages && (
                      <UpdateProgressButton
                        itemId={item.id}
                        itemTitle={item.title}
                        currentPage={item.currentPage || 0}
                        totalPages={item.totalPages}
                        currentTimeSpent={item.timeSpentMinutes || 0}
                      />
                    )}
                    <MarkDoneButton
                      itemId={item.id}
                      itemTitle={item.title}
                      macro={item.macro}
                      currentPage={item.currentPage || 0}
                      totalPages={item.totalPages || undefined}
                      currentTimeSpent={item.timeSpentMinutes || 0}
                      estimatedMinutes={item.estimatedMinutes || undefined}
                      markAction={markItemDone}
                    />
                  </div>
                </div>
                {item.url ? (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-sm text-zinc-700 underline"
                  >
                    Open
                  </a>
                ) : null}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const renderFeedView = () => (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-zinc-900">All items</div>
        <div className="text-xs text-zinc-500">Showing {allQueued.length} items</div>
      </div>
      <div className="mt-4 grid gap-2">
        {allQueued.length === 0 ? (
          <div className="text-sm text-zinc-600">
            Your queue is empty. Try adding some content.
          </div>
        ) : (
          allQueued.map((item) => (
            <div key={item.id} className="rounded-xl border border-zinc-100 px-4 py-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-sm font-medium text-zinc-900">{item.title}</div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs text-zinc-600">
                      {item.macro === "SNACK"
                        ? "Bite-sized"
                        : item.macro === "MEAL"
                          ? "Thoughtful"
                          : "Time-tested"}
                    </span>
                    {isBook(item) && item.totalPages && (
                      <span className="text-xs text-zinc-500">
                        • {item.currentPage || 0}/{item.totalPages} pages ({getProgressPercent(item)}%)
                      </span>
                    )}
                    {!isBook(item) && item.estimatedMinutes && (
                      <span className="text-xs text-zinc-500">
                        • ~{item.estimatedMinutes} min
                      </span>
                    )}
                    <RecategorizeButton
                      itemId={item.id}
                      currentMacro={item.macro}
                      recategorizeAction={recategorizeItem}
                    />
                    <RemoveButton
                      itemId={item.id}
                      removeAction={removeItem}
                    />
                  </div>
                  {isBook(item) && item.totalPages && (
                    <div className="mt-2 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-zinc-900 transition-all"
                        style={{ width: `${getProgressPercent(item)}%` }}
                      />
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {isBook(item) && item.totalPages && (
                    <UpdateProgressButton
                      itemId={item.id}
                      itemTitle={item.title}
                      currentPage={item.currentPage || 0}
                      totalPages={item.totalPages}
                      currentTimeSpent={item.timeSpentMinutes || 0}
                    />
                  )}
                  <MarkDoneButton
                    itemId={item.id}
                    itemTitle={item.title}
                    macro={item.macro}
                    currentPage={item.currentPage || 0}
                    totalPages={item.totalPages || undefined}
                    currentTimeSpent={item.timeSpentMinutes || 0}
                    estimatedMinutes={item.estimatedMinutes || undefined}
                    markAction={markItemDone}
                  />
                </div>
              </div>
              {item.url ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-sm text-zinc-700 underline"
                >
                  Open
                </a>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-zinc-50">
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        dietData={dietData}
        userEmail={userEmail}
      />
      
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Your information diet
            </h1>
            <p className="mt-1 text-sm text-zinc-600">
              Gentle nudges to trade bite-sized reads for thoughtful ones and make room for time-tested books.
            </p>
          </div>

          {activeView === "suggestions" && renderSuggestionView()}
          {activeView === "feed" && renderFeedView()}
        </div>
      </div>
    </div>
  );
}
