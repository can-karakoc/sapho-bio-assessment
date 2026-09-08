'use client';

import type { Post, Influencer } from '@/lib/types';

interface PostListItemProps {
  post: Post;
  influencer: Influencer | undefined;
  isSelected: boolean;
  onClick: () => void;
}

const statusColors = {
  new: 'bg-blue-100 text-blue-800',
  drafted: 'bg-yellow-100 text-yellow-800',
  posted: 'bg-green-100 text-green-800',
  skipped: 'bg-gray-100 text-gray-800',
};

export default function PostListItem({
  post,
  influencer,
  isSelected,
  onClick,
}: PostListItemProps) {
  const status = post.status || 'new';
  const snippet = post.text.slice(0, 120) + (post.text.length > 120 ? '...' : '');

  return (
    <div
      onClick={onClick}
      className={`p-4 border-b cursor-pointer transition-colors ${
        isSelected
          ? 'bg-blue-50 border-l-4 border-l-blue-500'
          : 'hover:bg-gray-50'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar placeholder */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex-shrink-0 flex items-center justify-center text-white font-semibold">
          {influencer?.name.charAt(0) || '?'}
        </div>

        <div className="flex-1 min-w-0">
          {/* Influencer info */}
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm truncate">
              {influencer?.name || 'Unknown'}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[status]}`}>
              {status}
            </span>
          </div>

          {/* Company */}
          <p className="text-xs text-gray-600 mb-2">
            {influencer?.title} @ {influencer?.company}
          </p>

          {/* Post snippet */}
          <p className="text-sm text-gray-700 line-clamp-2">{snippet}</p>

          {/* Engagement metrics */}
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span>👍 {post.reactions}</span>
            <span>💬 {post.comments}</span>
            <span className="ml-auto">
              {new Date(post.postedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
