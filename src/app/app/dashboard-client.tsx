"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { MarkDoneButton } from "./mark-done-button";
import { UpdateProgressButton } from "./update-progress-button";
import { RecategorizeButton } from "./recategorize-button";
import { RemoveButton } from "./remove-button";
import { StartReadingButton } from "./start-reading-button";
import { Sidebar } from "./sidebar";
import { OnboardingModal } from "./onboarding/onboarding-modal";
import { SyncStatus } from "./sync-status";
import { getContentTypeLabel } from "@/lib/content-types";
import { getItemOpenUrl, isReadwiseItem } from "@/lib/readwise-url";

interface Item {
  id: string;
  title: string;
  url: string | null;
  contentType: string;
  createdAt: Date;
  currentPage: number | null;
  totalPages: number | null;
  timeSpentMinutes: number | null;
  estimatedMinutes: number | null;
  coverUrl: string | null;
  readwiseDocumentId?: string | null;
  lastReadAt?: Date | null;
  aiSummary?: string | null;
}

interface DashboardData {
  inProgressItems: Item[];
  allQueued: Item[];
  suggestedItems: Item[];
  suggestion: string;
  suggestedContentType: string;
  dietData: {
    sprintMinutes: number;
    sessionMinutes: number;
    journeyMinutes: number;
    totalMinutes: number;
  };
  readwiseConnected: boolean;
  lastReadwiseSyncAt: Date | null;
  userEmail: string;
  showOnboarding: boolean;
  onboardingStep: number;
}

