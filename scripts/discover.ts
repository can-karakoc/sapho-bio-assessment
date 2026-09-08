#!/usr/bin/env tsx

/**
 * Discovery Script - Find influencers via keyword search
 *
 * This script uses the Apify LinkedIn post search actor to discover influencers
 * posting about compounding pharmacy topics. Results are ranked by post frequency
 * and engagement, then saved to discovery.json for validation.
 *
 * REQUIREMENTS:
 * - APIFY_TOKEN environment variable must be set
 *
 * USAGE:
 *   npm run discover
 */

import { ApifyClient } from 'apify-client';
import fs from 'fs/promises';
import path from 'path';

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
        keywords: [keyword],
        maxPostsCount: 50, // Adjust based on Apify plan limits
      });

      const { items } = await client.dataset(run.defaultDatasetId).listItems();

      console.log(`  Found ${items.length} posts\n`);

      // Aggregate by author
      for (const item of items) {
        const authorUrl = item.authorProfileUrl || item.author?.profileUrl;
        const authorName = item.authorName || item.author?.name;

        if (!authorUrl || !authorName) continue;

        if (!authorStats.has(authorUrl)) {
          authorStats.set(authorUrl, {
            name: authorName,
            linkedinUrl: authorUrl,
            postCount: 0,
            totalEngagement: 0,
            followerCount: item.author?.followerCount,
            keywords: new Set(),
          });
        }

        const stats = authorStats.get(authorUrl)!;
        stats.postCount++;
        stats.totalEngagement += (item.reactionCount || 0) + (item.commentCount || 0);
        stats.keywords.add(keyword);
      }
    } catch (error) {
      console.error(`  ✗ Failed to search "${keyword}":`, error);
      console.log('');
    }
  }

  // Convert to array and sort by engagement
  const discovered = Array.from(authorStats.values())
    .map((stats) => ({
      name: stats.name,
      linkedinUrl: stats.linkedinUrl,
      postFrequency: stats.postCount,
      totalEngagement: stats.totalEngagement,
      followerCount: stats.followerCount,
      discoveredKeywords: Array.from(stats.keywords),
    }))
    .sort((a, b) => b.totalEngagement - a.totalEngagement);

  // Save results
  const discoveryPath = path.join(DATA_DIR, 'discovery.json');
  await fs.writeFile(discoveryPath, JSON.stringify(discovered, null, 2));

  console.log(`\n✅ Discovery complete!`);
  console.log(`   Found ${discovered.length} unique influencers`);
  console.log(`   Saved to ${discoveryPath}`);
  console.log(`\n📊 Top 5 by engagement:`);

  discovered.slice(0, 5).forEach((inf, idx) => {
    console.log(
      `   ${idx + 1}. ${inf.name} - ${inf.totalEngagement} engagement (${inf.postFrequency} posts)`
    );
  });

  console.log('\n🔗 View validation at /validation\n');
}

main().catch((error) => {
  console.error('❌ Discovery failed:', error);
  process.exit(1);
});
