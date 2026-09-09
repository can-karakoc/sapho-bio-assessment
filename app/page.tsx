import { loadInfluencers, loadPosts } from "@/lib/data";
import { scoreInfluencer } from "@/lib/score";
import { HeaderWithCounts } from "@/components/HeaderWithCounts";
import { InfluencerRow } from "@/components/InfluencerRow";

export default function InfluencersPage() {
  const influencers = loadInfluencers();
  const posts = loadPosts();

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
          <div className="flex gap-2 flex-wrap">
            {/* Secondary button */}
            <button className="font-sans border border-line bg-surface text-ink text-xs font-medium px-3.5 py-2.5 rounded-sm inline-flex items-center gap-1.5 hover:border-highlight-teal transition-all uppercase tracking-tight">
              ↻ Recompute
            </button>
            {/* Primary button - dark fill */}
            <button className="font-sans border border-highlight-teal bg-highlight-teal text-surface text-xs font-semibold px-3.5 py-2.5 rounded-sm inline-flex items-center gap-1.5 hover:bg-highlight-teal/90 transition-all uppercase tracking-tight">
              + Add
            </button>
          </div>
        </div>

        {/* Influencer list */}
        <div className="flex flex-col gap-3">
          {sortedInfluencers.map((inf, index) => (
            <InfluencerRow
              key={inf.id}
              influencer={inf}
              rank={index + 1}
              newCount={newCountByInfluencer.get(inf.id) || 0}
            />
          ))}
        </div>

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
