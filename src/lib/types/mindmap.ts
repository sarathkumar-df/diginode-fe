/**
 * MindMap Content Type Definitions
 * 
 * These types define the structure of the JSONB content field in MindMap.
 * The schema version allows for future migrations of the data structure.
 */

import type { Node, Edge } from "@xyflow/react";

// =============================================================================
// SCHEMA VERSION - Increment when making breaking changes to the structure
// =============================================================================
export const MINDMAP_SCHEMA_VERSION = 1 as const;

// =============================================================================
// NODE TYPES
// =============================================================================
export type MindMapNodeType = "topic" | "idea" | "note";

export interface MindMapNodeData {
    label: string;
    color?: string;
    description?: string;
    createdAt?: string;
    createdBy?: string;
    [key: string]: unknown;
}

// React Flow compatible node type
export type MindMapNode = Node<MindMapNodeData, MindMapNodeType>;

// =============================================================================
// EDGE TYPES
// =============================================================================
export interface MindMapEdgeData {
    label?: string;
    style?: "solid" | "dashed" | "dotted";
    [key: string]: unknown;
}

// React Flow compatible edge type
export type MindMapEdge = Edge<MindMapEdgeData>;

// =============================================================================
// MINDMAP CONTENT STRUCTURE
// =============================================================================
export interface MindMapContent {
    schemaVersion: typeof MINDMAP_SCHEMA_VERSION;
    nodes: MindMapNode[];
    edges: MindMapEdge[];
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Creates an empty MindMap content structure
 */
export function createEmptyMindMapContent(): MindMapContent {
    return {
        schemaVersion: MINDMAP_SCHEMA_VERSION,
        nodes: [],
        edges: [],
    };
}

/**
 * Creates a default MindMap with a central topic node
 */
export function createDefaultMindMapContent(
    centralLabel: string = "Central Topic"
): MindMapContent {
    const centralNode: MindMapNode = {
        id: "central",
        type: "topic",
        position: { x: 0, y: 0 },
        data: {
            label: centralLabel,
            color: "#3b82f6",
        },
    };

    return {
        schemaVersion: MINDMAP_SCHEMA_VERSION,
        nodes: [centralNode],
        edges: [],
    };
}

/**
 * Type guard to check if content matches the expected schema
 */
export function isValidMindMapContent(content: unknown): content is MindMapContent {
    if (typeof content !== "object" || content === null) {
        return false;
    }

    const obj = content as Record<string, unknown>;

    return (
        obj.schemaVersion === MINDMAP_SCHEMA_VERSION &&
        Array.isArray(obj.nodes) &&
        Array.isArray(obj.edges)
    );
}

/**
 * Safely parse MindMap content from database JSON
 */
export function parseMindMapContent(json: unknown): MindMapContent {
    if (isValidMindMapContent(json)) {
        return json;
    }

    // Return empty content if invalid
    console.warn("Invalid MindMap content detected, returning empty content");
    return createEmptyMindMapContent();
}