export function DashboardClient({
  data,
  markItemDone,
  recategorizeItem,
  removeItem,
}: {
  data: DashboardData;
  markItemDone: (
    id: string,
    timeSpent: number,
    finished?: boolean,
  ) => Promise<void>;
  recategorizeItem: (id: string, newMacro: string) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
}) {
  const [activeView, setActiveView] = useState("suggestions");
  const [showOnboardingModal, setShowOnboardingModal] = useState(
    data.showOnboarding,
  );
  const {
    inProgressItems,
    allQueued,
    suggestedItems,
    suggestion,
    dietData,
    readwiseConnected,
    lastReadwiseSyncAt,
    userEmail,
    onboardingStep,
  } = data;

  const getProgressPercent = (item: Item) => {
    if (!item.totalPages || !item.currentPage) return 0;
    return Math.min(
      100,
      Math.round((item.currentPage / item.totalPages) * 100),
    );
  };

  const isBook = (item: Item) =>
    item.contentType === "JOURNEY" && item.totalPages && item.totalPages > 0;
  const hasProgressTracking = (item: Item) =>
    item.contentType === "JOURNEY" || item.contentType === "SESSION";

  const handleReadwiseSync = useCallback(async () => {
    const response = await fetch("/api/readwise/progress-sync", {
      method: "POST",
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(
        data.error || `Sync failed with status ${response.status}`,
      );
    }

    const result = await response.json();
    if (!result.success && result.errors?.length > 0) {
      throw new Error(result.errors[0] || "Sync completed with errors");
    }

    // Revalidate to refresh the dashboard with new data
    window.location.reload();
  }, []);

  const renderSuggestionView = () => (
    <div className="space-y-6">
      {/* In Progress Section */}
      {inProgressItems.length > 0 && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="text-sm font-semibold text-blue-900">
              Continue Reading
            </div>
            <span className="text-xs text-blue-600">
              ({inProgressItems.length} in progress)
            </span>
          </div>
          <div className="text-xs text-blue-700 mb-4">
            Pick up where you left off
          </div>
          <div className="space-y-2">
            {inProgressItems.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-blue-200 bg-white px-4 py-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-zinc-900">
                      {item.title}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs text-zinc-600">
                        {getContentTypeLabel(item.contentType as any)}
                      </span>
                      {isBook(item) && item.totalPages && (
                        <span className="text-xs text-zinc-500">
                          • {item.currentPage || 0}/{item.totalPages} pages (
                          {getProgressPercent(item)}%)
                        </span>
                      )}
                      {!isBook(item) && item.estimatedMinutes && (
                        <span className="text-xs text-zinc-500">
                          • ~{item.estimatedMinutes} min
                        </span>
                      )}
                      {item.timeSpentMinutes && item.timeSpentMinutes > 0 && (
                        <span className="text-xs text-blue-600">
                          • {item.timeSpentMinutes} min logged
                        </span>
                      )}
                      <RecategorizeButton
                        itemId={item.id}
                        currentContentType={item.contentType}
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
                          className="h-full bg-blue-600 transition-all"
                          style={{ width: `${getProgressPercent(item)}%` }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {hasProgressTracking(item) && (
                      <UpdateProgressButton
                        itemId={item.id}
                        itemTitle={item.title}
                        currentPage={item.currentPage || 0}
                        totalPages={item.totalPages || 0}
                        currentTimeSpent={item.timeSpentMinutes || 0}
                      />
                    )}
                    <MarkDoneButton
                      itemId={item.id}
                      itemTitle={item.title}
                      contentType={item.contentType}
                      currentPage={item.currentPage || 0}
                      totalPages={item.totalPages || undefined}
                      currentTimeSpent={item.timeSpentMinutes || 0}
                      estimatedMinutes={item.estimatedMinutes || undefined}
                      markAction={markItemDone}
                    />
                  </div>
                </div>
                {item.url || item.readwiseDocumentId ? (
                  <a
                    href={getItemOpenUrl(item) || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-sm text-zinc-700 underline"
                  >
                    {isReadwiseItem(item) ? "Open in Readwise" : "Open"}
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sync Status */}
      {readwiseConnected && (
        <div className="flex justify-end">
          <SyncStatus
            lastSyncAt={lastReadwiseSyncAt}
            isConnected={readwiseConnected}
            onSync={handleReadwiseSync}
          />
        </div>
      )}

      {/* Smart Suggestions */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <div className="text-sm font-medium text-zinc-900">
          Smart suggestion
        </div>
        <div className="mt-2 text-zinc-700">{suggestion}</div>
        {suggestedItems.length > 0 ? (
          <div className="mt-4 space-y-2">
            {suggestedItems.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-zinc-100 px-4 py-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-zinc-900">
                      {item.title}
                    </div>
                    {item.aiSummary && (
                      <div className="mt-2 text-xs text-zinc-600 italic">
                        ✨ {item.aiSummary}
                      </div>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-zinc-600">
                        {getContentTypeLabel(item.contentType as any)}
                      </span>
                      {isBook(item) && item.totalPages && (
                        <span className="text-xs text-zinc-500">
                          • {item.currentPage || 0}/{item.totalPages} pages (
                          {getProgressPercent(item)}%)
                        </span>
                      )}
                      {!isBook(item) && item.estimatedMinutes && (
                        <span className="text-xs text-zinc-500">
                          • ~{item.estimatedMinutes} min
                        </span>
                      )}
                      <RecategorizeButton
                        itemId={item.id}
                        currentContentType={item.contentType}
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
                    {hasProgressTracking(item) && (
                      <UpdateProgressButton
                        itemId={item.id}
                        itemTitle={item.title}
                        currentPage={item.currentPage || 0}
                        totalPages={item.totalPages || 0}
                        currentTimeSpent={item.timeSpentMinutes || 0}
                      />
                    )}
                    <StartReadingButton itemId={item.id} />
                    <MarkDoneButton
                      itemId={item.id}
                      itemTitle={item.title}
                      contentType={item.contentType}
                      currentPage={item.currentPage || 0}
                      totalPages={item.totalPages || undefined}
                      currentTimeSpent={item.timeSpentMinutes || 0}
                      estimatedMinutes={item.estimatedMinutes || undefined}
                      markAction={markItemDone}
                    />
                  </div>
                </div>
                {item.url || item.readwiseDocumentId ? (
                  <a
                    href={getItemOpenUrl(item) || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-sm text-zinc-700 underline"
                  >
                    {isReadwiseItem(item) ? "Open in Readwise" : "Open"}
                  </a>
                ) : null}
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
          <div className="text-xs text-zinc-500">
            Showing {allQueued.length} items
          </div>
        </div>
        <div className="mt-4 grid gap-2">
          {allQueued.length === 0 ? (
            <div className="text-sm text-zinc-600">
              Your queue is empty. Try adding some content.
            </div>
          ) : (
            allQueued.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-zinc-100 px-4 py-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-zinc-900">
                      {item.title}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs text-zinc-600">
                        {getContentTypeLabel(item.contentType as any)}
                      </span>
                      {isBook(item) && item.totalPages && (
                        <span className="text-xs text-zinc-500">
                          • {item.currentPage || 0}/{item.totalPages} pages (
                          {getProgressPercent(item)}%)
                        </span>
                      )}
                      {!isBook(item) && item.estimatedMinutes && (
                        <span className="text-xs text-zinc-500">
                          • ~{item.estimatedMinutes} min
                        </span>
                      )}
                      <RecategorizeButton
                        itemId={item.id}
                        currentContentType={item.contentType}
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
                    {hasProgressTracking(item) && (
                      <UpdateProgressButton
                        itemId={item.id}
                        itemTitle={item.title}
                        currentPage={item.currentPage || 0}
                        totalPages={item.totalPages || 0}
                        currentTimeSpent={item.timeSpentMinutes || 0}
                      />
                    )}
                    <MarkDoneButton
                      itemId={item.id}
                      itemTitle={item.title}
                      contentType={item.contentType}
                      currentPage={item.currentPage || 0}
                      totalPages={item.totalPages || undefined}
                      currentTimeSpent={item.timeSpentMinutes || 0}
                      estimatedMinutes={item.estimatedMinutes || undefined}
                      markAction={markItemDone}
                    />
                  </div>
                </div>
                {item.url || item.readwiseDocumentId ? (
                  <a
                    href={getItemOpenUrl(item) || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-sm text-zinc-700 underline"
                  >
                    {isReadwiseItem(item) ? "Open in Readwise" : "Open"}
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
        <div className="text-xs text-zinc-500">
          Showing {allQueued.length} items
        </div>
      </div>
      <div className="mt-4 grid gap-2">
        {allQueued.length === 0 ? (
          <div className="text-sm text-zinc-600">
            Your queue is empty. Try adding some content.
          </div>
        ) : (
          allQueued.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-zinc-100 px-4 py-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-sm font-medium text-zinc-900">
                    {item.title}
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs text-zinc-600">
                      {getContentTypeLabel(item.contentType as any)}
                    </span>
                    {isBook(item) && item.totalPages && (
                      <span className="text-xs text-zinc-500">
                        • {item.currentPage || 0}/{item.totalPages} pages (
                        {getProgressPercent(item)}%)
                      </span>
                    )}
                    {!isBook(item) && item.estimatedMinutes && (
                      <span className="text-xs text-zinc-500">
                        • ~{item.estimatedMinutes} min
                      </span>
                    )}
                    <RecategorizeButton
                      itemId={item.id}
                      currentContentType={item.contentType}
                      recategorizeAction={recategorizeItem}
                    />
                    <RemoveButton itemId={item.id} removeAction={removeItem} />
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
                  <StartReadingButton itemId={item.id} />
                  <MarkDoneButton
                    itemId={item.id}
                    itemTitle={item.title}
                    contentType={item.contentType}
                    currentPage={item.currentPage || 0}
                    totalPages={item.totalPages || undefined}
                    currentTimeSpent={item.timeSpentMinutes || 0}
                    estimatedMinutes={item.estimatedMinutes || undefined}
                    markAction={markItemDone}
                  />
                </div>
              </div>
              {item.url || item.readwiseDocumentId ? (
                <a
                  href={getItemOpenUrl(item) || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-sm text-zinc-700 underline"
                >
                  {isReadwiseItem(item) ? "Open in Readwise" : "Open"}
                </a>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <>
      {showOnboardingModal && (
        <OnboardingModal
          initialStep={onboardingStep}
          onClose={() => setShowOnboardingModal(false)}
        />
      )}

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
                Your time investment
              </h1>
              <p className="mt-1 text-sm text-zinc-600">
                Gentle nudges to trade bite-sized reads for thoughtful ones and
                make room for time-tested books.
              </p>
            </div>

            {activeView === "suggestions" && renderSuggestionView()}
            {activeView === "feed" && renderFeedView()}
          </div>
        </div>
      </div>
    </>
  );
}
