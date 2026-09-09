import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import type { GenerationConfig, GeneratedResponse, Post } from './types';

// Model IDs are env-overridable so a provider-side rename never requires a code change.
// Using gemini-3.6-flash (recommended by Google for new users)
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
const GROQ_MODEL = process.env.GROQ_MODEL || 'groq/compound';

/**
 * LLM Provider abstraction layer
 *
 * Supports multiple providers (Gemini, Groq) selected via LLM_PROVIDER env var
 * Falls back to mock responses when API keys are absent
 */

interface ProviderResponse {
  text: string;
  model: string;
  latencyMs: number;
  promptTokens?: number;
  completionTokens?: number;
}

interface LLMProviderInterface {
  generateResponse(
    post: Post,
    config: GenerationConfig,
    kbContext: string,
    sources: string[]
  ): Promise<ProviderResponse>;
}

// ============================================================================
// GEMINI PROVIDER (Default)
// ============================================================================

class GeminiProvider implements LLMProviderInterface {
  private client: GoogleGenerativeAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.client = new GoogleGenerativeAI(apiKey);
    }
  }

  async generateResponse(
    post: Post,
    config: GenerationConfig,
    kbContext: string,
    _sources: string[]
  ): Promise<ProviderResponse> {
    const startTime = Date.now();

    // Mock response if no API key
    if (!this.client) {
      return this.mockResponse(post, config, startTime);
    }

    try {
      const model = this.client.getGenerativeModel({ model: GEMINI_MODEL });

      const prompt = this.buildPrompt(post, config, kbContext);

      console.log('[Gemini] Generating with model:', GEMINI_MODEL);
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      console.log('[Gemini] Success! Generated', text.length, 'chars');

      const latencyMs = Date.now() - startTime;

      // Gemini usage metadata (may not be available in all SDK versions)
      const usage = response.usageMetadata;

      return {
        text,
        model: GEMINI_MODEL,
        latencyMs,
        promptTokens: usage?.promptTokenCount,
        completionTokens: usage?.candidatesTokenCount,
      };
    } catch (error) {
      console.error('[Gemini] Generation error:', error);
      console.error('[Gemini] Error details:', JSON.stringify(error, null, 2));
      // Fall back to mock on error
      return this.mockResponse(post, config, startTime);
    }
  }

  private buildPrompt(
    post: Post,
    config: GenerationConfig,
    kbContext: string
  ): string {
    const goalDescriptions = {
      comment: 'build community and encourage conversation through a public comment',
      dm: 'identify potential customers and open a sales conversation through a direct message',
    };

    return `You are writing a LinkedIn comment on behalf of Sapho Bio.

CONTEXT & KNOWLEDGE BASE:
${kbContext}

ORIGINAL POST:
"${post.text}"

GOAL: ${goalDescriptions[config.goal]}

BRAND VOICE: ${config.brandVoice}

ADDITIONAL INSTRUCTIONS: ${config.instructions || 'None'}

Write a professional, engaging LinkedIn comment that:
1. Acknowledges the original post thoughtfully
2. Adds genuine value (insight, question, or resource)
3. Reflects Sapho Bio's brand voice
4. Is grounded in the knowledge base provided
5. Achieves the specified goal without being overly salesy

Keep it concise (2-4 sentences typically work best on LinkedIn).

OUTPUT FORMAT - EXTREMELY IMPORTANT:
- Return ONLY the raw comment text
- NO markdown headers (**, ##, ###)
- NO sections labeled "Reasoning", "Approach", "Final Comment", etc.
- NO numbered explanations
- NO meta-commentary about the comment
- Just the plain comment text that will be copy-pasted directly to LinkedIn
- Think of this as filling in a text box - nothing but the comment itself

RESPONSE:`;
  }

  private mockResponse(
    post: Post,
    config: GenerationConfig,
    startTime: number
  ): ProviderResponse {
    const mockTexts = {
      comment: `Great insights! Environmental monitoring truly is the foundation of quality in sterile compounding. At Sapho Bio, we've seen how a proactive approach to compliance builds long-term operational excellence.`,
      dm: `Congrats on the successful inspection! Building a culture of quality is exactly what sets leaders apart. We'd love to hear more about your environmental monitoring strategy - are you open to connecting?`,
    };

    return {
      text: `[MOCK RESPONSE - No Gemini API key configured]\n\n${mockTexts[config.goal]}`,
      model: `${GEMINI_MODEL} (mock)`,
      latencyMs: Date.now() - startTime,
    };
  }
}

