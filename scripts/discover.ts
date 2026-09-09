#!/usr/bin/env tsx

/**
 * Discovery Script - Find influencers via keyword search
 *
 * This script uses the Apify LinkedIn post search actor to discover influencers
 * posting about compounding pharmacy topics. Results are aggregated by author,
 * scored via lib/score.ts, and saved to discovery.json for validation.
 *
 * REQUIREMENTS:
 * - APIFY_TOKEN environment variable must be set
 * - Apify account with access to harvestapi/linkedin-post-search
 *
 * USAGE:
 *   npm run discover
 */

import dotenv from 'dotenv';
import { ApifyClient } from 'apify-client';
import fs from 'fs/promises';
import path from 'path';
import { scoreInfluencer } from '../lib/score';
import type { DiscoveredInfluencer, InfluencerSignals } from '../lib/types';

// Load .env.local for environment variables
dotenv.config({ path: '.env.local' });

const APIFY_TOKEN = process.env.APIFY_TOKEN;
const DATA_DIR = path.join(process.cwd(), 'data');

// Keywords to search for
const KEYWORDS = [
  'compounding pharmacy',
  '503B',
  'sterile compounding',
  'USP 797',
  'USP 800',
  'pharmaceutical compounding',
];

// Quality filters
const CREDENTIALED_ONLY = process.env.CREDENTIALED_ONLY === 'true'; // Set via env var
const CREDENTIAL_PATTERN = /PharmD|Pharm\.?\s?D|RPh|BCSCP|CPhT|FAPC|FACA/;

// Helper: Clean LinkedIn URL (strip query strings)
function cleanLinkedInUrl(url: string): string {
  return url.split('?')[0];
}

// Helper: Check if author is credentialed
function isCredentialed(name: string): boolean {
  return CREDENTIAL_PATTERN.test(name);
}

