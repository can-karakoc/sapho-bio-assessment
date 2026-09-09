import { loadInfluencers, loadPosts } from "@/lib/data";
import { HeaderWithCounts } from "@/components/HeaderWithCounts";
import { HistoryView } from "@/components/HistoryView";

export default function HistoryPage() {
  const influencers = loadInfluencers();
  const posts = loadPosts();

  const queueCount = posts.filter(
    (p) => p.status === "new" || p.status === "drafted"
  ).length;

  return (
    <div className="min-h-screen bg-bg">
      <HeaderWithCounts queueCount={queueCount} />
      <main className="max-w-[1080px] mx-auto px-[clamp(14px,3vw,26px)] py-8 pb-24">
        {/* Page header */}
        <div className="flex items-end justify-between gap-3.5 flex-wrap mb-6">
          <div>
            <h1 className="font-display font-black text-[clamp(32px,3.8vw,40px)] tracking-tight m-0 text-ink leading-none">
              HISTORY
            </h1>
            <p className="font-sans text-xs text-muted mt-2.5 mb-0 uppercase tracking-tight">
              See past engagements with posts
            </p>
          </div>
        </div>

        <HistoryView influencers={influencers} />
      </main>
    </div>
  );
}
