#!/usr/bin/env tsx

/**
 * Add Top Discovered Influencers to Curated List
 *
 * Converts top scored discoveries to Influencer format and adds them
 */

import fs from 'fs/promises';
import path from 'path';
import type { Influencer, DiscoveredInfluencer } from '../lib/types';

const DATA_DIR = path.join(process.cwd(), 'data');

async function main() {
  console.log('📊 Adding top 7 scored discoveries to curated list...\n');

  // Load data
  const influencersPath = path.join(DATA_DIR, 'influencers.json');
  const discoveryPath = path.join(DATA_DIR, 'discovery.json');

  const existingInfluencers: Influencer[] = JSON.parse(
    await fs.readFile(influencersPath, 'utf-8')
  );

  const discovered: DiscoveredInfluencer[] = JSON.parse(
    await fs.readFile(discoveryPath, 'utf-8')
  );

  // Get top 7 by score
  const top7 = discovered
    .filter(d => d.score != null)
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 7);

  console.log('Top 7 discoveries by score:');
  top7.forEach((d, i) => {
    console.log(`  ${i + 1}. ${d.name} - Score: ${d.score?.toFixed(1)}`);
  });
  console.log('');

  // Find next available ID
  const maxId = Math.max(
    ...existingInfluencers
      .map(inf => parseInt(inf.id.replace('inf-', '')))
      .filter(n => !isNaN(n)),
    0
  );
  let nextId = maxId + 1;

  // Convert to Influencer format
  const newInfluencers: Influencer[] = top7.map(disc => {
    // Derive role/company from keywords or use placeholder
    let role = 'Unknown';
    let company = 'Unknown';

    // Build selection rationale from keywords
    const keywordList = disc.discoveredKeywords.join(', ');
    const selectionRationale = `High-scored discovery (${disc.score?.toFixed(1)}) via automated search. Posts about: ${keywordList}. Engagement: ${disc.totalEngagement} across ${disc.postFrequency} posts.`;

    // Calculate relevance from keyword match percentage
    const relevance = Math.round((disc.discoveredKeywords.length / 6) * 100);

    // Build signals from discovery data
    const avgEngagement = disc.postFrequency > 0
      ? Math.round(disc.totalEngagement / disc.postFrequency)
      : null;

    return {
      id: `inf-${String(nextId++).padStart(3, '0')}`,
      name: disc.name,
      role,
      company,
      linkedinUrl: disc.linkedinUrl,
      signals: {
        followers: disc.followerCount ?? null,
        postsPerMonth: disc.postFrequency, // Provisional estimate
        avgEngagement,
        relevance,
        recentEngagement: []
      },
      selectionRationale
    };
  });

  // Merge with existing
  const updatedInfluencers = [...existingInfluencers, ...newInfluencers];

  // Save
  await fs.writeFile(influencersPath, JSON.stringify(updatedInfluencers, null, 2));

  console.log(`✅ Added ${newInfluencers.length} influencers from discovery`);
  console.log(`📋 Total influencers: ${updatedInfluencers.length}\n`);

  // Summary table
  console.log('ID      | Name                              | Score | Posts | Engagement | Keywords');
  console.log('--------|-----------------------------------|-------|-------|------------|------------------');

  newInfluencers.forEach(inf => {
    const discovery = top7.find(d => d.name === inf.name)!;
    const name = inf.name.padEnd(33).substring(0, 33);
    const score = discovery.score?.toFixed(1).padStart(5) || '—';
    const posts = discovery.postFrequency.toString().padStart(5);
    const engagement = discovery.totalEngagement.toString().padStart(10);
    const keywords = discovery.discoveredKeywords.slice(0, 2).join(', ').substring(0, 18);

    console.log(`${inf.id} | ${name} | ${score} | ${posts} | ${engagement} | ${keywords}`);
  });

  console.log('\n⚠️  Note: role/company fields are "Unknown" - refresh will not populate these.');
  console.log('   You may want to manually update them by checking LinkedIn profiles.\n');
}

main().catch(console.error);
