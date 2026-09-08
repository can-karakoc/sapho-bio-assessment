#!/usr/bin/env tsx

/**
 * Refresh Script - Scrape fresh LinkedIn posts using Apify
 *
 * This script calls the Apify actors to regenerate influencers.json and posts.json
 * with live data from LinkedIn.
 *
 * REQUIREMENTS:
 * - APIFY_TOKEN environment variable must be set
 * - Apify account with access to the harvestapi actors
 *
 * USAGE:
 *   npm run refresh
 */

import { ApifyClient } from 'apify-client';
import fs from 'fs/promises';
import path from 'path';

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

  // Load current influencers as starting point
  const influencersPath = path.join(DATA_DIR, 'influencers.json');
  const influencersData = await fs.readFile(influencersPath, 'utf-8');
  const influencers = JSON.parse(influencersData);

  console.log(`📋 Loaded ${influencers.length} influencers\n`);

  // Scrape posts for each influencer
  const allPosts: any[] = [];

  for (const influencer of influencers) {
    console.log(`Scraping posts for ${influencer.name}...`);

    try {
      const run = await client.actor('harvestapi/linkedin-profile-posts').call({
        profileUrls: [influencer.linkedinUrl],
        maxPostCount: 5,
      });

      const { items } = await client.dataset(run.defaultDatasetId).listItems();

      const posts = items.map((item: any, idx: number) => ({
        id: `post-${Date.now()}-${idx}`,
        influencerId: influencer.id,
        text: item.text || '',
        url: item.url || influencer.linkedinUrl,
        postedAt: item.postedDate || new Date().toISOString(),
        reactions: item.reactionCount || 0,
        comments: item.commentCount || 0,
        status: 'new',
      }));

      allPosts.push(...posts);
      console.log(`  ✓ Found ${posts.length} posts\n`);
    } catch (error) {
      console.error(`  ✗ Failed to scrape ${influencer.name}:`, error);
      console.log('');
    }
  }

  // Save posts
  const postsPath = path.join(DATA_DIR, 'posts.json');
  await fs.writeFile(postsPath, JSON.stringify(allPosts, null, 2));

  console.log(`\n✅ Refresh complete!`);
  console.log(`   Scraped ${allPosts.length} posts from ${influencers.length} influencers`);
  console.log(`   Saved to ${postsPath}\n`);
}

main().catch((error) => {
  console.error('❌ Refresh failed:', error);
  process.exit(1);
});
