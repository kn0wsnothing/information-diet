"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MarkDoneButton } from "../mark-done-button";
import { RecategorizeButton } from "../recategorize-button";
import { RemoveButton } from "../remove-button";
import { SearchFilterBar } from "../search-filter-bar";
import { getItemOpenUrl, isReadwiseItem } from "@/lib/readwise-url";

interface Item {
  id: string;
  title: string;
  url: string | null;
  macro: string;
  createdAt: Date;
  readwiseDocumentId?: string | null;
  currentPage: number | null;
  totalPages: number | null;
  timeSpentMinutes: number | null;
  estimatedMinutes: number | null;
}

interface FeedClientProps {
  allQueued: Item[];
  markItemDone: (itemId: string, timeSpent: number, finished?: boolean) => Promise<void>;
  recategorizeItem: (itemId: string, newMacro: string) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
}

export function FeedClient({
  allQueued,
  markItemDone,
  recategorizeItem,
  removeItem,
}: FeedClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get("q") || "";
    const f = params.get("f") || "all";
    setSearchQuery(query);
    setFilter(f);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (searchQuery) params.set("q", searchQuery);
    else params.delete("q");
    if (filter && filter !== "all") params.set("f", filter);
    else params.delete("f");
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, "", newUrl);
  }, [searchQuery, filter]);

  const filteredItems = allQueued.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (item.url && item.url.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilter = filter === "all" || item.macro === filter;
    return matchesSearch && matchesFilter;
  });

  const getMacroLabel = (macro: string) => {
    if (macro === "SNACK") return "⚡ Sprint";
    if (macro === "MEAL") return "🎯 Session";
    return "🗺️ Journey";
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="mb-8">
          <Link href="/app" className="text-sm text-zinc-600 hover:text-zinc-900">
            ← Back to dashboard
          </Link>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          All items
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Browse and filter your reading queue.
        </p>

        <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6">
          <SearchFilterBar
            onSearch={setSearchQuery}
            onFilter={setFilter}
            currentFilter={filter}
            totalItems={allQueued.length}
            filteredItems={filteredItems.length}
          />

          <div className="mt-6 grid gap-2">
            {filteredItems.length === 0 ? (
              <div className="text-sm text-zinc-600 py-8 text-center">
                {searchQuery || filter !== "all"
                  ? "No items match your search or filter."
                  : "Your queue is empty. Try syncing Readwise or adding a link."}
              </div>
            ) : (
              filteredItems.map((item) => (
                <div key={item.id} className="rounded-xl border border-zinc-100 px-4 py-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-zinc-900">{item.title}</div>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-xs text-zinc-600">
                          {getMacroLabel(item.macro)}
                        </span>
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
                    </div>
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
                  {(item.url || item.readwiseDocumentId) ? (
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
    </div>
  );
}
