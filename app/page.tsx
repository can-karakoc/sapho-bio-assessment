import { loadPosts, loadInfluencers } from '@/lib/data';
import InboxClient from '@/components/InboxClient';

export default function InboxPage() {
  // Server-side data loading
  const posts = loadPosts();
  const influencers = loadInfluencers();

  // Pass data to client component
  return <InboxClient posts={posts} influencers={influencers} />;
}
