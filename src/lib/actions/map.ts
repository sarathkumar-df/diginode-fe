"use server";

/**
 * Mind Map CRUD Actions
 * 
 * Handles all mind map operations with:
 * - Organization isolation (multi-tenancy)
 * - Optimistic Concurrency Control (OCC)
 * - Lock ownership verification
 */

import { db } from "@/lib/db";
import { getCurrentSession, getCurrentOrganizationId, getCurrentUserId } from "@/lib/auth";
import {
    SaveMapInputSchema,
    CreateMapInputSchema,
    GetMapInputSchema,
    type SaveMapInput,
    type CreateMapInput,
    type GetMapInput,
} from "@/lib/validation";
import {
    ActionResult,
    successResult,
    handleActionError,
    NotFoundError,
    ForbiddenError,
    LockNotHeldError,
    VersionConflictError,
} from "@/lib/errors";
import {
    type MindMapContent,
    createDefaultMindMapContent,
    parseMindMapContent,
} from "@/lib/types/mindmap";

// =============================================================================
// TYPES
// =============================================================================

export interface MindMapWithVersion {
    id: string;
    title: string;
    content: MindMapContent;
    version: number;
    isLocked: boolean;
    lockedByUserId: string | null;
    lockedByUserName: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface MindMapListItem {
    id: string;
    title: string;
    updatedAt: Date;
    isLocked: boolean;
    lockedByUserName: string | null;
}

export interface SaveMapResult {
    newVersion: number;
    updatedAt: Date;
}

export interface CreateMapResult {
    id: string;
    title: string;
}

// =============================================================================
// GET MAP
// =============================================================================

/**
 * Get a mind map by ID with organization isolation
 */
export async function getMap(
    input: GetMapInput
): Promise<ActionResult<MindMapWithVersion>> {
    try {
        const validated = GetMapInputSchema.parse(input);
        const organizationId = await getCurrentOrganizationId();

        const map = await db.mindMap.findFirst({
            where: {
                id: validated.mapId,
                organizationId, // CRITICAL: Organization isolation
            },
            select: {
                id: true,
                title: true,
                content: true,
                version: true,
                isLocked: true,
                lockedByUserId: true,
                lockedByUser: {
                    select: { name: true },
                },
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!map) {
            throw new NotFoundError("Mind map");
        }

        return successResult({
            id: map.id,
            title: map.title,
            content: parseMindMapContent(map.content),
            version: map.version,
            isLocked: map.isLocked,
            lockedByUserId: map.lockedByUserId,
            lockedByUserName: map.lockedByUser?.name || null,
            createdAt: map.createdAt,
            updatedAt: map.updatedAt,
        });

    } catch (error) {
        return handleActionError(error);
    }
}

// =============================================================================
// GET MAP VERSION (For read-only polling)
// =============================================================================

export interface GetMapVersionResult {
    version: number;
    updatedAt: Date;
}

/**
 * Get just the version of a map (for polling in read-only mode)
 */
export async function getMapVersion(
    mapId: string
): Promise<ActionResult<GetMapVersionResult>> {
    try {
        const organizationId = await getCurrentOrganizationId();

        const map = await db.mindMap.findFirst({
            where: {
                id: mapId,
                organizationId,
            },
            select: {
                version: true,
                updatedAt: true,
            },
        });

        if (!map) {
            throw new NotFoundError("Mind map");
        }

        return successResult({
            version: map.version,
            updatedAt: map.updatedAt,
        });

    } catch (error) {
        return handleActionError(error);
    }
}

// =============================================================================
// SAVE MAP
// =============================================================================

/**
 * Save a mind map with Optimistic Concurrency Control
 * 
 * Safety Checks:
 * 1. Ownership: lockedByUserId === currentUser
 * 2. OCC: db.version === currentVersion
 */
export async function saveMap(
    input: SaveMapInput
): Promise<ActionResult<SaveMapResult>> {
    try {
        const validated = SaveMapInputSchema.parse(input);
        const userId = await getCurrentUserId();
        const organizationId = await getCurrentOrganizationId();

        // Get current map state
        const map = await db.mindMap.findFirst({
            where: {
                id: validated.mapId,
                organizationId, // Organization isolation
            },
            select: {
                version: true,
                isLocked: true,
                lockedByUserId: true,
            },
        });

        if (!map) {
            throw new NotFoundError("Mind map");
        }

        // Safety Check 1: Verify lock ownership
        if (!map.isLocked || map.lockedByUserId !== userId) {
            throw new LockNotHeldError(
                "Cannot save: You do not have the editing lock for this map"
            );
        }

        // Safety Check 2: Optimistic Concurrency Control
        if (map.version !== validated.currentVersion) {
            throw new VersionConflictError(map.version, validated.currentVersion);
        }

        // Perform the update atomically
        const updatedMap = await db.mindMap.update({
            where: { id: validated.mapId },
            data: {
                content: JSON.parse(JSON.stringify(validated.content)),
                version: { increment: 1 },
                updatedAt: new Date(),
            },
            select: {
                version: true,
                updatedAt: true,
            },
        });

        return successResult({
            newVersion: updatedMap.version,
            updatedAt: updatedMap.updatedAt,
        });

    } catch (error) {
        return handleActionError(error);
    }
}

// =============================================================================
// CREATE MAP
// =============================================================================

/**
 * Create a new mind map
 */
export async function createMap(
    input: CreateMapInput
): Promise<ActionResult<CreateMapResult>> {
    try {
        const validated = CreateMapInputSchema.parse(input);
        const userId = await getCurrentUserId();
        const organizationId = await getCurrentOrganizationId();

        const map = await db.mindMap.create({
            data: {
                title: validated.title,
                organizationId,
                ownerId: userId, // Set the creator as owner
                content: JSON.parse(JSON.stringify(createDefaultMindMapContent(validated.title))),
                version: 1,
                isLocked: false,
            },
            select: {
                id: true,
                title: true,
            },
        });

        return successResult({
            id: map.id,
            title: map.title,
        });

    } catch (error) {
        return handleActionError(error);
    }
}

// =============================================================================
// LIST MAPS
// =============================================================================

/**
 * List all mind maps in the user's organization
 */
export async function listMaps(): Promise<ActionResult<MindMapListItem[]>> {
    try {
        const organizationId = await getCurrentOrganizationId();

        const maps = await db.mindMap.findMany({
            where: {
                organizationId,
            },
            select: {
                id: true,
                title: true,
                updatedAt: true,
                isLocked: true,
                lockedByUser: {
                    select: { name: true },
                },
            },
            orderBy: {
                updatedAt: "desc",
            },
        });

        return successResult(
            maps.map((map) => ({
                id: map.id,
                title: map.title,
                updatedAt: map.updatedAt,
                isLocked: map.isLocked,
                lockedByUserName: map.lockedByUser?.name || null,
            }))
        );

    } catch (error) {
        return handleActionError(error);
    }
}

// =============================================================================
// DELETE MAP
// =============================================================================

export interface DeleteMapResult {
    deleted: boolean;
}

/**
 * Delete a mind map (only if not locked by another user)
 */
export async function deleteMap(
    mapId: string
): Promise<ActionResult<DeleteMapResult>> {
    try {
        const userId = await getCurrentUserId();
        const organizationId = await getCurrentOrganizationId();

        // Get current map state
        const map = await db.mindMap.findFirst({
            where: {
                id: mapId,
                organizationId,
            },
            select: {
                isLocked: true,
                lockedByUserId: true,
            },
        });

        if (!map) {
            throw new NotFoundError("Mind map");
        }

        // Cannot delete if locked by another user
        if (map.isLocked && map.lockedByUserId !== userId) {
            throw new ForbiddenError(
                "Cannot delete: This map is currently being edited by another user"
            );
        }

        await db.mindMap.delete({
            where: { id: mapId },
        });

        return successResult({
            deleted: true,
        });

    } catch (error) {
        return handleActionError(error);
    }
}

// =============================================================================
// UPDATE MAP TITLE
// =============================================================================

/**
 * Update a mind map's title
 */
export async function updateMapTitle(
    mapId: string,
    title: string
): Promise<ActionResult<{ title: string }>> {
    try {
        const userId = await getCurrentUserId();
        const organizationId = await getCurrentOrganizationId();

        // Verify ownership and organization
        const map = await db.mindMap.findFirst({
            where: {
                id: mapId,
                organizationId,
            },
            select: {
                isLocked: true,
                lockedByUserId: true,
            },
        });

        if (!map) {
            throw new NotFoundError("Mind map");
        }

        // Can only rename if we hold the lock
        if (map.isLocked && map.lockedByUserId !== userId) {
            throw new LockNotHeldError();
        }

        const updated = await db.mindMap.update({
            where: { id: mapId },
            data: { title },
            select: { title: true },
        });

        return successResult({
            title: updated.title,
        });

    } catch (error) {
        return handleActionError(error);
    }
}
