"use client";

import { useState } from "react";
import Link from "next/link";
import { Avatar } from "./Avatar";
import { PostCard } from "./PostCard";
import type { Influencer, Post } from "@/lib/types";

interface WorkspaceContentProps {
  influencer: Influencer;
  posts: Post[];
  score: number;
  subscores?: {
    reach: number;
    cadence: number;
    resonance: number;
    relevance: number;
    recency: number;
  };
}

export function WorkspaceContent({
  influencer,
  posts,
  score,
  subscores,
}: WorkspaceContentProps) {
  const [timeWindow, setTimeWindow] = useState<"30" | "90" | "all">("90");

  const now = new Date();
  const filteredPosts = posts.filter((post) => {
    if (timeWindow === "all") return true;
    const postDate = new Date(post.postedAt);
    const daysAgo = Math.floor(
      (now.getTime() - postDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysAgo <= Number(timeWindow);
  });

  const sortedPosts = [...filteredPosts].sort(
    (a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
  );

  return (
    <div>
      {/* Back button */}
      <div className="flex gap-2 mb-4">
        <Link
          href="/"
          className="font-sans border border-transparent bg-transparent text-muted text-xs font-medium px-2 py-2 rounded-sm inline-flex items-center gap-1.5 hover:text-ink transition-all uppercase tracking-tight"
        >
          ← All Influencers
        </Link>
      </div>

      {/* Workspace header - taller card with 52px avatar */}
      <div className="bg-surface border border-line rounded-lg shadow-sm p-6 mb-4">
        <div className="flex gap-5 items-center flex-wrap">
          <Avatar name={influencer.name} avatarUrl={influencer.avatarUrl} size="lg" />
          <div className="flex-1 min-w-0">
            <h1 className="font-sans font-bold text-xl leading-tight m-0 text-ink tracking-tight">
              {influencer.name}
            </h1>
            <div className="font-sans text-xs text-muted mt-1.5 uppercase tracking-tight">
              {influencer.role} · {influencer.company}
            </div>
            <a
              href={influencer.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-sans text-[11px] text-highlight-teal mt-1 inline-block hover:underline uppercase tracking-tight font-medium"
            >
              LinkedIn →
            </a>
          </div>
          <div className="text-right">
            {/* Score - Inter, dark teal */}
            <div className="font-numeric text-[46px] leading-none tabular-nums font-light text-highlight-teal">
              {score}
            </div>
            <div className="font-sans text-[9px] tracking-wider uppercase text-muted mt-1.5">
              INFLUENCE
            </div>
            <div className="flex gap-1 justify-end mt-2.5">
              <button className="border border-line text-muted w-[32px] h-[32px] rounded-sm grid place-items-center text-sm hover:border-highlight-teal hover:text-highlight-teal transition-all">
                📌
              </button>
              <button className="border border-line text-muted w-[32px] h-[32px] rounded-sm grid place-items-center text-sm hover:border-highlight-teal hover:text-highlight-teal transition-all">
                🔇
              </button>
            </div>
          </div>
        </div>

        {/* Subscores - mint bars */}
        {subscores && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-5 pt-5 border-t border-line">
            {Object.entries(subscores).map(([key, value]) => (
              <div key={key}>
                <div className="font-sans text-[9px] tracking-wide uppercase text-muted">
                  {key}
                </div>
                <div className="font-numeric text-base mt-1 tabular-nums font-light text-ink">
                  {value}
                </div>
                <div className="h-1 bg-line rounded-full overflow-hidden mt-2">
                  <span
                    className="block h-full bg-highlight-mint rounded-full"
                    style={{ width: `${value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Time window control */}
      <div className="flex items-center gap-2.5 mb-4 flex-wrap">
        <span className="font-sans text-xs text-muted uppercase tracking-tight">
          Posts from
        </span>
        <div
          className="inline-flex bg-surface border border-line rounded-sm p-[2px]"
          role="group"
        >
          {(["30", "90", "all"] as const).map((window) => (
            <button
              key={window}
              onClick={() => setTimeWindow(window)}
              className={`font-sans border-none bg-transparent text-xs font-medium px-3 py-1.5 rounded-sm transition-all uppercase tracking-tight ${
                timeWindow === window
                  ? "bg-highlight-mint text-ink"
                  : "text-muted hover:text-ink"
              }`}
            >
              {window === "all" ? "All" : `${window}d`}
            </button>
          ))}
        </div>
        <span className="font-sans text-xs text-muted uppercase tracking-tight">
          {sortedPosts.length} post{sortedPosts.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Posts */}
      <div className="flex flex-col gap-3.5">
        {sortedPosts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            influencer={influencer}
            showInfluencer={false}
          />
        ))}
      </div>

      {/* Empty state */}
      {sortedPosts.length === 0 && (
        <div className="text-center text-muted py-12 px-5 text-sm bg-surface border border-line rounded-lg font-sans uppercase tracking-tight">
          No posts in this window
        </div>
      )}
    </div>
  );
}
