"use client";

import { useState, useEffect } from "react";
import { InfluencerRow } from "./InfluencerRow";
import type { Influencer } from "@/lib/types";

interface InfluencerListProps {
  influencers: Influencer[];
  newCountByInfluencer: Map<string, number>;
}

const INFLUENCER_PREFS_KEY = "saphoEngage.v1.influencerPrefs";

function loadPinnedInfluencers(): Set<string> {
  try {
    const stored = localStorage.getItem(INFLUENCER_PREFS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return new Set(parsed.pinned || []);
    }
  } catch {
    // Fall through
  }
  return new Set();
}

function loadMutedInfluencers(): Set<string> {
  try {
    const stored = localStorage.getItem(INFLUENCER_PREFS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return new Set(parsed.muted || []);
    }
  } catch {
    // Fall through
  }
  return new Set();
}

export function InfluencerList({ influencers, newCountByInfluencer }: InfluencerListProps) {
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());
  const [mutedIds, setMutedIds] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setPinnedIds(loadPinnedInfluencers());
    setMutedIds(loadMutedInfluencers());
    setMounted(true);
  }, []);

  const handlePinChange = () => {
    setPinnedIds(loadPinnedInfluencers());
  };

  const handleMuteChange = () => {
    setMutedIds(loadMutedInfluencers());
  };

  if (!mounted) {
    return null;
  }

  // Filter out muted, then sort by pinned + score
  const visibleInfluencers = influencers
    .filter((inf) => !mutedIds.has(inf.id))
    .sort((a, b) => {
      const aPin = pinnedIds.has(a.id);
      const bPin = pinnedIds.has(b.id);
      if (aPin && !bPin) return -1;
      if (!aPin && bPin) return 1;
      return (b.score ?? 0) - (a.score ?? 0);
    });

  return (
    <div className="flex flex-col gap-3">
      {visibleInfluencers.map((inf, index) => (
        <InfluencerRow
          key={inf.id}
          influencer={inf}
          rank={index + 1}
          newCount={newCountByInfluencer.get(inf.id) || 0}
          isPinned={pinnedIds.has(inf.id)}
          onPinChange={handlePinChange}
          onMuteChange={handleMuteChange}
        />
      ))}
    </div>
  );
}
