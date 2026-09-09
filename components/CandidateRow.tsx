"use client";

import { Avatar } from "./Avatar";

interface Candidate {
  name: string;
  linkedinUrl: string;
  postFrequency: number;
  totalEngagement: number;
  discoveredKeywords: string[];
  score?: number;
  subscores?: {
    reach: number;
    cadence: number;
    resonance: number;
    relevance: number;
    recency: number;
  };
}

interface CandidateRowProps {
  candidate: Candidate;
  onAdd: () => void;
  onDismiss: () => void;
}

export function CandidateRow({ candidate, onAdd, onDismiss }: CandidateRowProps) {
  return (
    <div className="bg-surface border-2 border-dashed border-highlight-teal rounded-lg p-5 animate-fade-in">
      <div className="flex items-center justify-between gap-4 mb-3">
        <div className="flex items-center gap-3">
          <Avatar name={candidate.name} size="sm" />
          <div>
            <div className="font-sans font-semibold text-sm text-ink">
              {candidate.name}
            </div>
            <div className="font-mono text-[10px] text-muted uppercase tracking-tight mt-0.5">
              Discovered candidate · Score {Math.round(candidate.score ?? 0)}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onDismiss}
            className="font-sans border border-line bg-surface text-ink text-xs font-medium px-3 py-2 rounded-sm hover:border-muted transition-all uppercase tracking-tight"
          >
            Dismiss
          </button>
          <button
            onClick={onAdd}
            className="font-sans border border-highlight-teal bg-highlight-teal text-surface text-xs font-semibold px-3 py-2 rounded-sm hover:bg-highlight-teal/90 transition-all uppercase tracking-tight"
          >
            + Add
          </button>
        </div>
      </div>

      {/* Keywords */}
      {candidate.discoveredKeywords.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {candidate.discoveredKeywords.map((kw) => (
            <span
              key={kw}
              className="font-mono text-[9px] text-muted border border-line px-2 py-1 rounded-sm uppercase tracking-tight"
            >
              {kw}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
