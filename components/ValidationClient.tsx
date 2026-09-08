'use client';

import Link from 'next/link';
import type { Influencer, DiscoveredInfluencer } from '@/lib/types';

interface ValidationClientProps {
  curated: Influencer[];
  discovered: DiscoveredInfluencer[];
}

export default function ValidationClient({ curated, discovered }: ValidationClientProps) {
  // Match curated influencers with discovered ones
  const curatedUrls = new Set(curated.map((inf) => inf.linkedinUrl));
  const discoveredUrls = new Set(discovered.map((inf) => inf.linkedinUrl));

  const overlap = curated.filter((inf) => discoveredUrls.has(inf.linkedinUrl));
  const gaps = discovered.filter(
    (inf) => !curatedUrls.has(inf.linkedinUrl) && inf.totalEngagement > 500
  ); // High engagement threshold
  const manualOnly = curated.filter((inf) => !discoveredUrls.has(inf.linkedinUrl));

  const coverageRate =
    curated.length > 0 ? (overlap.length / curated.length) * 100 : 0;

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
            <h1 className="text-2xl font-bold text-gray-900">Influencer Validation</h1>
            <p className="text-sm text-gray-600">
              Compare curated influencer list with discovery results
            </p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-6 max-w-7xl mx-auto">
        {discovered.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 mb-2">No discovery data available</p>
            <p className="text-sm text-gray-500 mb-4">
              Run the discovery script to analyze keyword-based influencer discovery
            </p>
            <code className="bg-gray-100 px-3 py-2 rounded text-sm">
              npm run discover
            </code>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Coverage Metric */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Discovery Coverage
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Percentage of curated influencers confirmed by discovery algorithm
              </p>
              <div className="flex items-end gap-4">
                <p className="text-5xl font-bold text-blue-600">
                  {coverageRate.toFixed(0)}%
                </p>
                <p className="text-gray-600 mb-2">
                  {overlap.length} of {curated.length} confirmed
                </p>
              </div>
            </div>

            {/* Overlap */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                ✓ Overlap ({overlap.length})
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Influencers in both curated list and discovery results
              </p>
              <div className="space-y-2">
                {overlap.length === 0 ? (
                  <p className="text-sm text-gray-500">No overlapping influencers found</p>
                ) : (
                  overlap.map((inf) => (
                    <div
                      key={inf.id}
                      className="flex items-center justify-between p-3 bg-green-50 rounded border border-green-200"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{inf.name}</p>
                        <p className="text-sm text-gray-600">
                          {inf.title} @ {inf.company}
                        </p>
                      </div>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                        ✓ Confirmed
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Gaps */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                → Gaps ({gaps.length})
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                High-engagement influencers discovered but not in curated list
              </p>
              <div className="space-y-2">
                {gaps.length === 0 ? (
                  <p className="text-sm text-gray-500">No gaps found</p>
                ) : (
                  gaps.slice(0, 10).map((inf) => (
                    <div
                      key={inf.linkedinUrl}
                      className="flex items-center justify-between p-3 bg-amber-50 rounded border border-amber-200"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{inf.name}</p>
                        <p className="text-sm text-gray-600">
                          {inf.totalEngagement.toLocaleString()} total engagement
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Keywords: {inf.discoveredKeywords.join(', ')}
                        </p>
                      </div>
                      <a
                        href={inf.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-4 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                      >
                        Review →
                      </a>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Manual Only */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                ✍️ Manual Only ({manualOnly.length})
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Curated influencers not found by discovery (may use different keywords or be less
                active)
              </p>
              <div className="space-y-2">
                {manualOnly.length === 0 ? (
                  <p className="text-sm text-gray-500">All curated influencers were discovered</p>
                ) : (
                  manualOnly.map((inf) => (
                    <div
                      key={inf.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{inf.name}</p>
                        <p className="text-sm text-gray-600">
                          {inf.title} @ {inf.company}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Rationale: {inf.selectionRationale}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
