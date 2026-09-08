'use client';

import { useState } from 'react';
import type { Post, Influencer, GenerationConfig, GeneratedResponse } from '@/lib/types';

interface PostDetailPaneProps {
  post: Post;
  influencer: Influencer | undefined;
}

export default function PostDetailPane({ post, influencer }: PostDetailPaneProps) {
  const [config, setConfig] = useState<GenerationConfig>({
    goal: 'engagement',
    brandVoice: 'professional-friendly',
    instructions: '',
  });

  const [response, setResponse] = useState<GeneratedResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editedText, setEditedText] = useState('');

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id, config }),
      });

      const data = await res.json();
      setResponse(data);
      setEditedText(data.text);
    } catch (error) {
      console.error('Generation failed:', error);
      alert('Failed to generate response');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(editedText);
    await logAction('copied');
    alert('Copied to clipboard!');
  };

  const handlePost = async () => {
    await navigator.clipboard.writeText(editedText);
    await logAction('posted');
    window.open(post.url, '_blank');
    alert('Text copied! Opening post in new tab...');
  };

  const handleSkip = async () => {
    await logAction('skipped');
    alert('Post skipped');
  };

  const logAction = async (action: string) => {
    await fetch('/api/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        postId: post.id,
        action,
        outputText: editedText,
      }),
    });
  };

  return (
    <div className="flex-1 flex flex-col bg-white overflow-y-auto">
      {/* Header */}
      <div className="p-6 border-b bg-gray-50">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex-shrink-0 flex items-center justify-center text-white font-semibold text-lg">
            {influencer?.name.charAt(0) || '?'}
          </div>
          <div>
            <h2 className="font-bold text-lg">{influencer?.name || 'Unknown'}</h2>
            <p className="text-sm text-gray-600">
              {influencer?.title} @ {influencer?.company}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {influencer?.followerCount.toLocaleString()} followers
            </p>
          </div>
        </div>
      </div>

      {/* Original Post */}
      <div className="p-6 border-b">
        <h3 className="font-semibold text-sm text-gray-700 mb-2">Original Post</h3>
        <p className="text-gray-800 whitespace-pre-wrap">{post.text}</p>
        <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
          <span>👍 {post.reactions}</span>
          <span>💬 {post.comments}</span>
          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-blue-600 hover:underline"
          >
            View on LinkedIn →
          </a>
        </div>
      </div>

      {/* Config Panel */}
      <div className="p-6 border-b bg-gray-50">
        <h3 className="font-semibold text-sm text-gray-700 mb-3">Response Configuration</h3>

        <div className="space-y-4">
          {/* Goal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Goal
            </label>
            <div className="flex gap-2">
              {(['engagement', 'leadgen', 'thought-leadership'] as const).map((goal) => (
                <button
                  key={goal}
                  onClick={() => setConfig({ ...config, goal })}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    config.goal === goal
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {goal === 'leadgen' ? 'Lead Gen' : goal.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Brand Voice */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Brand Voice
            </label>
            <select
              value={config.brandVoice}
              onChange={(e) => setConfig({ ...config, brandVoice: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="professional-friendly">Professional & Friendly</option>
              <option value="authoritative">Authoritative Expert</option>
              <option value="collaborative">Collaborative Partner</option>
              <option value="educational">Educational & Helpful</option>
            </select>
          </div>

          {/* Additional Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Instructions
            </label>
            <textarea
              value={config.instructions}
              onChange={(e) => setConfig({ ...config, instructions: e.target.value })}
              placeholder="e.g., Mention our new whitepaper, ask a follow-up question, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
            />
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? 'Generating...' : response ? 'Regenerate Response' : 'Generate Response'}
          </button>
        </div>
      </div>

      {/* Generated Response */}
      {response && (
        <div className="p-6 flex-1">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm text-gray-700">Generated Response</h3>
            {response.needsReview && (
              <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded">
                ⚠️ Needs Review
              </span>
            )}
          </div>

          {/* Metadata */}
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
              {response.model}
            </span>
            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
              {response.provider}
            </span>
            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
              {response.latencyMs}ms
            </span>
          </div>

          {/* Sources */}
          {response.usedSources.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-gray-600 mb-1">Grounded on:</p>
              <div className="flex flex-wrap gap-1">
                {response.usedSources.map((source) => (
                  <span
                    key={source}
                    className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded"
                  >
                    {source.replace('.md', '')}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Editable Response */}
          <textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-sans"
            rows={8}
          />

          {/* Actions */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={handlePost}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded font-medium hover:bg-green-700 transition-colors"
            >
              📋 Copy & Open Post
            </button>
            <button
              onClick={handleCopy}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded font-medium hover:bg-gray-300 transition-colors"
            >
              Copy
            </button>
            <button
              onClick={handleSkip}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded font-medium hover:bg-gray-300 transition-colors"
            >
              Skip
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
