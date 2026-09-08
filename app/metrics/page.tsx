'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Event } from '@/lib/types';

export default function MetricsPage() {
  const [events] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, this would fetch from the API
    // For now, we'll show placeholder metrics
    setLoading(false);
  }, []);

  // Calculate metrics from events
  const totalGenerations = events.filter((e) =>
    ['generated', 'regenerated'].includes(e.action)
  ).length;

  const totalPosted = events.filter((e) => e.action === 'posted').length;
  const totalSkipped = events.filter((e) => e.action === 'skipped').length;

  const acceptanceRate =
    totalGenerations > 0 ? (totalPosted / totalGenerations) * 100 : 0;

  // Group by goal
  const byGoal = events.reduce((acc, e) => {
    if (e.config?.goal) {
      if (!acc[e.config.goal]) {
        acc[e.config.goal] = { generated: 0, posted: 0 };
      }
      if (e.action === 'generated' || e.action === 'regenerated') {
        acc[e.config.goal].generated++;
      } else if (e.action === 'posted') {
        acc[e.config.goal].posted++;
      }
    }
    return acc;
  }, {} as Record<string, { generated: number; posted: number }>);

  // Average latency by provider
  const avgLatencyByProvider = events
    .filter((e) => e.latencyMs && e.provider)
    .reduce((acc, e) => {
      if (!acc[e.provider!]) {
        acc[e.provider!] = { total: 0, count: 0 };
      }
      acc[e.provider!].total += e.latencyMs!;
      acc[e.provider!].count++;
      return acc;
    }, {} as Record<string, { total: number; count: number }>);

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
            <h1 className="text-2xl font-bold text-gray-900">Metrics Dashboard</h1>
            <p className="text-sm text-gray-600">Measure engagement performance and model quality</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-6 max-w-7xl mx-auto">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading metrics...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 mb-2">No data yet</p>
            <p className="text-sm text-gray-500">
              Start generating responses to see metrics here
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600 mb-1">Total Generations</p>
                <p className="text-3xl font-bold text-gray-900">{totalGenerations}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600 mb-1">Posted</p>
                <p className="text-3xl font-bold text-green-600">{totalPosted}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600 mb-1">Skipped</p>
                <p className="text-3xl font-bold text-gray-600">{totalSkipped}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600 mb-1">Acceptance Rate</p>
                <p className="text-3xl font-bold text-blue-600">
                  {acceptanceRate.toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Performance by Goal */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Performance by Goal
              </h2>
              <div className="space-y-3">
                {Object.entries(byGoal).map(([goal, stats]) => (
                  <div key={goal} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700 capitalize">
                        {goal.replace('-', ' ')}
                      </p>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${(stats.posted / stats.generated) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="ml-4 text-right">
                      <p className="text-sm text-gray-600">
                        {stats.posted} / {stats.generated}
                      </p>
                      <p className="text-xs text-gray-500">
                        {((stats.posted / stats.generated) * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Average Latency by Provider */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Average Latency by Provider
              </h2>
              <div className="space-y-3">
                {Object.entries(avgLatencyByProvider).map(([provider, stats]) => (
                  <div key={provider} className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-700 capitalize">
                      {provider}
                    </p>
                    <p className="text-lg font-semibold text-gray-900">
                      {(stats.total / stats.count).toFixed(0)}ms
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
