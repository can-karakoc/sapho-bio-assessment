import { Suspense } from "react";
import { loadInfluencers, loadPosts } from "@/lib/data";
import { HeaderWithCounts } from "@/components/HeaderWithCounts";
import { QueueList } from "@/components/QueueList";

export default function QueuePage() {
  const influencers = loadInfluencers();
  const allPosts = loadPosts();

  // Queue posts (new or drafted, unfiltered for badge count)
  const queuePosts = allPosts.filter(
    (p) => p.status === "new" || p.status === "drafted"
  );

  return (
    <div className="min-h-screen bg-bg">
      <HeaderWithCounts queueCount={queuePosts.length} />
      <main className="max-w-[1080px] mx-auto px-[clamp(14px,3vw,26px)] py-8 pb-24">
        {/* Page header */}
        <div className="flex items-end justify-between gap-3.5 flex-wrap mb-6">
          <div>
            <h1 className="font-display font-black text-[clamp(32px,3.8vw,40px)] tracking-tight m-0 text-ink leading-none">
              RESPONSE QUEUE
            </h1>
            <p className="font-sans text-xs text-muted mt-2.5 mb-0 uppercase tracking-tight">
              Queued posts with filtering options
            </p>
          </div>
        </div>

        {/* Client-side filtered/sorted list with toolbar */}
        <Suspense fallback={<div className="text-muted">Loading...</div>}>
          <QueueList posts={queuePosts} influencers={influencers} />
        </Suspense>
      </main>
    </div>
  );
}
