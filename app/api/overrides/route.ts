import { NextRequest, NextResponse } from 'next/server';
import { loadOverrides, saveOverride } from '@/lib/overrides';
import type { Override } from '@/lib/types';

/**
 * GET /api/overrides
 * Returns all current overrides
 */
export async function GET() {
  try {
    const overrides = await loadOverrides();
    return NextResponse.json(overrides);
  } catch (error) {
    console.error('Failed to load overrides:', error);
    return NextResponse.json(
      { error: 'Failed to load overrides', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/overrides
 * Save a new override action
 */
export async function POST(request: NextRequest) {
  try {
    const override = (await request.json()) as Override;

    // Validate required fields
    if (!override.influencerId || !override.action) {
      return NextResponse.json(
        { error: 'Missing required fields: influencerId, action' },
        { status: 400 }
      );
    }

    // Validate action type
    const validActions = ['pin', 'mute', 'unmute', 'add', 'dismiss'];
    if (!validActions.includes(override.action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      );
    }

    await saveOverride(override);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save override:', error);
    return NextResponse.json(
      { error: 'Failed to save override', details: String(error) },
      { status: 500 }
    );
  }
}