// ============================================================================
// GROQ PROVIDER
// ============================================================================

class GroqProvider implements LLMProviderInterface {
  private client: Groq | null = null;

  constructor() {
    const apiKey = process.env.GROQ_API_KEY;
    if (apiKey) {
      this.client = new Groq({ apiKey });
    }
  }

  async generateResponse(
    post: Post,
    config: GenerationConfig,
    kbContext: string,
    _sources: string[]
  ): Promise<ProviderResponse> {
    const startTime = Date.now();

    // Mock response if no API key
    if (!this.client) {
      return this.mockResponse(post, config, startTime);
    }

    try {
      const prompt = this.buildPrompt(post, config, kbContext);

      const completion = await this.client.chat.completions.create({
        model: GROQ_MODEL,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 300,
      });

      const text = completion.choices[0]?.message?.content || '';
      const latencyMs = Date.now() - startTime;

      return {
        text,
        model: GROQ_MODEL,
        latencyMs,
        promptTokens: completion.usage?.prompt_tokens,
        completionTokens: completion.usage?.completion_tokens,
      };
    } catch (error) {
      console.error('Groq generation error:', error);
      return this.mockResponse(post, config, startTime);
    }
  }

  private buildPrompt(
    post: Post,
    config: GenerationConfig,
    kbContext: string
  ): string {
    // Same prompt structure as Gemini for consistency
    const goalDescriptions = {
      comment: 'build community and encourage conversation through a public comment',
      dm: 'identify potential customers and open a sales conversation through a direct message',
    };

    return `You are writing a LinkedIn comment on behalf of Sapho Bio.

CONTEXT & KNOWLEDGE BASE:
${kbContext}

ORIGINAL POST:
"${post.text}"

GOAL: ${goalDescriptions[config.goal]}

BRAND VOICE: ${config.brandVoice}

ADDITIONAL INSTRUCTIONS: ${config.instructions || 'None'}

Write a professional, engaging LinkedIn comment that:
1. Acknowledges the original post thoughtfully
2. Adds genuine value (insight, question, or resource)
3. Reflects Sapho Bio's brand voice
4. Is grounded in the knowledge base provided
5. Achieves the specified goal without being overly salesy

Keep it concise (2-4 sentences typically work best on LinkedIn).

OUTPUT FORMAT - EXTREMELY IMPORTANT:
- Return ONLY the raw comment text
- NO markdown headers (**, ##, ###)
- NO sections labeled "Reasoning", "Approach", "Final Comment", etc.
- NO numbered explanations
- NO meta-commentary about the comment
- Just the plain comment text that will be copy-pasted directly to LinkedIn
- Think of this as filling in a text box - nothing but the comment itself

RESPONSE:`;
  }

  private mockResponse(
    post: Post,
    config: GenerationConfig,
    startTime: number
  ): ProviderResponse {
    const mockTexts = {
      comment: `Really appreciate you sharing this! The connection between environmental monitoring and culture is spot-on. At Sapho Bio, we see the same pattern with leading 503B facilities.`,
      dm: `Impressive results! Quality culture starts at the top. If you're ever interested in discussing how other facilities are approaching environmental monitoring at scale, let's connect.`,
    };

    return {
      text: `[MOCK RESPONSE - No Groq API key configured]\n\n${mockTexts[config.goal]}`,
      model: `${GROQ_MODEL} (mock)`,
      latencyMs: Date.now() - startTime,
    };
  }
}

// ============================================================================
// PROVIDER SELECTION & PUBLIC API
// ============================================================================

