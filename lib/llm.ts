import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import type { GenerationConfig, GeneratedResponse, Post } from './types';

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
      const model = this.client.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

      const prompt = this.buildPrompt(post, config, kbContext);

      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      const latencyMs = Date.now() - startTime;

      // Gemini usage metadata (may not be available in all SDK versions)
      const usage = response.usageMetadata;

      return {
        text,
        model: 'gemini-2.0-flash-exp',
        latencyMs,
        promptTokens: usage?.promptTokenCount,
        completionTokens: usage?.candidatesTokenCount,
      };
    } catch (error) {
      console.error('Gemini generation error:', error);
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
      engagement: 'build community and encourage conversation',
      leadgen: 'identify potential customers and open a sales conversation',
      'thought-leadership': 'position Sapho Bio as an industry expert',
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

RESPONSE:`;
  }

  private mockResponse(
    post: Post,
    config: GenerationConfig,
    startTime: number
  ): ProviderResponse {
    const mockTexts = {
      engagement: `Great insights! Environmental monitoring truly is the foundation of quality in sterile compounding. At Sapho Bio, we've seen how a proactive approach to compliance builds long-term operational excellence.`,
      leadgen: `Congrats on the successful inspection! Building a culture of quality is exactly what sets leaders apart. We'd love to hear more about your environmental monitoring strategy - are you open to connecting?`,
      'thought-leadership': `This resonates deeply. Compliance isn't just about passing inspections - it's about systematic excellence. Our work with 503B facilities shows that the best teams treat USP 797 as a baseline, not a ceiling.`,
    };

    return {
      text: `[MOCK RESPONSE - No Gemini API key configured]\n\n${mockTexts[config.goal]}`,
      model: 'gemini-2.0-flash-exp (mock)',
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
        model: 'llama-3.3-70b-versatile',
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
        model: 'llama-3.3-70b-versatile',
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
      engagement: 'build community and encourage conversation',
      leadgen: 'identify potential customers and open a sales conversation',
      'thought-leadership': 'position Sapho Bio as an industry expert',
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

RESPONSE:`;
  }

  private mockResponse(
    post: Post,
    config: GenerationConfig,
    startTime: number
  ): ProviderResponse {
    const mockTexts = {
      engagement: `Really appreciate you sharing this! The connection between environmental monitoring and culture is spot-on. At Sapho Bio, we see the same pattern with leading 503B facilities.`,
      leadgen: `Impressive results! Quality culture starts at the top. If you're ever interested in discussing how other facilities are approaching environmental monitoring at scale, let's connect.`,
      'thought-leadership': `Well said. Our research across 503B facilities confirms this - sustainable compliance comes from treating quality as a continuous improvement process, not a checkbox exercise.`,
    };

    return {
      text: `[MOCK RESPONSE - No Groq API key configured]\n\n${mockTexts[config.goal]}`,
      model: 'llama-3.3-70b-versatile (mock)',
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
    config.goal === 'leadgen' || // Always review lead-gen responses
    result.text.length < 50; // Suspiciously short

  return {
    text: result.text,
    model: result.model,
    latencyMs: result.latencyMs,
    usedSources: sources,
    needsReview,
    provider: providerName,
  };
}

/**
 * Get the current provider name
 */
export function getCurrentProvider(): string {
  return process.env.LLM_PROVIDER || 'gemini';
}
