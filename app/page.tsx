import { loadInfluencers, loadPosts, loadDiscovery } from "@/lib/data";
import { scoreInfluencer } from "@/lib/score";
import { HeaderWithCounts } from "@/components/HeaderWithCounts";
import { InfluencerList } from "@/components/InfluencerList";
import { InfluencerActions } from "@/components/InfluencerActions";
import type { DiscoveredInfluencer } from "@/lib/types";

function cleanLinkedInUrl(url: string): string {
  // Strip query params and trailing slashes for comparison
  return url.split('?')[0].replace(/\/$/, '').toLowerCase();
}

export default function InfluencersPage() {
  const influencers = loadInfluencers();
  const posts = loadPosts();
  const allCandidates = loadDiscovery();

  const influencersWithScores = influencers.map((inf) => {
    const scoringResult = scoreInfluencer(inf.signals);
    return {
      ...inf,
      score: scoringResult?.score ?? inf.score,
      subscores: scoringResult?.subscores ?? inf.subscores,
    };
  });

  const sortedInfluencers = [...influencersWithScores].sort(
    (a, b) => (b.score ?? 0) - (a.score ?? 0)
  );

  // Filter candidates: exclude anyone already on the curated list
  const curatedUrls = new Set(
    influencers.map((inf) => cleanLinkedInUrl(inf.linkedinUrl || ''))
  );
  const newCandidates = allCandidates
    .filter((cand) => !curatedUrls.has(cleanLinkedInUrl(cand.linkedinUrl)))
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 5) as DiscoveredInfluencer[]; // Top 5 for client

  const newCountByInfluencer = new Map<string, number>();
  posts.forEach((post) => {
    if (post.status === "new") {
      const count = newCountByInfluencer.get(post.influencerId) || 0;
      newCountByInfluencer.set(post.influencerId, count + 1);
    }
  });

  const queueCount = posts.filter(
    (p) => p.status === "new" || p.status === "drafted"
  ).length;

  return (
    <div className="min-h-screen bg-bg">
      <HeaderWithCounts queueCount={queueCount} />
      <main className="max-w-[1080px] mx-auto px-[clamp(14px,3vw,26px)] py-8 pb-24">
        {/* Page header - Aspekta display */}
        <div className="flex items-end justify-between gap-3.5 flex-wrap mb-6">
          <div>
            <h1 className="font-display font-black text-[clamp(32px,3.8vw,40px)] tracking-tight m-0 text-ink leading-none">
              RANKED INFLUENCERS
            </h1>
            <p className="font-sans text-xs text-muted mt-2.5 mb-0 uppercase tracking-tight">
              Scored on reach, cadence, resonance, relevance & recency
            </p>
          </div>
          <InfluencerActions />
        </div>

        {/* Influencer list */}
        <InfluencerList
          influencers={sortedInfluencers}
          newCountByInfluencer={newCountByInfluencer}
          candidates={newCandidates}
        />

        {/* Empty state */}
        {sortedInfluencers.length === 0 && (
          <div className="text-center text-muted py-12 px-5 text-sm bg-surface border border-line rounded-lg font-sans uppercase tracking-tight">
            No influencers yet
          </div>
        )}
      </main>
    </div>
  );
}
