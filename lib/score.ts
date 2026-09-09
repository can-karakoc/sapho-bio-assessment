import type { InfluencerSignals, InfluencerSubScores } from './types';

/**
 * Influencer Scoring Algorithm
 *
 * Computes a composite score (0-100) and five subscores from influencer signals.
 * Used by both the UI and scripts/discover.ts for consistent, auditable ranking.
 *
 * FORMULA:
 * - Each subscore is normalized to 0-100 based on signal data
 * - Composite = weighted sum of subscores
 * - Default weights: reach .20, cadence .15, resonance .25, relevance .25, recency .15
 *
 * SUBSCORES:
 * - Reach: follower count (normalized by log scale, capped at 100K followers = 100)
 * - Cadence: posts per month (linear 0-20 posts/month -> 0-100)
 * - Resonance: avg engagement per post (linear 0-500 -> 0-100)
 * - Relevance: manual relevance score (already 0-100)
 * - Recency: avg engagement of last 3 posts vs overall avg (ratio 0-2x -> 0-100)
 *
 * Returns { score: 0-100, subscores: {...} } or null if insufficient data.
 */

interface ScoringWeights {
  reach: number;
  cadence: number;
  resonance: number;
  relevance: number;
  recency: number;
}

const DEFAULT_WEIGHTS: ScoringWeights = {
  reach: 0.20,
  cadence: 0.15,
  resonance: 0.25,
  relevance: 0.25,
  recency: 0.15,
};

// Normalization thresholds (tunable)
const REACH_MAX_FOLLOWERS = 100000; // 100K followers = 100 score
const CADENCE_MAX_POSTS_PER_MONTH = 20;
const RESONANCE_MAX_ENGAGEMENT = 500;
const RECENCY_WINDOW = 3; // last N posts

export interface ScoringResult {
  score: number;
  subscores: InfluencerSubScores;
}

/**
 * Score an influencer from their signals
 * Returns null if insufficient data (missing critical signals)
 */
export function scoreInfluencer(
  signals?: InfluencerSignals,
  weights: ScoringWeights = DEFAULT_WEIGHTS
): ScoringResult | null {
  if (!signals) return null;

  // Calculate subscores (each 0-100)
  const reach = calculateReachScore(signals.followers);
  const cadence = calculateCadenceScore(signals.postsPerMonth);
  const resonance = calculateResonanceScore(signals.avgEngagement);
  const relevance = signals.relevance ?? 0; // already 0-100
  const recency = calculateRecencyScore(
    signals.recentEngagement,
    signals.avgEngagement
  );

  // At least reach OR cadence OR resonance must be present
  if (reach === null && cadence === null && resonance === null) {
    return null;
  }

  // Compute composite score (weighted average of available subscores)
  // Missing subscores count as 0
  const subscores: InfluencerSubScores = {
    reach: reach ?? 0,
    cadence: cadence ?? 0,
    resonance: resonance ?? 0,
    relevance,
    recency: recency ?? 0,
  };

  const score =
    subscores.reach * weights.reach +
    subscores.cadence * weights.cadence +
    subscores.resonance * weights.resonance +
    subscores.relevance * weights.relevance +
    subscores.recency * weights.recency;

  return {
    score: Math.round(score * 10) / 10, // round to 1 decimal
    subscores,
  };
}

/**
 * Reach: follower count on log scale
 * 0 followers = 0, 100K+ followers = 100
 */
function calculateReachScore(followers?: number): number | null {
  if (followers === undefined || followers === null) return null;

  // Log scale: score = 100 * log(followers + 1) / log(MAX + 1)
  const maxLog = Math.log(REACH_MAX_FOLLOWERS + 1);
  const score = (100 * Math.log(followers + 1)) / maxLog;

  return Math.min(100, Math.round(score));
}

/**
 * Cadence: posts per month (linear)
 * 0 posts/month = 0, 20+ posts/month = 100
 */
function calculateCadenceScore(postsPerMonth?: number): number | null {
  if (postsPerMonth === undefined || postsPerMonth === null) return null;

  const score = (postsPerMonth / CADENCE_MAX_POSTS_PER_MONTH) * 100;
  return Math.min(100, Math.round(score));
}

/**
 * Resonance: average engagement per post (linear)
 * 0 engagement = 0, 500+ = 100
 */
function calculateResonanceScore(avgEngagement?: number): number | null {
  if (avgEngagement === undefined || avgEngagement === null) return null;

  const score = (avgEngagement / RESONANCE_MAX_ENGAGEMENT) * 100;
  return Math.min(100, Math.round(score));
}

/**
 * Recency: recent posts vs overall average
 * If recent engagement is 2x overall avg = 100
 * If recent = overall avg = 50
 * If recent = 0 = 0
 */
function calculateRecencyScore(
  recentEngagement?: number[],
  avgEngagement?: number
): number | null {
  if (
    !recentEngagement ||
    recentEngagement.length === 0 ||
    avgEngagement === undefined ||
    avgEngagement === null
  ) {
    return null;
  }

  // Take last N posts
  const recent = recentEngagement.slice(-RECENCY_WINDOW);
  const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;

  if (avgEngagement === 0) return 0;

  // Ratio: recent / overall (0-2x maps to 0-100)
  const ratio = recentAvg / avgEngagement;
  const score = Math.min(2, ratio) * 50; // 0-2 -> 0-100

  return Math.round(score);
}
