#!/usr/bin/env tsx

/**
 * Add Curated Influencers Script
 *
 * Adds manually curated anchor influencers to data/influencers.json with:
 * - URL normalization for deduplication
 * - Cross-reference against discovery.json
 * - Sanity check for seed/fake data
 */

import fs from 'fs/promises';
import path from 'path';
import type { Influencer, DiscoveredInfluencer } from '../lib/types';

const DATA_DIR = path.join(process.cwd(), 'data');

// Normalize LinkedIn URL for comparison
function normalizeUrl(url: string): string {
  return url
    .toLowerCase()
    .replace(/^https?:\/\/(www\.)?/, 'https://')
    .replace(/\/$/, '')
    .replace(/[?#].*$/, '');
}

// Check if an influencer is likely seed/fake data
function isSeedData(inf: Influencer): boolean {
  const url = inf.linkedinUrl.toLowerCase();

  // Check for obvious fake patterns
  if (url.includes('example.com')) return true;
  if (!url.includes('linkedin.com')) return true;

  // Check for generic/placeholder names in company
  const genericCompanies = [
    'sterilerx', 'compoundcare', 'pharmablend', 'precision sterile',
    'biosafe', 'sterilesource', 'cleanroom', 'apex sterile',
    'innovacompound', 'purepharma'
  ];

  const companyLower = inf.company.toLowerCase();
  if (genericCompanies.some(g => companyLower.includes(g))) {
    // Also check if URL looks generic/incomplete
    const urlPath = url.split('linkedin.com/in/')[1] || '';
    if (urlPath && (
      urlPath.endsWith('-pharmacy') ||
      urlPath.endsWith('-pharmd') ||
      urlPath.endsWith('-qa') ||
      urlPath.endsWith('-ceo') ||
      urlPath.endsWith('-operations') ||
      urlPath.endsWith('-regulatory') ||
      urlPath.endsWith('-rph') ||
      urlPath.endsWith('-rd') ||
      urlPath.endsWith('-qc')
    )) {
      return true;
    }
  }

  return false;
}

async function main() {
  console.log('📋 Adding curated anchor influencers...\n');

  // Load existing data
  const influencersPath = path.join(DATA_DIR, 'influencers.json');
  const discoveryPath = path.join(DATA_DIR, 'discovery.json');

  const existingInfluencers: Influencer[] = JSON.parse(
    await fs.readFile(influencersPath, 'utf-8')
  );

  const discovered: DiscoveredInfluencer[] = JSON.parse(
    await fs.readFile(discoveryPath, 'utf-8')
  );

  // New curated influencers
  const newCurated: Omit<Influencer, 'id'>[] = [
    {
      name: "Scott Brunner, CAE",
      role: "Chief Executive Officer",
      company: "Alliance for Pharmacy Compounding",
      linkedinUrl: "https://www.linkedin.com/in/rscottbrunner/",
      signals: {
        followers: null,
        postsPerMonth: null,
        avgEngagement: null,
        relevance: 90,
        recentEngagement: []
      },
      selectionRationale: "Leading compounding-policy advocacy voice; very high posting cadence (verified active). Advocacy anchor."
    },
    {
      name: "Tenille Davis, PharmD",
      role: "Chief Advocacy Officer",
      company: "Alliance for Pharmacy Compounding",
      linkedinUrl: "https://www.linkedin.com/in/tenille-davis-547369164/",
      signals: {
        followers: 2000,
        postsPerMonth: null,
        avgEngagement: null,
        relevance: 92,
        recentEngagement: []
      },
      selectionRationale: "Active compounding-advocacy voice; high relevance/engagement despite a modest niche following."
    },
    {
      name: "Jordan Cuccia",
      role: "Senior Director, Compliance and Licensing",
      company: "Empower Pharmacy (503B)",
      linkedinUrl: "https://www.linkedin.com/in/jordan-cuccia-a8a748165/",
      signals: {
        followers: null,
        postsPerMonth: null,
        avgEngagement: null,
        relevance: 95,
        recentEngagement: []
      },
      selectionRationale: "Compliance leader at a major 503B outsourcing facility; closest role-fit to Sapho's buyer."
    }
  ];

  // Build normalized URL map for deduplication
  const existingUrls = new Map<string, string>();
  existingInfluencers.forEach(inf => {
    existingUrls.set(normalizeUrl(inf.linkedinUrl), inf.id);
  });

  // Find next available ID
  const maxId = Math.max(
    ...existingInfluencers
      .map(inf => parseInt(inf.id.replace('inf-', '')))
      .filter(n => !isNaN(n))
  );
  let nextId = maxId + 1;

  // Process each curated influencer
  const crossRefReport: Array<{
    name: string;
    status: 'OVERLAP' | 'MANUAL-ONLY';
    discoveryData?: DiscoveredInfluencer;
  }> = [];

  const toAdd: Influencer[] = [];

  for (const curated of newCurated) {
    const normalizedUrl = normalizeUrl(curated.linkedinUrl);

    // Check for duplicates
    if (existingUrls.has(normalizedUrl)) {
      console.log(`⚠️  Skipping duplicate: ${curated.name} (already exists as ${existingUrls.get(normalizedUrl)})`);
      continue;
    }

    // Cross-reference with discovery
    const discoveryMatch = discovered.find(d =>
      normalizeUrl(d.linkedinUrl) === normalizedUrl ||
      d.name.toLowerCase() === curated.name.toLowerCase()
    );

    if (discoveryMatch) {
      crossRefReport.push({
        name: curated.name,
        status: 'OVERLAP',
        discoveryData: discoveryMatch
      });

      // Merge provisional signals from discovery
      const withProvisionalSignals: Influencer = {
        ...curated,
        id: `inf-${String(nextId++).padStart(3, '0')}`,
        signals: {
          ...curated.signals,
          followers: curated.signals?.followers ?? discoveryMatch.followerCount ?? null,
          postsPerMonth: discoveryMatch.postFrequency ?? null,
          avgEngagement: discoveryMatch.totalEngagement
            ? Math.round(discoveryMatch.totalEngagement / discoveryMatch.postFrequency)
            : null,
        }
      };
      toAdd.push(withProvisionalSignals);
    } else {
      crossRefReport.push({
        name: curated.name,
        status: 'MANUAL-ONLY'
      });

      const withId: Influencer = {
        ...curated,
        id: `inf-${String(nextId++).padStart(3, '0')}`
      };
      toAdd.push(withId);
    }
  }

  // Add to influencers list
  const updatedInfluencers = [...existingInfluencers, ...toAdd];
  await fs.writeFile(influencersPath, JSON.stringify(updatedInfluencers, null, 2));

  console.log(`✅ Added ${toAdd.length} new influencer(s)\n`);

  // TASK 2: Cross-reference report
  console.log('═══════════════════════════════════════════════════════════');
  console.log('TASK 2: CROSS-REFERENCE REPORT');
  console.log('═══════════════════════════════════════════════════════════\n');

  crossRefReport.forEach(item => {
    console.log(`${item.status === 'OVERLAP' ? '🔗' : '📝'} ${item.name}: ${item.status}`);
    if (item.discoveryData) {
      console.log(`   Discovery signals: ${item.discoveryData.postFrequency} posts, ${item.discoveryData.totalEngagement} total engagement`);
      console.log(`   Discovered via: ${item.discoveryData.discoveredKeywords.join(', ')}`);
    }
  });

  // Count non-curated discoveries
  const curatedUrls = new Set(
    updatedInfluencers.map(inf => normalizeUrl(inf.linkedinUrl))
  );
  const nonCuratedCount = discovered.filter(
    d => !curatedUrls.has(normalizeUrl(d.linkedinUrl))
  ).length;

  console.log(`\n📊 Candidate gaps: ${nonCuratedCount} discovered influencers NOT in curated list\n`);

  // TASK 3: Sanity check
  console.log('═══════════════════════════════════════════════════════════');
  console.log('TASK 3: SANITY CHECK — All Influencers');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('ID      | Name                              | Role                                  | Company                              | Rel | Signals | Status');
  console.log('--------|-----------------------------------|---------------------------------------|--------------------------------------|-----|---------|--------');

  updatedInfluencers.forEach(inf => {
    const signals = inf.signals;
    const hasSignals = signals && (
      signals.postsPerMonth != null ||
      signals.avgEngagement != null
    );
    const isSeed = isSeedData(inf);

    const name = inf.name.padEnd(33).substring(0, 33);
    const role = inf.role.padEnd(37).substring(0, 37);
    const company = inf.company.padEnd(36).substring(0, 36);
    const relevance = signals?.relevance?.toString().padStart(3) || '—';
    const signalStatus = hasSignals ? '✓' : '○';
    const status = isSeed ? '⚠️ SEED' : '✓';

    console.log(`${inf.id} | ${name} | ${role} | ${company} | ${relevance} | ${signalStatus}       | ${status}`);
  });

  console.log('\n');
  console.log('Legend:');
  console.log('  Signals: ✓ = populated (scraped), ○ = pending refresh');
  console.log('  Status:  ✓ = real, ⚠️ SEED = likely placeholder/fake data\n');

  const seedCount = updatedInfluencers.filter(isSeedData).length;
  if (seedCount > 0) {
    console.log(`⚠️  Found ${seedCount} seed/placeholder record(s). Consider removing before production use.`);
  }
}

main().catch(console.error);
