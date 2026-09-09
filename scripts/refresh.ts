#!/usr/bin/env tsx

/**
 * Refresh Script - Scrape fresh LinkedIn posts using Apify
 *
 * This script calls the Apify actors to regenerate posts.json and derive
 * engagement signals (postsPerMonth, avgEngagement, recentEngagement) that
 * are merged back into influencers.json WITHOUT overwriting manual fields.
 *
 * REQUIREMENTS:
 * - APIFY_TOKEN environment variable must be set
 * - Apify account with access to harvestapi/linkedin-profile-posts
 *
 * USAGE:
 *   npm run refresh
 */

import dotenv from 'dotenv';
import { ApifyClient } from 'apify-client';
import fs from 'fs/promises';
import path from 'path';
import type { Influencer, Post } from '../lib/types';
import { scoreInfluencer } from '../lib/score';

// Load .env.local for environment variables
dotenv.config({ path: '.env.local' });

const APIFY_TOKEN = process.env.APIFY_TOKEN;
const DATA_DIR = path.join(process.cwd(), 'data');

async function main() {
  if (!APIFY_TOKEN) {
    console.log('⚠️  APIFY_TOKEN not set - script will not run');
    console.log('');
    console.log('To enable live scraping:');
    console.log('1. Sign up at https://apify.com');
    console.log('2. Get your API token from Account > Integrations > API tokens');
    console.log('3. Set APIFY_TOKEN in your .env.local file');
    console.log('');
    console.log('The app works fine without this - seed data is already in place.');
    process.exit(0);
  }

  const client = new ApifyClient({ token: APIFY_TOKEN });

  console.log('🚀 Starting LinkedIn post refresh...\n');

  // Load current influencers
  const influencersPath = path.join(DATA_DIR, 'influencers.json');
  const influencersData = await fs.readFile(influencersPath, 'utf-8');
  const influencers: Influencer[] = JSON.parse(influencersData);

  console.log(`📋 Loaded ${influencers.length} influencers\n`);

  const allPosts: Post[] = [];
  const influencerSignals = new Map<string, {
    posts: Post[];
    totalEngagement: number;
    postedDates: Date[];
  }>();

  // Scrape posts for each influencer
  for (const influencer of influencers) {
    console.log(`Scraping posts for ${influencer.name}...`);

    try {
      const run = await client.actor('harvestapi/linkedin-profile-posts').call({
        targetUrls: [influencer.linkedinUrl],
        // No maxPosts limit - get all posts in last 3 months
        postedLimit: '3months',
      });

      const { items } = await client.dataset(run.defaultDatasetId).listItems();

      // Log output keys on first item (defensive mapping)
      if (items.length > 0) {
        console.log(`  [DEBUG] First item keys: ${Object.keys(items[0]).join(', ')}`);
        console.log(`  [DEBUG] Sample engagement data:`);
        console.log(`    - reactionIds: ${Array.isArray(items[0].reactionIds) ? `array[${items[0].reactionIds.length}]` : typeof items[0].reactionIds}`);
        console.log(`    - commentIds: ${Array.isArray(items[0].commentIds) ? `array[${items[0].commentIds.length}]` : typeof items[0].commentIds}`);
        console.log(`    - engagement: ${JSON.stringify(items[0].engagement)}`);
      }

      const posts: Post[] = items.map((item: any, idx: number) => {
        // Defensive field mapping
        const text = item.text ?? item.content ?? item.postText ?? '';
        const url = item.url ?? item.postUrl ?? item.linkedinUrl ?? influencer.linkedinUrl;

        // Handle postedAt (could be string or object with .date)
        let postedAt: string;
        if (typeof item.postedAt === 'string') {
          postedAt = item.postedAt;
        } else if (item.postedAt?.date) {
          postedAt = item.postedAt.date;
        } else {
          postedAt = item.postedDate ?? item.date ?? new Date().toISOString();
        }

        // Extract reactions - engagement.likes is the correct field
        let reactions = 0;
        if (typeof item.engagement?.likes === 'number') {
          reactions = item.engagement.likes;
        } else if (Array.isArray(item.reactionIds) && item.reactionIds.length > 0) {
          reactions = item.reactionIds.length;
        } else if (typeof item.reactions === 'number') {
          reactions = item.reactions;
        } else if (typeof item.reactionCount === 'number') {
          reactions = item.reactionCount;
        } else if (typeof item.likes === 'number') {
          reactions = item.likes;
        }

        // Extract comments - engagement.comments is the correct field
        let comments = 0;
        if (typeof item.engagement?.comments === 'number') {
          comments = item.engagement.comments;
        } else if (Array.isArray(item.commentIds) && item.commentIds.length > 0) {
          comments = item.commentIds.length;
        } else if (typeof item.comments === 'number') {
          comments = item.comments;
        } else if (typeof item.commentCount === 'number') {
          comments = item.commentCount;
        }

        return {
          id: `post-${Date.now()}-${influencer.id}-${idx}`,
          influencerId: influencer.id,
          text,
          url,
          postedAt,
          reactions,
          comments,
          status: 'new' as const,
        };
      });

      allPosts.push(...posts);

      // Track for signal derivation
      if (posts.length > 0) {
        const totalEngagement = posts.reduce((sum, p) => sum + p.reactions + p.comments, 0);
        const postedDates = posts.map(p => new Date(p.postedAt));

        influencerSignals.set(influencer.id, {
          posts,
          totalEngagement,
          postedDates,
        });
      }

      console.log(`  ✓ Found ${posts.length} posts\n`);
    } catch (error) {
      console.error(`  ✗ Failed to scrape ${influencer.name}:`, error);
      console.log('');
    }
  }

  // Derive signals from scraped posts and merge into influencers
  for (const influencer of influencers) {
    const data = influencerSignals.get(influencer.id);
    if (!data) continue;

    const { posts, totalEngagement, postedDates } = data;

    // Calculate avgEngagement
    const avgEngagement = posts.length > 0
      ? Math.round(totalEngagement / posts.length)
      : undefined;

    // Calculate recentEngagement (newest first)
    const recentEngagement = posts
      .map(p => p.reactions + p.comments)
      .reverse(); // Reverse to get newest first

    // Calculate postsPerMonth from date span
    let postsPerMonth: number | undefined;
    if (postedDates.length > 1) {
      const sortedDates = postedDates.sort((a, b) => a.getTime() - b.getTime());
      const earliest = sortedDates[0];
      const latest = sortedDates[sortedDates.length - 1];
      const monthsSpanned = Math.max(
        1,
        (latest.getTime() - earliest.getTime()) / (1000 * 60 * 60 * 24 * 30)
      );
      postsPerMonth = Math.round((posts.length / monthsSpanned) * 10) / 10; // Round to 1 decimal
    }

    // Merge signals WITHOUT overwriting manual fields
    if (!influencer.signals) {
      influencer.signals = {};
    }

    // Only update derived fields (preserve followers, relevance)
    if (avgEngagement !== undefined) {
      influencer.signals.avgEngagement = avgEngagement;
    }
    if (recentEngagement.length > 0) {
      influencer.signals.recentEngagement = recentEngagement;
    }
    if (postsPerMonth !== undefined) {
      influencer.signals.postsPerMonth = postsPerMonth;
    }

    // Calculate and store composite score + subscores
    const scoringResult = scoreInfluencer(influencer.signals);
    if (scoringResult) {
      influencer.score = scoringResult.score;
      influencer.subscores = scoringResult.subscores;
    }
  }

  // Save posts
  const postsPath = path.join(DATA_DIR, 'posts.json');
  await fs.writeFile(postsPath, JSON.stringify(allPosts, null, 2));

  // Save updated influencers (with derived signals)
  await fs.writeFile(influencersPath, JSON.stringify(influencers, null, 2));

  console.log(`\n✅ Refresh complete!`);
  console.log(`   Scraped ${allPosts.length} posts from ${influencers.length} influencers`);
  console.log(`   Saved to ${postsPath}`);
  console.log(`   Updated signals in ${influencersPath}\n`);
}

main().catch((error) => {
  console.error('❌ Refresh failed:', error);
  process.exit(1);
});