function getProvider(): LLMProviderInterface {
  const providerName = (process.env.LLM_PROVIDER || 'gemini').toLowerCase();

  switch (providerName) {
    case 'groq':
      return new GroqProvider();
    case 'gemini':
    default:
      return new GeminiProvider();
  }
}

/**
 * Generate a LinkedIn response for a post
 */
export async function generateResponse(params: {
  post: Post;
  config: GenerationConfig;
  kbContext: string;
  sources: string[];
}): Promise<GeneratedResponse> {
  const { post, config, kbContext, sources } = params;

  const provider = getProvider();
  const providerName = process.env.LLM_PROVIDER || 'gemini';

  const result = await provider.generateResponse(post, config, kbContext, sources);

  // Simple heuristic for "needs review" flag
  const needsReview =
    result.text.includes('[MOCK') ||
    result.text.includes('TODO') ||
    config.goal === 'dm' || // Always review DM responses
    result.text.length < 50; // Suspiciously short

  return {
    text: result.text,
    model: result.model,
    latencyMs: result.latencyMs,
    usedSources: sources,
    needsReview,
    variantId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // unique variant ID
    provider: providerName,
  };
}

/**
 * Get the current provider name
 */
export function getCurrentProvider(): string {
  return process.env.LLM_PROVIDER || 'gemini';
}

/**
 * Stream tokens from LLM generation
 * Yields chunks of type 'token' or 'metadata'
 */
export async function* streamGenerateResponse(params: {
  post: Post;
  config: GenerationConfig;
  kbContext: string;
  sources: string[];
}): AsyncGenerator<
  | { type: 'token'; text: string }
  | {
      type: 'metadata';
      data: {
        model: string;
        latencyMs: number;
        usedSources: string[];
        needsReview: boolean;
        variantId: string;
        provider: string;
        fullText: string;
      };
    }
