import { GoogleGenerativeAI } from '@google/genai';
import { buildPrompt, buildQuickPrompt } from '../config/basePrompt';
import { WritingStyle } from '../config/stylePrompts';

export interface GenerationResponse {
  draft: string;
  promptUsed: string;
  tokenUsage: {
    inputTokens: number;
    outputTokens: number;
  };
  generatedAt: number;
  style: WritingStyle;
}

export interface GenerationError {
  error: string;
  code?: string;
}

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

let genAI: GoogleGenerativeAI | null = null;

function initializeGenAI(): GoogleGenerativeAI {
  if (!genAI && GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  }
  return genAI!;
}

/**
 * Generates a draft article using Google Gemini API
 * Applies style modifiers to create different variations
 */
export async function generateDraft(
  content: string,
  style: WritingStyle = 'editorial'
): Promise<GenerationResponse | GenerationError> {
  try {
    if (!GEMINI_API_KEY) {
      return {
        error: 'Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your environment.'
      };
    }

    if (!content || content.trim().length === 0) {
      return {
        error: 'Article content is required to generate a draft.'
      };
    }

    console.log(`[v0] Starting draft generation with style: ${style}`);

    const genAIClient = initializeGenAI();
    const model = genAIClient.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
    });

    // Build the prompt with style modifiers
    const prompt = buildPrompt(content, style);

    // Generate content
    const result = await model.generateContent({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 4096,
        responseMimeType: 'text/plain'
      },
      safetySettings: [
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_ONLY_HIGH'
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_ONLY_HIGH'
        },
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_ONLY_HIGH'
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_ONLY_HIGH'
        }
      ]
    });

    const responseText = result.response.text();

    // Extract token usage from response
    const usageMetadata = result.response.usageMetadata;
    const tokenUsage = {
      inputTokens: usageMetadata?.promptTokens || 0,
      outputTokens: usageMetadata?.candidatesTokens || 0
    };

    console.log(`[v0] Draft generated successfully. Tokens: ${tokenUsage.inputTokens} input, ${tokenUsage.outputTokens} output`);

    return {
      draft: responseText,
      promptUsed: prompt,
      tokenUsage,
      generatedAt: Date.now(),
      style
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('[v0] Generation error:', errorMessage);

    // Handle specific API errors
    if (errorMessage.includes('API key')) {
      return {
        error: 'Invalid Gemini API key. Please check your credentials.',
        code: 'INVALID_API_KEY'
      };
    }

    if (errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
      return {
        error: 'API quota exceeded. Please try again later.',
        code: 'QUOTA_EXCEEDED'
      };
    }

    if (errorMessage.includes('blocked') || errorMessage.includes('safety')) {
      return {
        error: 'The generated content was blocked by safety filters. Please try with different content or style.',
        code: 'SAFETY_BLOCKED'
      };
    }

    return {
      error: `Error generating draft: ${errorMessage}`,
      code: 'GENERATION_ERROR'
    };
  }
}

/**
 * Regenerate a draft with a different style
 */
export async function regenerateDraftWithStyle(
  originalContent: string,
  newStyle: WritingStyle
): Promise<GenerationResponse | GenerationError> {
  return generateDraft(originalContent, newStyle);
}

/**
 * Estimate token count for content (approximate)
 */
export function estimateTokenCount(text: string): number {
  // Rough estimate: ~1 token per 4 characters for English text
  return Math.ceil(text.length / 4);
}

/**
 * Get model information
 */
export function getModelInfo() {
  return {
    model: 'gemini-2.0-flash',
    maxTokens: 4096,
    temperatureDefault: 0.7
  };
}
