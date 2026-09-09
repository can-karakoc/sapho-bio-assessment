#!/usr/bin/env tsx

/**
 * Test 2-Month Scraping
 * Test the new parameters on Michelle Simpson before running full refresh
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

  console.log('🧪 Testing 2-month scrape with no maxPosts limit...');
  console.log('Target: Michelle Simpson (inf-003)\n');

  const run = await client.actor('harvestapi/linkedin-profile-posts').call({
    targetUrls: ['https://www.linkedin.com/in/michelle-simpson-pharmd-bcscp-mwc-5a910246/'],
    // No maxPosts - get everything available in last 3 months
    postedLimit: '3months',
  });

  const { items } = await client.dataset(run.defaultDatasetId).listItems();

  console.log(`\n✅ Found ${items.length} posts\n`);

  if (items.length > 0) {
    // Show date range
    const dates = items.map((item: any) => {
      const date = item.postedAt?.date || item.postedAt;
      return new Date(date);
    }).sort((a: Date, b: Date) => b.getTime() - a.getTime());

    const newest = dates[0];
    const oldest = dates[dates.length - 1];

    console.log('Date range:');
    console.log(`  Newest: ${newest.toISOString().split('T')[0]}`);
    console.log(`  Oldest: ${oldest.toISOString().split('T')[0]}`);
    console.log(`  Span: ${Math.round((newest.getTime() - oldest.getTime()) / (1000 * 60 * 60 * 24))} days\n`);

    // Sample engagement from first post
    const sample = items[0];
    console.log('Sample engagement:');
    console.log(`  Likes: ${sample.engagement?.likes || 0}`);
    console.log(`  Comments: ${sample.engagement?.comments || 0}\n`);

    console.log('First post preview:');
    console.log(`  ${sample.content?.substring(0, 100)}...`);
  }
}

main().catch(console.error);
