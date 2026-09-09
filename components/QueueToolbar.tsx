"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Influencer } from "@/lib/types";

type SortBy = "date" | "likes" | "comments";
type SortDir = "asc" | "desc";
type StatusFilter = "all" | "new" | "drafted";

interface QueueToolbarProps {
  influencers: Influencer[];
  totalCount: number;
  filteredCount: number;
  onFilterChange: (filters: FilterState) => void;
}

export interface FilterState {
  sortBy: SortBy;
  sortDir: SortDir;
  influencerId: string; // "all" or influencer id
  status: StatusFilter;
  minLikes: number;
}

export function QueueToolbar({
  influencers,
  totalCount,
  filteredCount,
  onFilterChange,
}: QueueToolbarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read initial state from URL
  const sortBy = (searchParams.get("sort") as SortBy) || "date";
  const sortDir = (searchParams.get("dir") as SortDir) || "desc";
  const influencerId = searchParams.get("inf") || "all";
  const status = (searchParams.get("status") as StatusFilter) || "all";
  const minLikes = parseInt(searchParams.get("minLikes") || "0");

  const updateFilters = (updates: Partial<FilterState>) => {
    const newState: FilterState = {
      sortBy: updates.sortBy ?? sortBy,
      sortDir: updates.sortDir ?? sortDir,
      influencerId: updates.influencerId ?? influencerId,
      status: updates.status ?? status,
      minLikes: updates.minLikes ?? minLikes,
    };

    // Update URL
    const params = new URLSearchParams();
    if (newState.sortBy !== "date") params.set("sort", newState.sortBy);
    if (newState.sortDir !== "desc") params.set("dir", newState.sortDir);
    if (newState.influencerId !== "all") params.set("inf", newState.influencerId);
    if (newState.status !== "all") params.set("status", newState.status);
    if (newState.minLikes > 0) params.set("minLikes", newState.minLikes.toString());

    const queryString = params.toString();
    router.push(queryString ? `/queue?${queryString}` : "/queue");

    // Notify parent
    onFilterChange(newState);
  };

  const handleReset = () => {
    router.push("/queue");
    onFilterChange({
      sortBy: "date",
      sortDir: "desc",
      influencerId: "all",
      status: "all",
      minLikes: 0,
    });
  };

  return (
    <div className="bg-surface border border-line rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-3">
        {/* Sort controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-sans text-[11px] text-muted uppercase tracking-tight">
            Sort by
          </span>

          {/* Sort type selector */}
          <div className="inline-flex bg-bg border border-line rounded-sm p-[2px]">
            <button
              onClick={() => updateFilters({ sortBy: "date" })}
              className={`font-sans text-xs px-3 py-1.5 rounded-sm transition-all uppercase tracking-tight ${
                sortBy === "date"
                  ? "bg-highlight-teal text-surface font-semibold"
                  : "text-ink hover:text-highlight-teal"
              }`}
            >
              Date
            </button>
            <button
              onClick={() => updateFilters({ sortBy: "likes" })}
              className={`font-sans text-xs px-3 py-1.5 rounded-sm transition-all uppercase tracking-tight ${
                sortBy === "likes"
                  ? "bg-highlight-teal text-surface font-semibold"
                  : "text-ink hover:text-highlight-teal"
              }`}
            >
              Likes
            </button>
            <button
              onClick={() => updateFilters({ sortBy: "comments" })}
              className={`font-sans text-xs px-3 py-1.5 rounded-sm transition-all uppercase tracking-tight ${
                sortBy === "comments"
                  ? "bg-highlight-teal text-surface font-semibold"
                  : "text-ink hover:text-highlight-teal"
              }`}
            >
              Comments
            </button>
          </div>

          {/* Direction toggle */}
          <button
            onClick={() =>
              updateFilters({ sortDir: sortDir === "asc" ? "desc" : "asc" })
            }
            className="font-sans border border-line bg-surface text-ink text-xs font-medium px-3 py-1.5 rounded-sm hover:border-highlight-teal transition-all"
            title={sortDir === "desc" ? "Descending" : "Ascending"}
          >
            {sortDir === "desc" ? "↓" : "↑"}
          </button>
        </div>

        {/* Reset button */}
        <button
          onClick={handleReset}
          className="font-sans text-xs text-muted hover:text-ink uppercase tracking-tight transition-colors"
        >
          Reset
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Influencer filter */}
        <div className="flex items-center gap-2">
          <span className="font-sans text-[11px] text-muted uppercase tracking-tight">
            Influencer
          </span>
          <select
            value={influencerId}
            onChange={(e) => updateFilters({ influencerId: e.target.value })}
            className="font-sans text-xs text-ink bg-surface border border-line rounded-sm px-2 py-1.5 uppercase tracking-tight"
          >
            <option value="all">All</option>
            {influencers.map((inf) => (
              <option key={inf.id} value={inf.id}>
                {inf.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-2">
          <span className="font-sans text-[11px] text-muted uppercase tracking-tight">
            Status
          </span>
          <div className="inline-flex bg-bg border border-line rounded-sm p-[2px]">
            <button
              onClick={() => updateFilters({ status: "all" })}
              className={`font-sans text-xs px-2.5 py-1 rounded-sm transition-all uppercase tracking-tight ${
                status === "all"
                  ? "bg-highlight-teal text-surface font-semibold"
                  : "text-ink hover:text-highlight-teal"
              }`}
            >
              All
            </button>
            <button
              onClick={() => updateFilters({ status: "new" })}
              className={`font-sans text-xs px-2.5 py-1 rounded-sm transition-all uppercase tracking-tight ${
                status === "new"
                  ? "bg-highlight-teal text-surface font-semibold"
                  : "text-ink hover:text-highlight-teal"
              }`}
            >
              New
            </button>
            <button
              onClick={() => updateFilters({ status: "drafted" })}
              className={`font-sans text-xs px-2.5 py-1 rounded-sm transition-all uppercase tracking-tight ${
                status === "drafted"
                  ? "bg-highlight-teal text-surface font-semibold"
                  : "text-ink hover:text-highlight-teal"
              }`}
            >
              Drafted
            </button>
          </div>
        </div>

        {/* Min likes filter */}
        <div className="flex items-center gap-2">
          <span className="font-sans text-[11px] text-muted uppercase tracking-tight">
            Min likes
          </span>
          <input
            type="number"
            min="0"
            value={minLikes}
            onChange={(e) =>
              updateFilters({ minLikes: parseInt(e.target.value) || 0 })
            }
            className="font-sans text-xs text-ink bg-surface border border-line rounded-sm px-2 py-1.5 w-16 uppercase tracking-tight"
          />
        </div>
      </div>

      {/* Caption */}
      <div className="font-sans text-[11px] text-muted uppercase tracking-tight mt-3">
        Showing {filteredCount} of {totalCount}
      </div>
    </div>
  );
}
