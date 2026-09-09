"use client";

import { useState, useEffect, useCallback } from "react";
import { InfluencerRow } from "./InfluencerRow";
import { CandidateRow } from "./CandidateRow";
import { showToast } from "./Toast";
import { scoreInfluencer } from "@/lib/score";
import type { Influencer, DiscoveredInfluencer } from "@/lib/types";

interface InfluencerListProps {
  influencers: Influencer[];
  newCountByInfluencer: Map<string, number>;
  candidates: DiscoveredInfluencer[];
}

const INFLUENCER_PREFS_KEY = "saphoEngage.v1.influencerPrefs";

interface InfluencerPrefs {
  pinned: string[];
  muted: string[];
  added: string[];
  dismissed: string[];
}

function loadPrefs(): InfluencerPrefs {
  try {
    const stored = localStorage.getItem(INFLUENCER_PREFS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        pinned: parsed.pinned || [],
        muted: parsed.muted || [],
        added: parsed.added || [],
        dismissed: parsed.dismissed || [],
      };
    }
  } catch {
    // Fall through
  }
  return { pinned: [], muted: [], added: [], dismissed: [] };
}

function savePrefs(prefs: InfluencerPrefs) {
  try {
    localStorage.setItem(INFLUENCER_PREFS_KEY, JSON.stringify(prefs));
  } catch (err) {
    console.warn("Failed to save influencer prefs:", err);
  }
}

export function InfluencerList({ influencers, newCountByInfluencer, candidates }: InfluencerListProps) {
  const [prefs, setPrefs] = useState<InfluencerPrefs>({ pinned: [], muted: [], added: [], dismissed: [] });
  const [mounted, setMounted] = useState(false);
  const [displayedInfluencers, setDisplayedInfluencers] = useState(influencers);
  const [showCandidate, setShowCandidate] = useState(false);

  useEffect(() => {
    const loaded = loadPrefs();
    setPrefs(loaded);
    setDisplayedInfluencers(influencers);
    setMounted(true);
  }, [influencers]);

  const handlePinChange = () => {
    setPrefs(loadPrefs());
  };

  const handleMuteChange = () => {
    setPrefs(loadPrefs());
  };

  const handleRecompute = useCallback(() => {
    // Re-score all influencers
    const rescored = displayedInfluencers.map((inf) => {
      const scoringResult = scoreInfluencer(inf.signals);
      return {
        ...inf,
        score: scoringResult?.score ?? inf.score,
        subscores: scoringResult?.subscores ?? inf.subscores,
      };
    });

    setDisplayedInfluencers(rescored);
    setShowCandidate(true);
    showToast("Ranking recomputed from latest signals.");
  }, [displayedInfluencers]);

  const currentCandidate = candidates.find(
    (cand) => !prefs.dismissed.includes(cand.linkedinUrl) && !prefs.added.includes(cand.linkedinUrl)
  );

  const handleAddCandidate = () => {
    if (!currentCandidate) return;

    const newPrefs = { ...prefs, added: [...prefs.added, currentCandidate.linkedinUrl] };
    setPrefs(newPrefs);
    savePrefs(newPrefs);
    setShowCandidate(false);
    showToast("Added — will re-score on next discovery run.");
  };

  const handleDismissCandidate = () => {
    if (!currentCandidate) return;

    const newPrefs = { ...prefs, dismissed: [...prefs.dismissed, currentCandidate.linkedinUrl] };
    setPrefs(newPrefs);
    savePrefs(newPrefs);
    setShowCandidate(false);
    showToast("Dismissed.");
  };

  // Expose recompute to parent via window for InfluencerActions
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__recomputeInfluencers = handleRecompute;
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.__recomputeInfluencers = undefined;
      }
    };
  }, [handleRecompute]);

  if (!mounted) {
    return null;
  }

  // Filter out muted, then sort by pinned + score
  const pinnedSet = new Set(prefs.pinned);
  const mutedSet = new Set(prefs.muted);

  const visibleInfluencers = displayedInfluencers
    .filter((inf) => !mutedSet.has(inf.id))
    .sort((a, b) => {
      const aPin = pinnedSet.has(a.id);
      const bPin = pinnedSet.has(b.id);
      if (aPin && !bPin) return -1;
      if (!aPin && bPin) return 1;
      return (b.score ?? 0) - (a.score ?? 0);
    });

  return (
    <div className="flex flex-col gap-3">
      {/* Candidate row */}
      {showCandidate && currentCandidate && (
        <CandidateRow
          candidate={currentCandidate}
          onAdd={handleAddCandidate}
          onDismiss={handleDismissCandidate}
        />
      )}

      {/* Influencer rows */}
      {visibleInfluencers.map((inf, index) => (
        <InfluencerRow
          key={inf.id}
          influencer={inf}
          rank={index + 1}
          newCount={newCountByInfluencer.get(inf.id) || 0}
          isPinned={pinnedSet.has(inf.id)}
          onPinChange={handlePinChange}
          onMuteChange={handleMuteChange}
        />
      ))}
    </div>
  );
}
