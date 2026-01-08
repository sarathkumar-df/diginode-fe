"use server";

/**
 * Pessimistic Locking Engine
 * 
 * Implements a pessimistic locking strategy with "Stale Lock Theft" capabilities.
 * 
 * Key behaviors:
 * - Only one user can edit a map at a time
 * - Locks expire after 60 seconds without heartbeat
 * - Stale locks can be "stolen" by other users
 * - Lock loss is detected and communicated to the client
 */

import { db } from "@/lib/db";
import { getCurrentSession, getCurrentOrganizationId, getCurrentUserId } from "@/lib/auth";
import {
    AcquireLockInputSchema,
    RefreshLockInputSchema,
    ReleaseLockInputSchema,
    type AcquireLockInput,
    type RefreshLockInput,
    type ReleaseLockInput,
} from "@/lib/validation";
import {
    ActionResult,
    successResult,
    handleActionError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    LockConflictError,
    LockLostError,
} from "@/lib/errors";

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Lock timeout in milliseconds (60 seconds)
 * If no heartbeat is received within this time, the lock is considered stale
 */
const LOCK_TIMEOUT_MS = 60 * 1000;

/**
 * Lock status returned to client
 */
export type LockStatus = "ACQUIRED" | "READ_ONLY" | "LOCK_LOST";

export interface AcquireLockResult {
    status: LockStatus;
    lockedByUserId?: string;
    lockedByUserName?: string;
    lockAcquiredAt?: Date;
    wasStolen?: boolean;
}

export interface RefreshLockResult {
    status: "OK" | "LOCK_LOST";
    newHeartbeat: Date;
}

