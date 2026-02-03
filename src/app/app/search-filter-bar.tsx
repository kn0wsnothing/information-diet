"use client";

interface SearchFilterBarProps {
  onSearch: (query: string) => void;
  onFilter: (filter: string) => void;
  currentFilter: string;
  totalItems: number;
  filteredItems: number;
}

export function SearchFilterBar({
  onSearch,
  onFilter,
  currentFilter,
  totalItems,
  filteredItems,
}: SearchFilterBarProps) {
  const filters = [
    { id: "all", label: "All" },
    { id: "SNACK", label: "Bite-sized" },
    { id: "MEAL", label: "Thoughtful" },
    { id: "TIME_TESTED", label: "Time-tested" },
  ];

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search items..."
          onChange={(e) => onSearch(e.target.value)}
          className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 pl-10 shadow-sm"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => onFilter(filter.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              currentFilter === filter.id
                ? "bg-zinc-900 text-white"
                : "bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Results count */}
      <div className="text-xs text-zinc-500">
        Showing {filteredItems} of {totalItems} items
      </div>
    </div>
  );
}
