"use client";

import { useState, useEffect } from "react";
import { Avatar } from "./Avatar";
import { useSessionActivity } from "@/lib/context/SessionActivityContext";
import { formatRelativeDate } from "@/lib/format";
import type { Influencer } from "@/lib/types";

interface HistoryViewProps {
  influencers: Influencer[];
}

export function HistoryView({ influencers }: HistoryViewProps) {
  const { activities } = useSessionActivity();

  // Update header count whenever activities change
  useEffect(() => {
    // This effect will cause re-render when activities change
  }, [activities.length]);

  const [filterInfluencer, setFilterInfluencer] = useState<string>("all");
  const [filterAction, setFilterAction] = useState<string>("all");

  // Filter activities
  const filteredActivities = activities.filter((entry) => {
    if (filterInfluencer !== "all" && entry.influencerId !== filterInfluencer) {
      return false;
    }
    if (filterAction !== "all" && entry.action !== filterAction) {
      return false;
    }
    return true;
  });


  return (
    <>
      {/* Filters */}
      <div className="bg-surface border border-line rounded-lg p-4 mb-4">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Influencer filter */}
          <div className="flex items-center gap-2">
            <span className="font-sans text-[11px] text-muted uppercase tracking-tight">
              Influencer
            </span>
            <select
              value={filterInfluencer}
              onChange={(e) => setFilterInfluencer(e.target.value)}
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

          {/* Action filter */}
          <div className="flex items-center gap-2">
            <span className="font-sans text-[11px] text-muted uppercase tracking-tight">
              Action
            </span>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="font-sans text-xs text-ink bg-surface border border-line rounded-sm px-2 py-1.5 uppercase tracking-tight"
            >
              <option value="all">All</option>
              <option value="generated">Generated</option>
              <option value="regenerated">Regenerated</option>
              <option value="posted">Posted</option>
              <option value="copied">Copied</option>
              <option value="skipped">Skipped</option>
            </select>
          </div>

          {/* Count */}
          <div className="font-sans text-[11px] text-muted uppercase tracking-tight ml-auto">
            Showing {filteredActivities.length} of {activities.length}
          </div>
        </div>
      </div>

      {/* Activity list */}
      <div className="flex flex-col gap-3.5">
        {filteredActivities.map((entry) => {
          const influencer = influencers.find((i) => i.id === entry.influencerId);
          if (!influencer) return null;

          return (
            <div
              key={entry.id}
              className="bg-surface border border-line rounded-lg p-5"
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-3">
                <Avatar
                  name={influencer.name}
                  avatarUrl={influencer.avatarUrl}
                  size="sm"
                />
                <div className="flex-1">
                  <div className="font-sans font-semibold text-sm text-ink tracking-tight">
                    {entry.influencerName}
                  </div>
                  <div className="font-sans text-[11px] text-muted uppercase tracking-tight mt-0.5">
                    {entry.action} · {entry.goal} · {entry.model} ·{" "}
                    {formatRelativeDate(entry.createdAt)}
                  </div>
                </div>
              </div>

              {/* Original post snippet */}
              <div className="mb-3 px-3 py-2 bg-bg border-l-2 border-line">
                <div className="font-sans text-[10px] text-muted uppercase tracking-tight mb-1">
                  Original post
                </div>
                <div className="font-reading text-sm text-muted italic">
                  {entry.postSnippet}
                </div>
              </div>

              {/* Generated response */}
              <div className="mb-3">
                <div className="font-sans text-[10px] text-muted uppercase tracking-tight mb-1">
                  Generated response
                </div>
                <div className="font-reading text-[15px] text-ink leading-relaxed">
                  {entry.text}
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {filteredActivities.length === 0 && (
        <div className="text-center text-muted py-12 px-5 text-sm bg-surface border border-line rounded-lg font-sans uppercase tracking-tight">
          {activities.length === 0
            ? "No responses yet this session — generate one from the queue"
            : "No activities match the current filters"}
        </div>
      )}

    </>
  );
}