export interface ReleaseLockResult {
    released: boolean;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Check if a lock heartbeat is stale (older than LOCK_TIMEOUT_MS)
 */
function isLockStale(lockHeartbeat: Date | null): boolean {
    if (!lockHeartbeat) return true;
    const now = new Date();
    const timeSinceHeartbeat = now.getTime() - lockHeartbeat.getTime();
    return timeSinceHeartbeat > LOCK_TIMEOUT_MS;
}

/**
 * Verify the map belongs to the user's organization
 */
async function verifyMapAccess(
    mapId: string,
    organizationId: string
): Promise<{ id: string } | null> {
    const map = await db.mindMap.findFirst({
        where: {
            id: mapId,
            organizationId,
        },
        select: { id: true },
    });
    return map;
}

// =============================================================================
// ACQUIRE LOCK ACTION
// =============================================================================

/**
 * Attempt to acquire a lock on a mind map
 * 
 * Logic:
 * 1. If not locked: Acquire lock
 * 2. If locked by current user: Refresh heartbeat
 * 3. If locked but stale (>60s): STEAL the lock
 * 4. If locked by another user with valid heartbeat: Return READ_ONLY
 */
export async function acquireLock(
    input: AcquireLockInput
): Promise<ActionResult<AcquireLockResult>> {
    try {
        // Validate input
        const validated = AcquireLockInputSchema.parse(input);

        // Get current user info
        const session = await getCurrentSession();
        const userId = session.user.id;
        const organizationId = session.user.organizationId;

        // Verify map exists and belongs to user's organization
        const mapAccess = await verifyMapAccess(validated.mapId, organizationId);
        if (!mapAccess) {
            throw new NotFoundError("Mind map");
        }

        // Get current lock state
        const map = await db.mindMap.findUnique({
            where: { id: validated.mapId },
            select: {
                isLocked: true,
                lockedByUserId: true,
                lockHeartbeat: true,
                lockedByUser: {
                    select: { id: true, name: true },
                },
            },
        });

        if (!map) {
            throw new NotFoundError("Mind map");
        }

        const now = new Date();

        // Case 1: Not locked - acquire it
        if (!map.isLocked || !map.lockedByUserId) {
            await db.mindMap.update({
                where: { id: validated.mapId },
                data: {
                    isLocked: true,
                    lockedByUserId: userId,
                    lockHeartbeat: now,
                },
            });

            return successResult({
                status: "ACQUIRED",
                lockAcquiredAt: now,
                wasStolen: false,
            });
        }

        // Case 2: Already locked by current user - refresh heartbeat
        if (map.lockedByUserId === userId) {
            await db.mindMap.update({
                where: { id: validated.mapId },
                data: {
                    lockHeartbeat: now,
                },
            });

            return successResult({
                status: "ACQUIRED",
                lockAcquiredAt: now,
                wasStolen: false,
            });
        }

        // Case 3: Locked by another user - check if stale
        if (isLockStale(map.lockHeartbeat)) {
            // STEAL the lock - previous user's session expired
            const previousUserId = map.lockedByUserId;
            const previousUserName = map.lockedByUser?.name || "Unknown";

            console.warn(
                `[Lock Theft] Lock stolen from user ${previousUserId} (${previousUserName}) ` +
                `by user ${userId} on map ${validated.mapId}. ` +
                `Last heartbeat: ${map.lockHeartbeat?.toISOString()}`
            );

            await db.mindMap.update({
                where: { id: validated.mapId },
                data: {
                    lockedByUserId: userId,
                    lockHeartbeat: now,
                },
            });

            return successResult({
                status: "ACQUIRED",
                lockAcquiredAt: now,
                wasStolen: true,
            });
        }

        // Case 4: Locked by another user with valid heartbeat - READ_ONLY
        return successResult({
            status: "READ_ONLY",
            lockedByUserId: map.lockedByUserId,
            lockedByUserName: map.lockedByUser?.name || undefined,
        });

    } catch (error) {
        return handleActionError(error);
    }
}

// =============================================================================
// REFRESH LOCK (HEARTBEAT) ACTION
// =============================================================================

/**
 * Refresh the lock heartbeat
 * 
 * Should be called every 30 seconds while editing.
 * Returns LOCK_LOST if the lock was stolen (user disconnected too long).
 */
export async function refreshLock(
    input: RefreshLockInput
): Promise<ActionResult<RefreshLockResult>> {
    try {
        // Validate input
        const validated = RefreshLockInputSchema.parse(input);

        // Get current user info
        const userId = await getCurrentUserId();
        const organizationId = await getCurrentOrganizationId();

        // Verify map exists and belongs to user's organization
        const mapAccess = await verifyMapAccess(validated.mapId, organizationId);
        if (!mapAccess) {
            throw new NotFoundError("Mind map");
        }

        // Get current lock state
        const map = await db.mindMap.findUnique({
            where: { id: validated.mapId },
            select: {
                isLocked: true,
                lockedByUserId: true,
            },
        });

        if (!map) {
            throw new NotFoundError("Mind map");
        }

        // Check if the lock is still held by current user
        if (!map.isLocked || map.lockedByUserId !== userId) {
            // Lock was stolen while user was away
            return successResult({
                status: "LOCK_LOST",
                newHeartbeat: new Date(),
            });
        }

        // Update heartbeat
        const now = new Date();
        await db.mindMap.update({
            where: { id: validated.mapId },
            data: {
                lockHeartbeat: now,
            },
        });

        return successResult({
            status: "OK",
            newHeartbeat: now,
        });

    } catch (error) {
        return handleActionError(error);
    }
}

// =============================================================================
// RELEASE LOCK ACTION
// =============================================================================

/**
 * Release a lock on a mind map
 * 
 * Should be called when:
 * - User navigates away from the editor
 * - User explicitly clicks "Done editing"
 * - Browser/tab closes (via beforeunload)
 */
export async function releaseLock(
    input: ReleaseLockInput
): Promise<ActionResult<ReleaseLockResult>> {
    try {
        // Validate input
        const validated = ReleaseLockInputSchema.parse(input);

        // Get current user info
        const userId = await getCurrentUserId();
        const organizationId = await getCurrentOrganizationId();

        // Verify map exists and belongs to user's organization
        const mapAccess = await verifyMapAccess(validated.mapId, organizationId);
        if (!mapAccess) {
            throw new NotFoundError("Mind map");
        }

        // Only release if we hold the lock
        const result = await db.mindMap.updateMany({
            where: {
                id: validated.mapId,
                lockedByUserId: userId,
            },
            data: {
                isLocked: false,
                lockedByUserId: null,
                lockHeartbeat: null,
            },
        });

        return successResult({
            released: result.count > 0,
        });

    } catch (error) {
        return handleActionError(error);
    }
}

// =============================================================================
// GET LOCK STATUS ACTION
// =============================================================================

export interface GetLockStatusResult {
    isLocked: boolean;
    lockedByUserId: string | null;
    lockedByUserName: string | null;
    isLockedByCurrentUser: boolean;
    lockHeartbeat: Date | null;
    isStale: boolean;
}

/**
 * Get the current lock status for a mind map
 */
export async function getLockStatus(
    mapId: string
): Promise<ActionResult<GetLockStatusResult>> {
    try {
        const userId = await getCurrentUserId();
        const organizationId = await getCurrentOrganizationId();

        // Verify map exists and belongs to user's organization
        const mapAccess = await verifyMapAccess(mapId, organizationId);
        if (!mapAccess) {
            throw new NotFoundError("Mind map");
        }

        const map = await db.mindMap.findUnique({
            where: { id: mapId },
            select: {
                isLocked: true,
                lockedByUserId: true,
                lockHeartbeat: true,
                lockedByUser: {
                    select: { name: true },
                },
            },
        });

        if (!map) {
            throw new NotFoundError("Mind map");
        }

        return successResult({
            isLocked: map.isLocked,
            lockedByUserId: map.lockedByUserId,
            lockedByUserName: map.lockedByUser?.name || null,
            isLockedByCurrentUser: map.lockedByUserId === userId,
            lockHeartbeat: map.lockHeartbeat,
            isStale: isLockStale(map.lockHeartbeat),
        });

    } catch (error) {
        return handleActionError(error);
    }
}
