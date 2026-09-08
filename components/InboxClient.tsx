'use client';

import { useState } from 'react';
import PostListItem from './PostListItem';
import PostDetailPane from './PostDetailPane';
import Link from 'next/link';
import type { Post, Influencer } from '@/lib/types';

interface InboxClientProps {
  posts: Post[];
  influencers: Influencer[];
}

export default function InboxClient({ posts, influencers }: InboxClientProps) {
  const [selectedPostId, setSelectedPostId] = useState<string | null>(
    posts.length > 0 ? posts[0].id : null
  );

  const selectedPost = posts.find((p) => p.id === selectedPostId);
  const selectedInfluencer = selectedPost
    ? influencers.find((inf) => inf.id === selectedPost.influencerId)
    : undefined;

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Sapho Growth Inbox
          </h1>
          <p className="text-sm text-gray-600">
            AI-assisted LinkedIn engagement for biotech marketing
          </p>
        </div>
        <nav className="flex gap-4">
          <Link
            href="/metrics"
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded transition-colors"
          >
            📊 Metrics
          </Link>
          <Link
            href="/validation"
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded transition-colors"
          >
            ✓ Validation
          </Link>
          <Link
            href="/compare"
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded transition-colors"
          >
            ⚖️ Compare Models
          </Link>
        </nav>
      </header>

      {/* Two-pane layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left pane: Post queue */}
        <div className="w-96 bg-white border-r overflow-y-auto">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="font-semibold text-gray-700">
              Queue ({posts.length} posts)
            </h2>
          </div>

          {posts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No posts in queue</p>
              <p className="text-sm mt-2">
                Run <code className="bg-gray-100 px-2 py-1 rounded">npm run refresh</code> to
                scrape posts
              </p>
            </div>
          ) : (
            posts.map((post) => (
              <PostListItem
                key={post.id}
                post={post}
                influencer={influencers.find((inf) => inf.id === post.influencerId)}
                isSelected={post.id === selectedPostId}
                onClick={() => setSelectedPostId(post.id)}
              />
            ))
          )}
        </div>

        {/* Right pane: Detail */}
        {selectedPost && selectedInfluencer ? (
          <PostDetailPane post={selectedPost} influencer={selectedInfluencer} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <p className="text-lg font-medium">No post selected</p>
              <p className="text-sm mt-2">Select a post from the queue to get started</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
