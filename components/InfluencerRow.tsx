"use client";

import Link from "next/link";
import { Avatar } from "./Avatar";
import { Sparkline } from "./Sparkline";
import {
  formatNumber,
  formatPostsPerMonth,
  formatEngagement,
  formatRelevance,
} from "@/lib/format";
import type { Influencer } from "@/lib/types";
import { useState, useEffect } from "react";

interface InfluencerRowProps {
  influencer: Influencer;
  rank: number;
  newCount: number;
  isPinned?: boolean;
  onPinChange?: (influencerId: string, isPinned: boolean) => void;
  onMuteChange?: (influencerId: string, isMuted: boolean) => void;
}

const INFLUENCER_PREFS_KEY = "saphoEngage.v1.influencerPrefs";

interface InfluencerPrefs {
  pinned: Set<string>;
  muted: Set<string>;
}

function loadPrefs(): InfluencerPrefs {
  try {
    const stored = localStorage.getItem(INFLUENCER_PREFS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        pinned: new Set(parsed.pinned || []),
        muted: new Set(parsed.muted || []),
      };
    }
  } catch {
    // Fall through to defaults
  }
  return { pinned: new Set(), muted: new Set() };
}

function savePrefs(prefs: InfluencerPrefs) {
  try {
    localStorage.setItem(
      INFLUENCER_PREFS_KEY,
      JSON.stringify({
        pinned: Array.from(prefs.pinned),
        muted: Array.from(prefs.muted),
      })
    );
  } catch (err) {
    console.warn("Failed to save influencer prefs:", err);
  }
}

export function InfluencerRow({
  influencer,
  rank,
  newCount,
  isPinned = false,
  onPinChange,
  onMuteChange,
}: InfluencerRowProps) {
  const [pinned, setPinned] = useState(isPinned);
  const [muted, setMuted] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load initial state from localStorage
  useEffect(() => {
    const prefs = loadPrefs();
    setPinned(prefs.pinned.has(influencer.id));
    setMuted(prefs.muted.has(influencer.id));
    setMounted(true);
  }, [influencer.id]);

  if (!mounted || muted) {
    return null;
  }

  const handlePin = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newPinned = !pinned;
    setPinned(newPinned);

    const prefs = loadPrefs();
    if (newPinned) {
      prefs.pinned.add(influencer.id);
    } else {
      prefs.pinned.delete(influencer.id);
    }
    savePrefs(prefs);

    onPinChange?.(influencer.id, newPinned);
  };

  const handleMute = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMuted(true);

    const prefs = loadPrefs();
    prefs.muted.add(influencer.id);
    savePrefs(prefs);

    onMuteChange?.(influencer.id, true);
  };

  return (
    <Link
      href={`/influencers/${influencer.id}`}
      className={`block bg-surface border rounded-lg shadow-sm hover:shadow transition-all cursor-pointer ${
        pinned ? "border-highlight-teal" : "border-line"
      }`}
    >
      {/* TALLER CARD - increased padding */}
      <div className="grid grid-cols-[34px_52px_1fr_auto] gap-4 items-center p-6 md:p-5">
        {/* Rank - Inter font */}
        <div className="font-numeric text-lg text-muted text-center tabular-nums font-light">
          {pinned ? (
            <div>
              ·<div className="text-[11px] mt-0.5">📌</div>
            </div>
          ) : (
            rank
          )}
        </div>

        {/* Avatar - 52px with LinkedIn photo support */}
        <Avatar name={influencer.name} avatarUrl={influencer.avatarUrl} size="md" />

        {/* Info */}
        <div className="min-w-0">
          {/* Name - body font, NOT mono */}
          <div className="font-sans font-semibold text-base text-ink flex items-center gap-2 flex-wrap">
            {influencer.name}
            {/* NEW badge - mint background */}
            {newCount > 0 && (
              <span className="font-sans text-[10px] font-bold bg-highlight-mint text-ink rounded-sm px-2 py-0.5 uppercase tracking-tight">
                {newCount} NEW
              </span>
            )}
          </div>
          {/* Role & Company - body font, NOT mono */}
          <div className="font-sans text-sm text-muted mt-1">
            {influencer.role} · {influencer.company}
          </div>
          {/* Stats - MONO font only */}
          <div className="font-mono text-[11px] text-muted mt-2 flex gap-3 flex-wrap uppercase tracking-tight">
            <span>
              {formatNumber(influencer.signals?.followers)} followers
            </span>
            <span>{formatPostsPerMonth(influencer.signals?.postsPerMonth)}</span>
            <span>
              {formatEngagement(influencer.signals?.avgEngagement)} avg eng
            </span>
            <span>
              {formatRelevance(influencer.signals?.relevance)} relevant
            </span>
          </div>
        </div>

        {/* Right: sparkline, score, actions */}
        <div className="flex items-center gap-4">
          {/* Sparkline - ink color */}
          {influencer.signals?.recentEngagement &&
            influencer.signals.recentEngagement.length > 0 && (
              <Sparkline
                data={influencer.signals.recentEngagement}
                className="hidden md:block"
              />
            )}

          {/* Score - Inter font, dark teal number, mint bar */}
          <div className="text-right min-w-[74px]">
            <div className="font-numeric text-3xl tabular-nums leading-none font-light text-highlight-teal">
              {influencer.score ?? "—"}
            </div>
            <div className="font-sans text-[9px] tracking-wider uppercase text-muted mt-1">
              SCORE
            </div>
            {/* Mint score bar */}
            <div className="h-[6px] w-[74px] bg-line rounded-full overflow-hidden mt-2">
              <span
                className="block h-full bg-highlight-mint rounded-full"
                style={{ width: `${influencer.score ?? 0}%` }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-1">
            <button
              onClick={handlePin}
              className={`border w-[32px] h-[32px] rounded-sm grid place-items-center text-sm transition-all ${
                pinned
                  ? "bg-highlight-teal text-surface border-highlight-teal"
                  : "border-line text-muted hover:border-highlight-teal hover:text-highlight-teal"
              }`}
              title={pinned ? "Unpin" : "Pin"}
              aria-pressed={pinned}
            >
              📌
            </button>
            <button
              onClick={handleMute}
              className="border border-line text-muted w-[32px] h-[32px] rounded-sm grid place-items-center text-sm hover:border-highlight-teal hover:text-highlight-teal transition-all"
              title="Mute"
            >
              🔇
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
