import { NextRequest, NextResponse } from 'next/server';
import { logEvent } from '@/lib/events';
import type { Event } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const event = await request.json() as Event;

    // Validate event
    if (!event.postId || !event.action) {
      return NextResponse.json(
        { error: 'Missing required fields: postId, action' },
        { status: 400 }
      );
    }

    await logEvent(event);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Event logging error:', error);
    return NextResponse.json(
      { error: 'Failed to log event', details: String(error) },
      { status: 500 }
    );
  }
}
