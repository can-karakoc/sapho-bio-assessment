import { loadPosts, loadInfluencers } from '@/lib/data';
import CompareClient from '@/components/CompareClient';

export default function ComparePage() {
  const posts = loadPosts();
  const influencers = loadInfluencers();

  return <CompareClient posts={posts} influencers={influencers} />;
}
