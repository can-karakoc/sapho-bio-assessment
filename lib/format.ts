/**
 * Formatting utilities
 */

/**
 * Format relative date (e.g., "3d", "14d", "2mo")
 */
export function formatRelativeDate(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "today";
  if (diffDays === 1) return "1d";
  if (diffDays < 30) return `${diffDays}d`;

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths}mo`;

  const diffYears = Math.floor(diffMonths / 12);
  return `${diffYears}y`;
}

/**
 * Format number with k/M suffix (e.g., "41.2k", "1.5M")
 */
export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return "—";

  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k`;
  }
  return num.toString();
}

/**
 * Format posts per month (e.g., "12/mo", "5.5/mo")
 */
export function formatPostsPerMonth(ppm: number | null | undefined): string {
  if (ppm === null || ppm === undefined) return "—";
  return `${ppm}/mo`;
}

/**
 * Format engagement number (e.g., "~170")
 */
export function formatEngagement(eng: number | null | undefined): string {
  if (eng === null || eng === undefined) return "—";
  return `~${eng}`;
}

/**
 * Format relevance percentage (e.g., "96%")
 */
export function formatRelevance(rel: number | null | undefined): string {
  if (rel === null || rel === undefined) return "—";
  return `${rel}%`;
}
