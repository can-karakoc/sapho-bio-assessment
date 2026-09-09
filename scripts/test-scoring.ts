#!/usr/bin/env tsx

/**
 * Test script for lib/score.ts
 * Verifies the scoring algorithm with various signal configurations
 */

import { scoreInfluencer } from '../lib/score';
import type { InfluencerSignals } from '../lib/types';

console.log('=== Influencer Scoring Test ===\n');

// Test Case 1: Full signals, high-performing influencer
const highPerformer: InfluencerSignals = {
  followers: 50000,
  postsPerMonth: 12,
  avgEngagement: 300,
  relevance: 85,
  recentEngagement: [350, 320, 380], // trending up
};

console.log('Test 1: High-performing influencer');
console.log('Signals:', JSON.stringify(highPerformer, null, 2));
const result1 = scoreInfluencer(highPerformer);
console.log('Result:', JSON.stringify(result1, null, 2));
console.log('');

// Test Case 2: Mid-tier influencer
const midTier: InfluencerSignals = {
  followers: 10000,
  postsPerMonth: 6,
  avgEngagement: 150,
  relevance: 60,
  recentEngagement: [140, 160, 150], // stable
};

console.log('Test 2: Mid-tier influencer');
console.log('Signals:', JSON.stringify(midTier, null, 2));
const result2 = scoreInfluencer(midTier);
console.log('Result:', JSON.stringify(result2, null, 2));
console.log('');

// Test Case 3: Missing some signals
const partialData: InfluencerSignals = {
  followers: 5000,
  relevance: 70,
  // Missing: postsPerMonth, avgEngagement, recentEngagement
};

console.log('Test 3: Partial signal data');
console.log('Signals:', JSON.stringify(partialData, null, 2));
const result3 = scoreInfluencer(partialData);
console.log('Result:', JSON.stringify(result3, null, 2));
console.log('');

// Test Case 4: No signals (should return null)
console.log('Test 4: No signals');
const result4 = scoreInfluencer(undefined);
console.log('Result:', result4);
console.log('');

// Test Case 5: Empty signals object (should return null)
console.log('Test 5: Empty signals');
const result5 = scoreInfluencer({});
console.log('Result:', result5);
console.log('');

// Test Case 6: Declining recent engagement
const declining: InfluencerSignals = {
  followers: 20000,
  postsPerMonth: 8,
  avgEngagement: 200,
  relevance: 75,
  recentEngagement: [100, 80, 60], // trending down
};

console.log('Test 6: Declining engagement (low recency score)');
console.log('Signals:', JSON.stringify(declining, null, 2));
const result6 = scoreInfluencer(declining);
console.log('Result:', JSON.stringify(result6, null, 2));
console.log('');

console.log('=== Scoring Formula Verification ===');
console.log('Weights: reach .20, cadence .15, resonance .25, relevance .25, recency .15');
console.log('Expected composite for Test 1:');
if (result1) {
  const expected =
    result1.subscores.reach * 0.2 +
    result1.subscores.cadence * 0.15 +
    result1.subscores.resonance * 0.25 +
    result1.subscores.relevance * 0.25 +
    result1.subscores.recency * 0.15;
  console.log(`  Calculated: ${expected.toFixed(1)}`);
  console.log(`  Returned: ${result1.score}`);
  console.log(`  Match: ${Math.abs(expected - result1.score) < 0.1 ? '✓' : '✗'}`);
}
