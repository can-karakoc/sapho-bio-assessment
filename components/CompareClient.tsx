'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Post, Influencer, GenerationConfig, GeneratedResponse } from '@/lib/types';

interface CompareClientProps {
  posts: Post[];
  influencers: Influencer[];
}

export default function CompareClient({ posts, influencers }: CompareClientProps) {
  const [selectedPostId, setSelectedPostId] = useState<string>(
    posts.length > 0 ? posts[0].id : ''
  );

  const [config, setConfig] = useState<GenerationConfig>({
    goal: 'engagement',
    brandVoice: 'professional-friendly',
    instructions: '',
  });

  const [geminiResponse, setGeminiResponse] = useState<GeneratedResponse | null>(null);
  const [groqResponse, setGroqResponse] = useState<GeneratedResponse | null>(null);
  const [isComparing, setIsComparing] = useState(false);

  const selectedPost = posts.find((p) => p.id === selectedPostId);
  const selectedInfluencer = selectedPost
    ? influencers.find((inf) => inf.id === selectedPost.influencerId)
    : undefined;

  const handleCompare = async () => {
    if (!selectedPost) return;

    setIsComparing(true);
    try {
      // Generate with Gemini
      const geminiRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: selectedPost.id,
          config,
        }),
      });
      const geminiData = await geminiRes.json();

      // Generate with Groq (by temporarily setting the provider)
      const groqRes = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-LLM-Provider': 'groq', // Custom header to override provider
        },
        body: JSON.stringify({
          postId: selectedPost.id,
          config,
        }),
      });
      const groqData = await groqRes.json();

      setGeminiResponse(geminiData);
      setGroqResponse(groqData);
    } catch (error) {
      console.error('Comparison failed:', error);
      alert('Failed to compare models');
    } finally {
      setIsComparing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded transition-colors"
          >
            ← Back to Inbox
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Model Comparison</h1>
            <p className="text-sm text-gray-600">
              Compare Gemini and Groq side-by-side for quality and speed
            </p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-6 max-w-7xl mx-auto">
        {/* Configuration Panel */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Comparison Configuration
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Post Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Post
              </label>
              <select
                value={selectedPostId}
                onChange={(e) => setSelectedPostId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              >
                {posts.map((post) => {
                  const inf = influencers.find((i) => i.id === post.influencerId);
                  return (
                    <option key={post.id} value={post.id}>
                      {inf?.name} - {post.text.slice(0, 60)}...
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Goal */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Goal</label>
              <select
                value={config.goal}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    goal: e.target.value as GenerationConfig['goal'],
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value="engagement">Engagement</option>
                <option value="leadgen">Lead Gen</option>
                <option value="thought-leadership">Thought Leadership</option>
              </select>
            </div>
          </div>

          {/* Brand Voice */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Brand Voice
            </label>
            <select
              value={config.brandVoice}
              onChange={(e) => setConfig({ ...config, brandVoice: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="professional-friendly">Professional & Friendly</option>
              <option value="authoritative">Authoritative Expert</option>
              <option value="collaborative">Collaborative Partner</option>
              <option value="educational">Educational & Helpful</option>
            </select>
          </div>

          {/* Additional Instructions */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Instructions
            </label>
            <textarea
              value={config.instructions}
              onChange={(e) => setConfig({ ...config, instructions: e.target.value })}
              placeholder="Optional additional instructions for both models"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              rows={2}
            />
          </div>

          <button
            onClick={handleCompare}
            disabled={isComparing}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isComparing ? 'Comparing Models...' : 'Run Comparison'}
          </button>
        </div>

        {/* Original Post Preview */}
        {selectedPost && selectedInfluencer && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Original Post</h3>
            <p className="text-sm text-gray-600 mb-2">
              {selectedInfluencer.name} @ {selectedInfluencer.company}
            </p>
            <p className="text-gray-800 whitespace-pre-wrap">{selectedPost.text}</p>
          </div>
        )}

        {/* Side-by-side Comparison */}
        {geminiResponse && groqResponse && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Gemini */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Gemini 2.0 Flash</h3>
                  {geminiResponse.needsReview && (
                    <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded">
                      ⚠️ Review
                    </span>
                  )}
                </div>

                <div className="mb-4">
                  <div className="flex gap-2 mb-2">
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                      {geminiResponse.latencyMs}ms
                    </span>
                    {geminiResponse.usedSources.map((source) => (
                      <span
                        key={source}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                      >
                        {source.replace('.md', '')}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded border border-gray-200 whitespace-pre-wrap">
                  {geminiResponse.text}
                </div>
              </div>

              {/* Groq */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Groq Llama 3.3 70B</h3>
                  {groqResponse.needsReview && (
                    <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded">
                      ⚠️ Review
                    </span>
                  )}
                </div>

                <div className="mb-4">
                  <div className="flex gap-2 mb-2">
                    <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded">
                      {groqResponse.latencyMs}ms
                    </span>
                    {groqResponse.usedSources.map((source) => (
                      <span
                        key={source}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                      >
                        {source.replace('.md', '')}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded border border-gray-200 whitespace-pre-wrap">
                  {groqResponse.text}
                </div>
              </div>
            </div>

            {/* Speed Comparison */}
            <div className="bg-white rounded-lg shadow p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Speed Comparison</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Gemini 2.0 Flash</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {geminiResponse.latencyMs}ms
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Groq Llama 3.3 70B</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {groqResponse.latencyMs}ms
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-600">
                  {geminiResponse.latencyMs < groqResponse.latencyMs ? (
                    <>
                      <strong>Gemini</strong> was{' '}
                      {((groqResponse.latencyMs / geminiResponse.latencyMs - 1) * 100).toFixed(0)}%
                      faster
                    </>
                  ) : (
                    <>
                      <strong>Groq</strong> was{' '}
                      {((geminiResponse.latencyMs / groqResponse.latencyMs - 1) * 100).toFixed(0)}%
                      faster
                    </>
                  )}
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
