import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import type { Event } from './types';

/**
 * Event logging to Supabase
 *
 * Tracks all actions for measurement and analytics
 * Degrades gracefully if Supabase env vars are not configured
 */

let supabase: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (supabase) return supabase;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.warn(
      'Supabase not configured - events will be logged to console only. ' +
      'Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to enable database logging.'
    );
    return null;
  }

  supabase = createClient(url, key);
  return supabase;
}

/**
 * Log an event to Supabase
 *
 * @param event - Event data to log
 * @returns Promise<void>
 */
export async function logEvent(event: Event): Promise<void> {
  const client = getSupabaseClient();

  // Add timestamp
  const eventWithTimestamp = {
    ...event,
    createdAt: event.createdAt || new Date().toISOString(),
  };

  // Console fallback if no Supabase
  if (!client) {
    console.log('[EVENT]', JSON.stringify(eventWithTimestamp, null, 2));

    // Also append to local .jsonl file (gitignored) for persistence
    try {
      const localDir = path.join(process.cwd(), '.local');
      const localFile = path.join(localDir, 'events.jsonl');

      // Ensure directory exists
      if (!fs.existsSync(localDir)) {
        fs.mkdirSync(localDir, { recursive: true });
      }

      // Append as newline-delimited JSON
      fs.appendFileSync(localFile, JSON.stringify(eventWithTimestamp) + '\n');
    } catch (err) {
      // Silent fail - local logging is best-effort
      console.warn('Failed to write local event log:', err);
    }

    return;
  }

  try {
    // @ts-expect-error - Supabase type inference issue with dynamic event structure
    const { error } = await client.from('events').insert([eventWithTimestamp]);

    if (error) {
      console.error('Failed to log event to Supabase:', error);
      // Still log to console as fallback
      console.log('[EVENT - Fallback]', JSON.stringify(eventWithTimestamp, null, 2));
    }
  } catch (err) {
    console.error('Supabase event logging error:', err);
    console.log('[EVENT - Fallback]', JSON.stringify(eventWithTimestamp, null, 2));
  }
}

/**
 * Get events for a specific post
 */
export async function getPostEvents(postId: string): Promise<Event[]> {
  const client = getSupabaseClient();

  if (!client) {
    console.warn('Supabase not configured - cannot retrieve events');
    return [];
  }

  try {
    const { data, error } = await client
      .from('events')
      .select('*')
      .eq('postId', postId)
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('Failed to fetch post events:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Error fetching post events:', err);
    return [];
  }
}

/**
 * Get all events (for metrics dashboard)
 */
export async function getAllEvents(): Promise<Event[]> {
  const client = getSupabaseClient();

  if (!client) {
    console.warn('Supabase not configured - cannot retrieve events');
    return [];
  }

  try {
    const { data, error } = await client
      .from('events')
      .select('*')
      .order('createdAt', { ascending: false })
      .limit(1000); // Reasonable limit for dashboard

    if (error) {
      console.error('Failed to fetch all events:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Error fetching all events:', err);
    return [];
  }
}