async function main() {
  if (!APIFY_TOKEN) {
    console.log('⚠️  APIFY_TOKEN not set - script will not run');
    console.log('');
    console.log('To enable influencer discovery:');
    console.log('1. Sign up at https://apify.com');
    console.log('2. Get your API token from Account > Integrations > API tokens');
    console.log('3. Set APIFY_TOKEN in your .env.local file');
    console.log('');
    console.log('The validation page works without this using the curated list only.');
    process.exit(0);
  }

  const client = new ApifyClient({ token: APIFY_TOKEN });

  console.log('🔍 Starting influencer discovery...\n');
  console.log(`Keywords: ${KEYWORDS.join(', ')}\n`);

  const authorStats = new Map<
    string,
    {
      name: string;
      linkedinUrl: string;
      postCount: number;
      totalEngagement: number;
      followerCount?: number;
      keywords: Set<string>;
    }
  >();

  for (const keyword of KEYWORDS) {
    console.log(`Searching for "${keyword}"...`);

    try {
      const run = await client.actor('harvestapi/linkedin-post-search').call({
        searchQueries: [keyword],
        maxPosts: 150,
        sortBy: 'relevance',
      });

      const { items } = await client.dataset(run.defaultDatasetId).listItems();

      // Log output keys on first item (defensive mapping)
      if (items.length > 0) {
        console.log(`  [DEBUG] First item keys: ${Object.keys(items[0]).join(', ')}`);
      }

      console.log(`  Found ${items.length} posts\n`);

      // Aggregate by author with defensive field mapping
      for (const item of items) {
        const authorName = item.author?.name;
        const authorUrl = item.author?.linkedinUrl;
        const followerCount = item.author?.followerCount; // Usually absent

        // Extract engagement counts (handle both number and array formats)
        let reactions = 0;
        let comments = 0;

        if (typeof item.engagement?.reactions === 'number') {
          reactions = item.engagement.reactions;
        } else if (Array.isArray(item.reactions)) {
          reactions = item.reactions.length;
        } else if (typeof item.reactions === 'number') {
          reactions = item.reactions;
        }

        if (typeof item.engagement?.comments === 'number') {
          comments = item.engagement.comments;
        } else if (Array.isArray(item.comments)) {
          comments = item.comments.length;
        } else if (typeof item.comments === 'number') {
          comments = item.comments;
        }

        if (!authorUrl || !authorName) continue;

        // Exclude non-person authors (company pages)
        if (authorUrl.includes('/company/')) continue;

        // Optional: Filter by credentials
        if (CREDENTIALED_ONLY && !isCredentialed(authorName)) continue;

        // Clean URL (strip query strings)
        const cleanedUrl = cleanLinkedInUrl(authorUrl);

        if (!authorStats.has(cleanedUrl)) {
          authorStats.set(cleanedUrl, {
            name: authorName,
            linkedinUrl: cleanedUrl,
            postCount: 0,
            totalEngagement: 0,
            followerCount,
            keywords: new Set(),
          });
        }

        const stats = authorStats.get(cleanedUrl)!;
        stats.postCount++;
        stats.totalEngagement += reactions + comments;
        stats.keywords.add(keyword);
      }
    } catch (error) {
      console.error(`  ✗ Failed to search "${keyword}":`, error);
      console.log('');
    }
  }

  console.log(`\n📊 Scoring ${authorStats.size} discovered influencers...\n`);

  // Build signals and score each candidate
  const discovered: DiscoveredInfluencer[] = Array.from(authorStats.values())
    .map((stats) => {
      // Build signals object
      const signals: InfluencerSignals = {
        followers: stats.followerCount,
        postsPerMonth: stats.postCount, // Rough estimate: postCount in search window
        avgEngagement: stats.postCount > 0
          ? Math.round(stats.totalEngagement / stats.postCount)
          : undefined,
        // Scale relevance from keyword match count (0-6 keywords → 0-100)
        relevance: Math.min(100, (stats.keywords.size / KEYWORDS.length) * 100),
      };

      // Score this candidate
      const scoringResult = scoreInfluencer(signals);

      return {
        name: stats.name,
        linkedinUrl: stats.linkedinUrl,
        postFrequency: stats.postCount,
        totalEngagement: stats.totalEngagement,
        followerCount: stats.followerCount,
        discoveredKeywords: Array.from(stats.keywords),
        score: scoringResult?.score,
        subscores: scoringResult?.subscores,
      };
    })
    // Rank by score (highest first), break ties by relevance then postFrequency
    .sort((a, b) => {
      // Handle nulls
      if (a.score === undefined) return 1;
      if (b.score === undefined) return -1;

      // Primary: score (descending)
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      // Tie-breaker 1: relevance (descending)
      const aRelevance = (a.discoveredKeywords.length / KEYWORDS.length) * 100;
      const bRelevance = (b.discoveredKeywords.length / KEYWORDS.length) * 100;
      if (bRelevance !== aRelevance) {
        return bRelevance - aRelevance;
      }

      // Tie-breaker 2: postFrequency (descending)
      return b.postFrequency - a.postFrequency;
    });

  // Save results
  const discoveryPath = path.join(DATA_DIR, 'discovery.json');
  await fs.writeFile(discoveryPath, JSON.stringify(discovered, null, 2));

  console.log(`\n✅ Discovery complete!`);
  console.log(`   Found ${discovered.length} unique influencers`);
  console.log(`   Saved to ${discoveryPath}`);
  console.log(`\n📊 Top 5 by score:`);

  discovered.slice(0, 5).forEach((inf, idx) => {
    const scoreStr = inf.score !== undefined ? inf.score.toFixed(1) : '—';
    console.log(
      `   ${idx + 1}. ${inf.name} - Score: ${scoreStr} (${inf.totalEngagement} engagement, ${inf.postFrequency} posts)`
    );
  });

  console.log('\n🔗 View validation at /validation\n');
}

main().catch((error) => {
  console.error('❌ Discovery failed:', error);
  process.exit(1);
});
