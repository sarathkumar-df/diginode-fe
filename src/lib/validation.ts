/**
 * Zod Validation Schemas for Server Actions
 * 
 * All server action inputs must be validated with these schemas.
 */

import { z } from "zod";
import { MINDMAP_SCHEMA_VERSION } from "@/lib/types/mindmap";

// =============================================================================
// ID SCHEMAS
// =============================================================================

/**
 * UUID validation
 */
export const UUIDSchema = z.string().uuid("Invalid ID format");

/**
 * CUID validation (Prisma default)
 */
export const CUIDSchema = z.string().min(1, "ID is required");

// =============================================================================
// LOCK ACTION SCHEMAS
// =============================================================================

/**
 * Acquire lock input
 */
export const AcquireLockInputSchema = z.object({
    mapId: UUIDSchema,
});

export type AcquireLockInput = z.infer<typeof AcquireLockInputSchema>;

/**
 * Refresh lock (heartbeat) input
 */
export const RefreshLockInputSchema = z.object({
    mapId: UUIDSchema,
});

export type RefreshLockInput = z.infer<typeof RefreshLockInputSchema>;

/**
 * Release lock input
 */
export const ReleaseLockInputSchema = z.object({
    mapId: UUIDSchema,
});

export type ReleaseLockInput = z.infer<typeof ReleaseLockInputSchema>;

// =============================================================================
// MAP ACTION SCHEMAS
// =============================================================================

/**
 * Node schema for MindMap content
 */
export const MindMapNodeSchema = z.object({
    id: z.string(),
    type: z.enum(["topic", "idea", "note"]).optional(),
    position: z.object({
        x: z.number(),
        y: z.number(),
    }),
    data: z.object({
        label: z.string(),
        color: z.string().optional(),
        description: z.string().optional(),
        createdAt: z.string().optional(),
        createdBy: z.string().optional(),
    }).passthrough(), // Allow additional properties
}).passthrough();

/**
 * Edge schema for MindMap content
 */
export const MindMapEdgeSchema = z.object({
    id: z.string(),
    source: z.string(),
    target: z.string(),
    type: z.string().optional(),
    data: z.object({
        label: z.string().optional(),
        style: z.enum(["solid", "dashed", "dotted"]).optional(),
    }).optional(),
}).passthrough();

/**
 * MindMap content schema
 */
export const MindMapContentSchema = z.object({
    schemaVersion: z.literal(MINDMAP_SCHEMA_VERSION),
    nodes: z.array(MindMapNodeSchema),
    edges: z.array(MindMapEdgeSchema),
});

export type ValidatedMindMapContent = z.infer<typeof MindMapContentSchema>;

/**
 * Save map input
 */
export const SaveMapInputSchema = z.object({
    mapId: UUIDSchema,
    content: MindMapContentSchema,
    currentVersion: z.number().int().positive("Version must be a positive integer"),
});

export type SaveMapInput = z.infer<typeof SaveMapInputSchema>;

/**
 * Create map input
 */
export const CreateMapInputSchema = z.object({
    title: z.string()
        .min(1, "Title is required")
        .max(255, "Title must be 255 characters or less"),
});

export type CreateMapInput = z.infer<typeof CreateMapInputSchema>;

/**
 * Get map input
 */
export const GetMapInputSchema = z.object({
    mapId: UUIDSchema,
});

export type GetMapInput = z.infer<typeof GetMapInputSchema>;

// =============================================================================
// AI ACTION SCHEMAS
// =============================================================================

/**
 * Generate ideas input
 */
export const GenerateIdeasInputSchema = z.object({
    nodeText: z.string()
        .min(1, "Node text is required")
        .max(2000, "Node text must be 2000 characters or less"),
    context: z.string().max(5000).optional(),
});

export type GenerateIdeasInput = z.infer<typeof GenerateIdeasInputSchema>;

/**
 * AI response schema for idea generation
 */
export const AIIdeasResponseSchema = z.object({
    ideas: z.array(z.object({
        label: z.string(),
        description: z.string().optional(),
        type: z.enum(["topic", "idea", "note"]).default("idea"),
    })).min(1).max(10),
});

export type AIIdeasResponse = z.infer<typeof AIIdeasResponseSchema>;

/**
 * Generate suggestions input
 */
export const GenerateSuggestionsInputSchema = z.object({
    nodeText: z.string()
        .min(1, "Node text is required")
        .max(2000, "Node text must be 2000 characters or less"),
    userPrompt: z.string()
        .min(1, "Prompt is required")
        .max(1000, "Prompt must be 1000 characters or less"),
    context: z.string().max(5000).optional(),
});

export type GenerateSuggestionsInput = z.infer<typeof GenerateSuggestionsInputSchema>;

/**
 * AI response schema for suggestions
 */
export const AISuggestionsResponseSchema = z.object({
    suggestions: z.array(z.object({
        label: z.string(),
        description: z.string().optional(),
        type: z.enum(["topic", "idea", "note"]).default("idea"),
        reasoning: z.string().optional(), // Why this suggestion was made
    })).min(1).max(10),
});

export type AISuggestionsResponse = z.infer<typeof AISuggestionsResponseSchema>;
