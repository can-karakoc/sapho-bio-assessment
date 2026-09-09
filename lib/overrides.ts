import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import type { Override } from './types';

/**
 * Override persistence layer
 *
 * Stores manual influencer actions (pin, mute, add, dismiss) with:
 * - Primary: Supabase (influencer_overrides table)
 * - Fallback: data/overrides.json
 *
 * Enables zero-key operation while supporting production persistence.
 */

const OVERRIDES_FILE = path.join(process.cwd(), 'data/overrides.json');

let supabase: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (supabase) return supabase;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return null;
  }

  supabase = createClient(url, key);
  return supabase;
}

/**
 * Load all overrides (Supabase → JSON fallback)
 */
export async function loadOverrides(): Promise<Override[]> {
  const client = getSupabaseClient();

  // Try Supabase first
  if (client) {
    try {
      const { data } = await client
        .from('influencer_overrides')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return data.map((row: any) => ({
          id: row.id,
          influencerId: row.influencer_id,
          action: row.action,
          createdAt: row.created_at,
        }));
      }
    } catch (err) {
      console.warn('Supabase overrides load failed, falling back to JSON:', err);
    }
  }

  // Fallback to JSON file
  try {
    const content = fs.readFileSync(OVERRIDES_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    // File doesn't exist or is empty - return empty array
    return [];
  }
}

/**
 * Save an override action
 */
export async function saveOverride(override: Override): Promise<void> {
  const client = getSupabaseClient();

  const overrideWithTimestamp = {
    ...override,
    createdAt: override.createdAt || new Date().toISOString(),
  };

  // Try Supabase first
  if (client) {
    try {
      const { error } = await client
        .from('influencer_overrides')
        .insert([
          {
            influencer_id: overrideWithTimestamp.influencerId,
            action: overrideWithTimestamp.action,
            created_at: overrideWithTimestamp.createdAt,
          },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ] as any);

      if (!error) {
        return; // Success - don't write to JSON
      }

      console.warn('Supabase override save failed, falling back to JSON:', error);
    } catch (err) {
      console.warn('Supabase override save error, falling back to JSON:', err);
    }
  }

  // Fallback to JSON file
  try {
    const existing = await loadOverrides();
    existing.push(overrideWithTimestamp);
    fs.writeFileSync(OVERRIDES_FILE, JSON.stringify(existing, null, 2));
  } catch (error) {
    console.error('Failed to save override to JSON:', error);
  }
}

/**
 * Apply overrides to an influencer list
 * - Pinned items moved to top (preserve pin order by createdAt)
 * - Muted items excluded
 * - Dismissed candidates excluded
 */
export function applyOverrides<T extends { id: string }>(
  items: T[],
  overrides: Override[]
): T[] {
  // Build override map (latest action per influencer)
  const overrideMap = new Map<string, Override>();
  for (const override of overrides) {
    const existing = overrideMap.get(override.influencerId);
    if (!existing || override.createdAt! > existing.createdAt!) {
      overrideMap.set(override.influencerId, override);
    }
  }

  // Separate pinned, muted, and normal
  const pinned: T[] = [];
  const normal: T[] = [];

  for (const item of items) {
    const override = overrideMap.get(item.id);

    if (override?.action === 'pin') {
      pinned.push(item);
    } else if (override?.action === 'mute' || override?.action === 'dismiss') {
      // Exclude muted and dismissed
      continue;
    } else {
      normal.push(item);
    }
  }

  // Return: pinned first (in original order), then normal
  return [...pinned, ...normal];
}
