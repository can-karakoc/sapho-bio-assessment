// Core data types for the application (contract-locked per docs/UI-SPEC.md)

export interface InfluencerSignals {
  followers?: number;
  postsPerMonth?: number;
  avgEngagement?: number;
  relevance?: number; // 0-100
  recentEngagement?: number[]; // engagement values for recent posts
}

export interface InfluencerSubScores {
  reach: number;      // 0-100
  cadence: number;    // 0-100
  resonance: number;  // 0-100
  relevance: number;  // 0-100
  recency: number;    // 0-100
}

export interface Influencer {
  id: string;
  name: string;
  role: string; // renamed from 'title' per spec
  company: string;
  linkedinUrl: string;
  avatarUrl?: string; // LinkedIn profile photo URL
  followers?: number;
  postsPerMonth?: number;
  avgEngagement?: number;
  relevance?: number; // 0-100
  signals?: InfluencerSignals; // raw signal data
  recentEngagement?: number[];
  selectionRationale: string;
  // Computed fields (populated by lib/score.ts)
  score?: number; // 0-100 composite
  subscores?: InfluencerSubScores;
}

export interface PostFlags {
  complianceNegative?: boolean; // true for recalls, warnings, 483s - forces comment-only
}

export interface Post {
  id: string;
  influencerId: string;
  text: string;
  url: string;
  postedAt: string;
  reactions: number;
  comments: number;
  status?: 'new' | 'drafted' | 'posted' | 'skipped';
  flags?: PostFlags;
}

export interface GenerationConfig {
  goal: 'comment' | 'dm'; // comment = engagement, dm = lead-gen
  brandVoice: string;
  instructions: string;
}

export interface GeneratedResponse {
  text: string;
  model: string;
  latencyMs: number;
  usedSources: string[];
  needsReview: boolean;
  variantId: string; // unique ID for this generation variant
  provider?: string;
}

export interface Event {
  id?: string;
  postId: string;
  action: 'generated' | 'regenerated' | 'copied' | 'edited' | 'posted' | 'skipped';
  config?: GenerationConfig;
  model?: string;
  provider?: string;
  latencyMs?: number;
  promptTokens?: number;
  completionTokens?: number;
  outputText?: string;
  editDistance?: number;
  createdAt?: string;
}

export interface DiscoveredInfluencer {
  name: string;
  linkedinUrl: string;
  postFrequency: number;
  totalEngagement: number;
  followerCount?: number;
  discoveredKeywords: string[];
  // Computed via lib/score.ts
  score?: number;
  subscores?: InfluencerSubScores;
}

export interface Override {
  id?: string;
  influencerId: string;
  action: 'pin' | 'mute' | 'unmute' | 'add' | 'dismiss';
  createdAt?: string;
}

export type LLMProvider = 'gemini' | 'groq';
