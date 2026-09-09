import { NextRequest, NextResponse } from 'next/server';
import { getPostById } from '@/lib/data';
import { getRelevantContext } from '@/lib/kb';
import { generateResponse, streamGenerateResponse } from '@/lib/llm';
import { logEvent } from '@/lib/events';
import type { GenerationConfig } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId, config, stream = false } = body as {
      postId: string;
      config: GenerationConfig;
      stream?: boolean;
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

    // Stream mode
    if (stream) {
      try {
        const encoder = new TextEncoder();
        const readable = new ReadableStream({
          async start(controller) {
            try {
              // Stream tokens
              for await (const chunk of streamGenerateResponse({
                post,
                config,
                kbContext,
                sources,
              })) {
                if (chunk.type === 'token') {
                  controller.enqueue(encoder.encode(chunk.text));
                } else if (chunk.type === 'metadata') {
                  // Final metadata line as JSON
                  controller.enqueue(
                    encoder.encode('\n__METADATA__\n' + JSON.stringify(chunk.data) + '\n')
                  );

                  // Log generation event
                  await logEvent({
                    postId,
                    action: 'generated',
                    config,
                    model: chunk.data.model,
                    provider: chunk.data.provider,
                    latencyMs: chunk.data.latencyMs,
                    outputText: chunk.data.fullText,
                  });
                }
              }
            } catch (error) {
              console.error('Stream error:', error);
              // Send error marker
              controller.enqueue(
                encoder.encode('\n__ERROR__\n' + JSON.stringify({ error: String(error) }) + '\n')
              );
            } finally {
              controller.close();
            }
          },
        });

        return new Response(readable, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        });
      } catch (streamError) {
        console.error('Failed to initialize stream, falling back to non-streaming:', streamError);
        // Fall through to non-streaming mode
      }
    }

    // Non-streaming mode (fallback or explicit)
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
