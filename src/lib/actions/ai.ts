"use server";

/**
 * AI Copilot Actions
 * 
 * OpenAI integration for generating ideas with:
 * - Rate limiting (50 requests/hour)
 * - Zod validation of AI responses
 * - Usage logging for audit trails
 */

import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
// ... (previous imports)
import {
    GenerateIdeasInputSchema,
    AIIdeasResponseSchema,
    GenerateSuggestionsInputSchema,
    AISuggestionsResponseSchema,
    type GenerateIdeasInput,
    type AIIdeasResponse,
    type GenerateSuggestionsInput,
    type AISuggestionsResponse,
} from "@/lib/validation";
// ... (rest of imports)

// ... (existing code for generateIdeas)

// =============================================================================
// GENERATE SUGGESTIONS ACTION
// =============================================================================

export interface GenerateSuggestionsResult {
    suggestions: AISuggestionsResponse["suggestions"];
    tokensUsed: number;
    remainingRequests: number;
}

/**
 * Generate suggestions based on user prompt and node context
 * 
 * Rate limited to 50 requests per hour per user.
 */
export async function generateSuggestions(
    input: GenerateSuggestionsInput
): Promise<ActionResult<GenerateSuggestionsResult>> {
    try {
        // Validate input
        const validated = GenerateSuggestionsInputSchema.parse(input);
        const userId = await getCurrentUserId();

        // Check rate limit
        const rateLimit = await checkRateLimit(userId);
        if (!rateLimit.allowed) {
            throw new RateLimitError(RATE_LIMIT_MAX_REQUESTS, rateLimit.resetTime);
        }

        // Build the prompt
        const systemPrompt = `You are a creative mind-mapping assistant. Your job is to provide specific suggestions based on a user's prompt and a selected node.
        
Rules:
1. Listen to the user's specific request in the "prompt".
2. Consider the "nodeText" as the anchor or subject.
3. Generate 3-5 relevant suggestions.
4. Each suggestion must have a concise label (1-5 words).
5. Provide a brief description and optionally reasoning.
6. Categorize each as "topic" (main concept), "idea" (related thought), or "note" (supporting detail).

Respond ONLY with valid JSON in this exact format:
{
  "suggestions": [
    { "label": "Short Label", "description": "Optional brief description", "type": "idea", "reasoning": "Why this matches" }
  ]
}`;

        const userPrompt = `Context Node: "${validated.nodeText}"
User Prompt: "${validated.userPrompt}"
${validated.context ? `Additional Context: ${validated.context}` : ""}`;

        // Call OpenAI
        const modelName = process.env.OPENAI_MODEL || "gpt-4o-mini";

        const response = await generateText({
            model: openai(modelName),
            system: systemPrompt,
            prompt: userPrompt,
            temperature: 0.7,
            maxOutputTokens: 800,
        });

        // Parse and validate AI response
        let parsedResponse: AISuggestionsResponse;
        try {
            const jsonMatch = response.text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error("No JSON found in response");
            }
            const rawJson = JSON.parse(jsonMatch[0]);
            parsedResponse = AISuggestionsResponseSchema.parse(rawJson);
        } catch (parseError) {
            console.error("[AI] Failed to parse response:", response.text);
            throw new ValidationError(
                "Failed to parse AI response. Please try again.",
                { rawResponse: response.text }
            );
        }

        // Log usage
        const tokensUsed = response.usage?.totalTokens || 0;
        await logUsage(userId, tokensUsed, "generateSuggestions", modelName);

        // Calculate remaining requests
        const remainingRequests = RATE_LIMIT_MAX_REQUESTS - rateLimit.currentUsage - 1;

        return successResult({
            suggestions: parsedResponse.suggestions,
            tokensUsed,
            remainingRequests: Math.max(0, remainingRequests),
        });

    } catch (error) {
        return handleActionError(error);
    }
}

// ... (rest of file)
import {
    ActionResult,
    successResult,
    handleActionError,
    RateLimitError,
    ValidationError,
} from "@/lib/errors";

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Rate limit: 50 requests per hour
 */
const RATE_LIMIT_MAX_REQUESTS = 50;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// =============================================================================
// OPENAI CLIENT
// =============================================================================

const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY || "",
});

// =============================================================================
// RATE LIMITING
// =============================================================================

/**
 * Check if user has exceeded rate limit
 */