> {
  const { post, config, kbContext, sources } = params;
  const providerName = (process.env.LLM_PROVIDER || 'gemini').toLowerCase();
  const startTime = Date.now();

  let fullText = '';

  try {
    if (providerName === 'groq') {
      // Groq streaming
      const apiKey = process.env.GROQ_API_KEY;
      if (apiKey) {
        const groq = new Groq({ apiKey });
        // Build prompt using same logic as GroqProvider
        const goalDescriptions = {
          comment: 'build community and encourage conversation through a public comment',
          dm: 'identify potential customers and open a sales conversation through a direct message',
        };
        const prompt = `You are writing a LinkedIn comment on behalf of Sapho Bio.

CONTEXT & KNOWLEDGE BASE:
${kbContext}

ORIGINAL POST:
"${post.text}"

GOAL: ${goalDescriptions[config.goal]}

BRAND VOICE: ${config.brandVoice}

ADDITIONAL INSTRUCTIONS: ${config.instructions || 'None'}

Write a professional, engaging LinkedIn comment that:
1. Acknowledges the original post thoughtfully
2. Adds genuine value (insight, question, or resource)
3. Reflects Sapho Bio's brand voice
4. Is grounded in the knowledge base provided
5. Achieves the specified goal without being overly salesy

Keep it concise (2-4 sentences typically work best on LinkedIn).

OUTPUT FORMAT - EXTREMELY IMPORTANT:
- Return ONLY the raw comment text
- NO markdown headers (**, ##, ###)
- NO sections labeled "Reasoning", "Approach", "Final Comment", etc.
- NO numbered explanations
- NO meta-commentary about the comment
- Just the plain comment text that will be copy-pasted directly to LinkedIn
- Think of this as filling in a text box - nothing but the comment itself

RESPONSE:`;

        const stream = await groq.chat.completions.create({
          model: GROQ_MODEL,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 300,
          stream: true,
        });

        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            fullText += content;
            yield { type: 'token', text: content };
          }
        }
      } else {
        // Mock streaming for Groq
        const mockText = `[MOCK RESPONSE - No Groq API key configured]\n\nReally appreciate you sharing this! The connection between environmental monitoring and culture is spot-on. At Sapho Bio, we see the same pattern with leading 503B facilities.`;
        for (const char of mockText) {
          fullText += char;
          yield { type: 'token', text: char };
          await new Promise((resolve) => setTimeout(resolve, 10)); // Simulate streaming
        }
      }
    } else {
      // Gemini streaming (default)
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey) {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
        // Build prompt using same logic as GeminiProvider
        const goalDescriptions = {
          comment: 'build community and encourage conversation through a public comment',
          dm: 'identify potential customers and open a sales conversation through a direct message',
        };
        const prompt = `You are writing a LinkedIn comment on behalf of Sapho Bio.

CONTEXT & KNOWLEDGE BASE:
${kbContext}

ORIGINAL POST:
"${post.text}"

GOAL: ${goalDescriptions[config.goal]}

BRAND VOICE: ${config.brandVoice}

ADDITIONAL INSTRUCTIONS: ${config.instructions || 'None'}

Write a professional, engaging LinkedIn comment that:
1. Acknowledges the original post thoughtfully
2. Adds genuine value (insight, question, or resource)
3. Reflects Sapho Bio's brand voice
4. Is grounded in the knowledge base provided
5. Achieves the specified goal without being overly salesy

Keep it concise (2-4 sentences typically work best on LinkedIn).

OUTPUT FORMAT - EXTREMELY IMPORTANT:
- Return ONLY the raw comment text
- NO markdown headers (**, ##, ###)
- NO sections labeled "Reasoning", "Approach", "Final Comment", etc.
- NO numbered explanations
- NO meta-commentary about the comment
- Just the plain comment text that will be copy-pasted directly to LinkedIn
- Think of this as filling in a text box - nothing but the comment itself

RESPONSE:`;

        const result = await model.generateContentStream(prompt);

        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          if (chunkText) {
            fullText += chunkText;
            yield { type: 'token', text: chunkText };
          }
        }
      } else {
        // Mock streaming for Gemini
        const mockText = `[MOCK RESPONSE - No Gemini API key configured]\n\nGreat insights! Environmental monitoring truly is the foundation of quality in sterile compounding. At Sapho Bio, we've seen how a proactive approach to compliance builds long-term operational excellence.`;
        for (const char of mockText) {
          fullText += char;
          yield { type: 'token', text: char };
          await new Promise((resolve) => setTimeout(resolve, 10)); // Simulate streaming
        }
      }
    }
  } catch (error: unknown) {
    console.error('[Streaming] Error:', error);
    const err = error as Error;
    console.error('[Streaming] Error message:', err.message);

    // Try to extract a helpful error message
    let errorMessage = 'Generation failed';
    if (err.message?.includes('503') || err.message?.includes('high demand')) {
      errorMessage = 'Model is busy, retrying with fallback...';
    } else if (err.message?.includes('404')) {
      errorMessage = 'Model not found';
    } else if (err.message) {
      errorMessage = err.message;
    }

    // Fallback to non-streaming
    console.log('[Streaming] Falling back to non-streaming mode...');
    try {
      const provider = getProvider();
      const result = await provider.generateResponse(post, config, kbContext, sources);
      fullText = result.text;
      yield { type: 'token', text: result.text };
    } catch (fallbackError: unknown) {
      const fallbackErr = fallbackError as Error;
      console.error('[Fallback] Also failed:', fallbackErr.message);
      // Return error as text
      yield { type: 'token', text: `[Error: ${errorMessage}]\n\nPlease try again or use a different model.` };
      fullText = `Error: ${errorMessage}`;
    }
  }

  const latencyMs = Date.now() - startTime;
  const needsReview =
    fullText.includes('[MOCK') ||
    fullText.includes('TODO') ||
    config.goal === 'dm' ||
    fullText.length < 50;

  yield {
    type: 'metadata',
    data: {
      model: providerName === 'groq' ? GROQ_MODEL : GEMINI_MODEL,
      latencyMs,
      usedSources: sources,
      needsReview,
      variantId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      provider: providerName,
      fullText,
    },
  };
}
