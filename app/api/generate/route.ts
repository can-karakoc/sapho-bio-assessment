import { NextRequest, NextResponse } from 'next/server';
import { getPostById } from '@/lib/data';
import { getRelevantContext } from '@/lib/kb';
import { generateResponse } from '@/lib/llm';
import { logEvent } from '@/lib/events';
import type { GenerationConfig } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId, config } = body as {
      postId: string;
      config: GenerationConfig;
    };

    // Validate inputs
    if (!postId || !config) {
      return NextResponse.json(
        { error: 'Missing postId or config' },
        { status: 400 }
      );
    }

    // Load post
    const post = getPostById(postId);
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Get relevant KB context
    const { context: kbContext, sources } = getRelevantContext(post.text);

    // Generate response
    const response = await generateResponse({
      post,
      config,
      kbContext,
      sources,
    });

    // Log generation event
    await logEvent({
      postId,
      action: 'generated',
      config,
      model: response.model,
      provider: response.provider,
      latencyMs: response.latencyMs,
      outputText: response.text,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json(
      { error: 'Generation failed', details: String(error) },
      { status: 500 }
    );
  }
}
