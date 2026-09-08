import fs from 'fs';
import path from 'path';
import type { Influencer, Post, DiscoveredInfluencer } from './types';

/**
 * Data loading utilities for seed data
 */

const DATA_DIR = path.join(process.cwd(), 'data');

export function loadInfluencers(): Influencer[] {
  try {
    const filePath = path.join(DATA_DIR, 'influencers.json');
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load influencers:', error);
    return [];
  }
}

export function loadPosts(): Post[] {
  try {
    const filePath = path.join(DATA_DIR, 'posts.json');
    const data = fs.readFileSync(filePath, 'utf-8');
    const posts = JSON.parse(data);

    // Initialize status as 'new' if not set
    return posts.map((post: Post) => ({
      ...post,
      status: post.status || 'new',
    }));
  } catch (error) {
    console.error('Failed to load posts:', error);
    return [];
  }
}

export function loadDiscovery(): DiscoveredInfluencer[] {
  try {
    const filePath = path.join(DATA_DIR, 'discovery.json');
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // Discovery file is optional (created by script)
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.error('Failed to load discovery data:', error);
    }
    return [];
  }
}

export function getInfluencerById(id: string): Influencer | undefined {
  const influencers = loadInfluencers();
  return influencers.find(inf => inf.id === id);
}

export function getPostById(id: string): Post | undefined {
  const posts = loadPosts();
  return posts.find(post => post.id === id);
}

export function getPostsByInfluencer(influencerId: string): Post[] {
  const posts = loadPosts();
  return posts.filter(post => post.influencerId === influencerId);
}