async function checkRateLimit(userId: string): Promise<{
    allowed: boolean;
    currentUsage: number;
    resetTime: Date;
}> {
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);

    const usage = await db.aIUsageLog.count({
        where: {
            userId,
            timestamp: {
                gte: windowStart,
            },
        },
    });

    const resetTime = new Date(windowStart.getTime() + RATE_LIMIT_WINDOW_MS);

    return {
        allowed: usage < RATE_LIMIT_MAX_REQUESTS,
        currentUsage: usage,
        resetTime,
    };
}

/**
 * Log AI usage for rate limiting and audit
 */
async function logUsage(
    userId: string,
    tokensUsed: number,
    action: string,
    model?: string
): Promise<void> {
    await db.aIUsageLog.create({
        data: {
            userId,
            tokensUsed,
            action,
            model,
        },
    });
}

// =============================================================================
// GENERATE IDEAS ACTION
// =============================================================================

export interface GenerateIdeasResult {
    ideas: AIIdeasResponse["ideas"];
    tokensUsed: number;
    remainingRequests: number;
}

/**
 * Generate ideas for a mind map node using OpenAI
 * 
 * Rate limited to 50 requests per hour per user.
 */
export async function generateIdeas(
    input: GenerateIdeasInput
): Promise<ActionResult<GenerateIdeasResult>> {
    try {
        // Validate input
        const validated = GenerateIdeasInputSchema.parse(input);
        const userId = await getCurrentUserId();

        // Check rate limit
        const rateLimit = await checkRateLimit(userId);
        if (!rateLimit.allowed) {
            throw new RateLimitError(RATE_LIMIT_MAX_REQUESTS, rateLimit.resetTime);
        }

        // Build the prompt
        const systemPrompt = `You are a creative mind-mapping assistant. Your job is to generate related ideas, sub-topics, or notes that branch from a given concept. 

Rules:
1. Generate 3-5 diverse, relevant ideas
2. Each idea should be concise (1-5 words for the label)
3. Optionally include a brief description
4. Categorize each as "topic" (main concept), "idea" (related thought), or "note" (supporting detail)

Respond ONLY with valid JSON in this exact format:
{
  "ideas": [
    { "label": "Short Label", "description": "Optional brief description", "type": "idea" }
  ]
}`;

        const userPrompt = validated.context
            ? `Context: ${validated.context}\n\nGenerate ideas related to: "${validated.nodeText}"`
            : `Generate ideas related to: "${validated.nodeText}"`;

        // Call OpenAI
        const modelName = process.env.OPENAI_MODEL || "gpt-4o-mini";

        const response = await generateText({
            model: openai(modelName),
            system: systemPrompt,
            prompt: userPrompt,
            temperature: 0.7,
            maxOutputTokens: 500,
        });

        // Parse and validate AI response
        let parsedResponse: AIIdeasResponse;
        try {
            const jsonMatch = response.text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error("No JSON found in response");
            }
            const rawJson = JSON.parse(jsonMatch[0]);
            parsedResponse = AIIdeasResponseSchema.parse(rawJson);
        } catch (parseError) {
            console.error("[AI] Failed to parse response:", response.text);
            throw new ValidationError(
                "Failed to parse AI response. Please try again.",
                { rawResponse: response.text }
            );
        }

        // Log usage
        const tokensUsed = response.usage?.totalTokens || 0;
        await logUsage(userId, tokensUsed, "generateIdeas", modelName);

        // Calculate remaining requests
        const remainingRequests = RATE_LIMIT_MAX_REQUESTS - rateLimit.currentUsage - 1;

        return successResult({
            ideas: parsedResponse.ideas,
            tokensUsed,
            remainingRequests: Math.max(0, remainingRequests),
        });

    } catch (error) {
        return handleActionError(error);
    }
}

// =============================================================================
// GET AI USAGE STATUS
// =============================================================================

export interface AIUsageStatus {
    currentUsage: number;
    maxRequests: number;
    remainingRequests: number;
    resetTime: Date;
}

/**
 * Get current AI usage status for the user
 */
export async function getAIUsageStatus(): Promise<ActionResult<AIUsageStatus>> {
    try {
        const userId = await getCurrentUserId();
        const rateLimit = await checkRateLimit(userId);

        return successResult({
            currentUsage: rateLimit.currentUsage,
            maxRequests: RATE_LIMIT_MAX_REQUESTS,
            remainingRequests: RATE_LIMIT_MAX_REQUESTS - rateLimit.currentUsage,
            resetTime: rateLimit.resetTime,
        });

    } catch (error) {
        return handleActionError(error);
    }
}
