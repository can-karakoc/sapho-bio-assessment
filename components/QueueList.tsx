"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { PostCard } from "./PostCard";
import { QueueToolbar, type FilterState } from "./QueueToolbar";
import { useSessionActivity } from "@/lib/context/SessionActivityContext";
import type { Influencer, Post } from "@/lib/types";

interface QueueListProps {
  posts: Post[];
  influencers: Influencer[];
}

export function QueueList({ posts, influencers }: QueueListProps) {
  const searchParams = useSearchParams();
  const { activities } = useSessionActivity(); // Listen for activity changes
  const [postedIds, setPostedIds] = useState<Set<string>>(new Set());

  // Re-check localStorage whenever activities change (posted/skipped cards)
  useEffect(() => {
    try {
      const stored = localStorage.getItem("saphoEngage.v1.drafts");
      if (stored) {
        const drafts = JSON.parse(stored);
        const posted = new Set<string>();
        Object.entries(drafts).forEach(([postId, data]: [string, unknown]) => {
          const draft = data as { status?: string };
          if (draft.status === "posted" || draft.status === "skipped") {
            posted.add(postId);
          }
        });
        setPostedIds(posted);
      }
    } catch (err) {
      console.warn("Failed to load posted IDs from localStorage:", err);
    }
  }, [activities]); // Re-run when activities change

  // Initialize filters from URL
  const [filters, setFilters] = useState<FilterState>({
    sortBy: (searchParams.get("sort") as FilterState["sortBy"]) || "date",
    sortDir: (searchParams.get("dir") as FilterState["sortDir"]) || "desc",
    influencerId: searchParams.get("inf") || "all",
    status: (searchParams.get("status") as FilterState["status"]) || "all",
    minLikes: parseInt(searchParams.get("minLikes") || "0"),
  });

  // Create influencer lookup map
  const influencerMap = new Map(influencers.map((inf) => [inf.id, inf]));

  // Apply filters and sort
  const filteredAndSortedPosts = (() => {
    // 0. First filter out posted/skipped posts
    const activePosts = posts.filter((post) => !postedIds.has(post.id));

    // 1. Apply filters
    const filtered = activePosts.filter((post) => {
      // Influencer filter
      if (
        filters.influencerId !== "all" &&
        post.influencerId !== filters.influencerId
      ) {
        return false;
      }

      // Status filter
      if (filters.status !== "all") {
        const postStatus = (post.status || "new").toLowerCase();
        if (postStatus !== filters.status) {
          return false;
        }
      }

      // Min likes filter
      if (filters.minLikes > 0 && post.reactions < filters.minLikes) {
        return false;
      }

      return true;
    });

    // 2. Sort
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (filters.sortBy) {
        case "likes":
          comparison = a.reactions - b.reactions;
          break;
        case "comments":
          comparison = a.comments - b.comments;
          break;
        case "date":
        default:
          comparison =
            new Date(a.postedAt).getTime() - new Date(b.postedAt).getTime();
          break;
      }

      return filters.sortDir === "asc" ? comparison : -comparison;
    });

    return filtered;
  })();

  return (
    <>
      <QueueToolbar
        influencers={influencers}
        totalCount={posts.length}
        filteredCount={filteredAndSortedPosts.length}
        onFilterChange={setFilters}
      />

      {/* Posts */}
      <div className="flex flex-col gap-3.5">
        {filteredAndSortedPosts.map((post) => {
          const influencer = influencerMap.get(post.influencerId);
          if (!influencer) return null;

          return (
            <PostCard
              key={post.id}
              post={post}
              influencer={influencer}
              showInfluencer={true}
            />
          );
        })}
      </div>

      {/* Empty state */}
      {filteredAndSortedPosts.length === 0 && (
        <div className="text-center text-muted py-12 px-5 text-sm bg-surface border border-line rounded-lg font-sans uppercase tracking-tight">
          {posts.length === 0
            ? "Queue clear"
            : "No posts match the current filters"}
        </div>
      )}
    </>
  );
}
