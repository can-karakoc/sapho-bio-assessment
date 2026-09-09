#!/usr/bin/env tsx

/**
 * Test Engagement Extraction
 * Quick test to debug why engagement is always 0
 */

import dotenv from 'dotenv';
import { ApifyClient } from 'apify-client';

dotenv.config({ path: '.env.local' });

const APIFY_TOKEN = process.env.APIFY_TOKEN;

async function main() {
  if (!APIFY_TOKEN) {
    console.log('⚠️  APIFY_TOKEN not set');
    process.exit(1);
  }

  const client = new ApifyClient({ token: APIFY_TOKEN });

  console.log('🔍 Testing engagement extraction on Will Douglas (5,012 followers)...\n');

  const run = await client.actor('harvestapi/linkedin-profile-posts').call({
    targetUrls: ['https://www.linkedin.com/in/willdouglas-crimsoncarerx'],
    maxPosts: 2,
    postedLimit: 'month',
  });

  const { items } = await client.dataset(run.defaultDatasetId).listItems();

  console.log(`Found ${items.length} posts\n`);

  if (items.length > 0) {
    const item = items[0];
    console.log('=== RAW ITEM DATA ===');
    console.log(`Keys: ${Object.keys(item).join(', ')}\n`);

    console.log('Engagement fields:');
    console.log(`  - reactionIds: ${JSON.stringify(item.reactionIds)}`);
    console.log(`  - commentIds: ${JSON.stringify(item.commentIds)}`);
    console.log(`  - engagement: ${JSON.stringify(item.engagement)}\n`);

    console.log('Extracted values:');
    const reactions = Array.isArray(item.reactionIds) ? item.reactionIds.length : 0;
    const comments = Array.isArray(item.commentIds) ? item.commentIds.length : 0;
    console.log(`  - reactions: ${reactions}`);
    console.log(`  - comments: ${comments}\n`);

    console.log('Post preview:');
    console.log(`  ${item.content?.substring(0, 100)}...`);
  }
}

main().catch(console.error);
