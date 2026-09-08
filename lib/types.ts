// Core data types for the application

export interface Influencer {
  id: string;
  name: string;
  title: string;
  company: string;
  linkedinUrl: string;
  followerCount: number;
  selectionRationale: string;
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
}

export interface GenerationConfig {
  goal: 'engagement' | 'leadgen' | 'thought-leadership';
  brandVoice: string;
  instructions: string;
}

export interface GeneratedResponse {
  text: string;
  model: string;
  latencyMs: number;
  usedSources: string[];
  needsReview: boolean;
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
}

export type LLMProvider = 'gemini' | 'groq';
