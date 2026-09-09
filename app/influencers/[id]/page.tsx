import Link from "next/link";
import { loadInfluencers, loadPosts } from "@/lib/data";
import { scoreInfluencer } from "@/lib/score";
import { Header } from "@/components/Header";
import { WorkspaceContent } from "@/components/WorkspaceContent";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function InfluencerWorkspacePage({ params }: PageProps) {
  const { id } = await params;

  const influencers = loadInfluencers();
  const allPosts = loadPosts();

  const influencer = influencers.find((inf) => inf.id === id);

  if (!influencer) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-2xl font-black text-ink mb-2">
            NOT FOUND
          </h1>
          <Link href="/" className="font-sans text-muted hover:underline uppercase text-sm tracking-tight">
            ← Back
          </Link>
        </div>
      </div>
    );
  }

  const scoringResult = scoreInfluencer(influencer.signals);
  const score = scoringResult?.score ?? influencer.score ?? 0;
  const subscores = scoringResult?.subscores ?? influencer.subscores;
  const influencerPosts = allPosts.filter((p) => p.influencerId === id);
  const queueCount = allPosts.filter(
    (p) => p.status === "new" || p.status === "drafted"
  ).length;

  return (
    <div className="min-h-screen bg-bg">
      <Header queueCount={queueCount} />
      <main className="max-w-[1080px] mx-auto px-[clamp(14px,3vw,26px)] py-8 pb-24">
        <WorkspaceContent
          influencer={influencer}
          posts={influencerPosts}
          score={score}
          subscores={subscores}
        />
      </main>
    </div>
  );
}
